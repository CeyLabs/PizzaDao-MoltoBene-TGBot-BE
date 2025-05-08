import * as dotenv from 'dotenv';
import type { Knex } from 'knex';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      database: process.env.PG_DB,
      user: process.env.PG_USER,
      password: process.env.PG_PW,
    },
    pool: {
      min: 2,
      max: 50,
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/fixtures',
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      database: process.env.PG_DB,
      user: process.env.PG_USER,
      password: process.env.PG_PW,
    },
    pool: {
      min: 2,
      max: 50,
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/fixtures',
    },
  },

  localhost: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 3009,
      database: 'pizzadao',
      user: 'pizzadao',
      password: 'pizzadao',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/fixtures',
    },
  },
};

export default config;
