import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/modules/knex/knex.service';
import { IUser } from 'src/modules/user/user.interface';
import { Context, MiddlewareFn } from 'telegraf';

@Injectable()
export class RoleMiddleware {
  constructor(private readonly knexService: KnexService) {}

  roleValidationMiddleware(): MiddlewareFn<Context> {
    return async (ctx, next) => {
      if (!ctx.from?.id) {
        return ctx.reply('Invalid context or user information missing.');
      }

      const user = await this.knexService
        .knex<IUser>('user')
        .where('telegram_id', ctx.from.id)
        .select('role')
        .first();

      if (!user) {
        return ctx.reply('You are not registered in the system.');
      }

      ctx.state.userRole = user.role;

      return next();
    };
  }
}
