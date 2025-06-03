/**
 * @fileoverview Interface definitions for event details
 * @module event-detail.interface
 */

/**
 * Interface representing event details
 * @interface IEventDetail
 * @description Defines the structure of event details including timing, location, and metadata
 */
export interface IEventDetail {
  /** Unique identifier for the event */
  id: string;
  /** Telegram group ID associated with the event */
  group_id: string;
  /** Whether the event is for a single person */
  is_one_person: boolean;
  /** Name of the event */
  name: string | null;
  /** URL-friendly slug for the event */
  slug: string | null;
  /** Country where the event is taking place */
  country: string;
  /** URL of the event's image */
  image_url: string | null;
  /** Start date of the event in YYYY-MM-DD format */
  start_date: string | null;
  /** Start time of the event in HH:mm format */
  start_time: string | null;
  /** End date of the event in YYYY-MM-DD format */
  end_date: string | null;
  /** End time of the event in HH:mm format */
  end_time: string | null;
  /** Timezone of the event */
  timezone: string | null;
  /** Physical address of the event venue */
  address: string | null;
  /** General location description of the event */
  location: string | null;
  /** Unlock Protocol link for event registration */
  unlock_link: string | null;
  /** Year when the event is taking place */
  year: number | null;
}
