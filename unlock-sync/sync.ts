import axios from 'axios';
const csv = require('csv-parser');
import knex from 'knex';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

interface CSVRow {
  [key: string]: string;
  'Event Link': string;
  'Group ID': string;
  Address: string;
  City: string;
  Country: string;
}

interface UnlockEvent {
  name: string;
  slug: string;
  image: string;
  ticket: {
    event_start_date: string;
    event_start_time: string;
    event_end_date: string;
    event_end_time: string;
    event_timezone: string;
    event_is_in_person: boolean;
    event_address: string;
    event_location: string;
  };
}

const START_ROW = 2;
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTFiB1KFJmcH5TyCgI86l2PscPhgesWdPVzGid8_D_WuDy3zJXNSOgFGuEo_dl7B4Xifnk-aqyGR9hw/pub?output=csv';

// Initialize Knex with environment variables
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    user: process.env.PG_USER,
    password: process.env.PG_PW,
    database: process.env.PG_DB,
  },
});

/**
 * Extracts event slug from Unlock event URL
 */
function extractEventSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean); // remove empty parts

    const eventIndex = pathParts.indexOf('event');
    if (eventIndex !== -1 && pathParts.length > eventIndex + 1) {
      return pathParts[eventIndex + 1];
    }

    return pathParts[pathParts.length - 1] || null;
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
}

/**
 * Fetches event details from Unlock API
 */
async function fetchEventDetails(slug: string): Promise<UnlockEvent | null> {
  try {
    const response = await axios.get(`https://locksmith.unlock-protocol.com/v2/events/${slug}`);
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch event details for slug ${slug}:`, error);
    return null;
  }
}

/**
 * Reads CSV data from a URL starting from a specified row
 */
async function readCSVFromURL(url: string, startRow: number = 1): Promise<CSVRow[]> {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      const results: CSVRow[] = [];
      let currentRow = 0;

      response.data
        .pipe(csv())
        .on('data', (data: CSVRow) => {
          currentRow++;
          if (currentRow >= startRow) {
            results.push(data);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch CSV: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Processes CSV data and writes to database
 */
async function processCSVData(data: CSVRow[]): Promise<void> {
  for (const row of data) {
    if (!row['Event Link']) continue;

    const groupId = row['Group ID'].replace('#', '');
    if (!groupId) continue;

    const existingCity = await db('city').where('group_id', groupId).first();
    if (!existingCity) {
      console.log(`WARN: City ${row['City']} not found in db, skipping...`);
      continue;
    }

    // Check if group_id already exists in the database
    const existingEvent = await db('event_detail').where('group_id', groupId).first();

    const eventSlug = extractEventSlug(row['Event Link']);
    if (!eventSlug) continue;

    if (existingEvent) {
      console.log(`WARN: Event ${eventSlug} already exists in db, skipping...`);
      continue;
    }

    const eventDetails = await fetchEventDetails(eventSlug);
    if (!eventDetails) continue;

    if (!eventDetails.ticket.event_address || !eventDetails.ticket.event_location) {
      console.log(`WARN: Event ${eventSlug} has no address or location, skipping...`);
      continue;
    }

    const year = new Date(eventDetails.ticket.event_start_date).getFullYear();

    try {
      await db('event_detail').insert({
        group_id: groupId,
        is_one_person: true,
        name: eventDetails.name,
        slug: eventDetails.slug,
        image_url: eventDetails.image,
        start_date: eventDetails.ticket.event_start_date,
        start_time: eventDetails.ticket.event_start_time,
        end_date: eventDetails.ticket.event_end_date,
        end_time: eventDetails.ticket.event_end_time,
        timezone: eventDetails.ticket.event_timezone,
        address: eventDetails.ticket.event_address,
        location: eventDetails.ticket.event_location,
        year: year,
      });
      console.log(`OK: Successfully inserted event: ${eventDetails.slug}`);
    } catch (error) {
      console.error(`ERR: Failed to insert event ${eventDetails.name}:`, error);
    }
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('Reading CSV...');
    const data = await readCSVFromURL(CSV_URL, START_ROW);
    console.log(`${data.length} events found.\n`);
    await processCSVData(data);
    console.log('CSV processing completed');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await db.destroy();
  }
}

main();
