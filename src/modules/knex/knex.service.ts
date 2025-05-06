import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import knex, { Knex } from 'knex';
import config from 'knexfile';

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  public knex: Knex;

  onModuleInit() {
    this.knex = knex(config.development);
  }

  onModuleDestroy() {
    if (this.knex) {
      this.knex.destroy();
    }
  }
}