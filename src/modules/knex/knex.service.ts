import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import knex, { Knex } from 'knex';
import config from '../../../knexfile';

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  public knex: Knex;
  private readonly logger = new Logger(KnexService.name);
  private readonly NODE_ENV = process.env.NODE_ENV || 'development';

  onModuleInit() {
    // Use the appropriate environment configuration
    const configToUse = config[this.NODE_ENV] || config.development;
    
    // Ensure pool settings are properly configured
    const poolConfig: Knex.PoolConfig = {
      min: 2,
      max: 50,
      // Add a connection validator
      afterCreate: (conn: any, done: Function) => {
        // Setup connection
        conn.query('SELECT 1', (err: any) => {
          if (err) {
            this.logger.error('Error during connection validation', err);
            done(err, conn);
          } else {
            this.logger.log('Database connection established successfully');
            done(null, conn);
          }
        });
      },
      // Set proper timeouts to prevent idle connection termination
      idleTimeoutMillis: 30000, // 30 seconds
      acquireTimeoutMillis: 30000, // 30 seconds
      // Ping the connection to keep it alive
      createTimeoutMillis: 30000, // 30 seconds
      // Check if the connection is still valid before using it
      reapIntervalMillis: 1000, // 1 second
      createRetryIntervalMillis: 100, // 0.1 seconds
    };

    // Initialize knex with enhanced configuration
    this.knex = knex({
      ...configToUse,
      pool: {
        ...(configToUse.pool || {}),
        ...poolConfig,
      },
    });

    // Log when connections open or close for debugging
    this.knex.on('query-error', (error, query) => {
      this.logger.error(`Query error: ${error.message}`, {
        error,
        query: query.sql,
      });
    });
  }

  async onModuleDestroy() {
    if (this.knex) {
      try {
        await this.knex.destroy();
        this.logger.log('Database connection closed gracefully');
      } catch (error) {
        this.logger.error('Error closing database connection', error);
      }
    }
  }
}
