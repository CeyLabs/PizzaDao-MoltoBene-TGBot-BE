import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { GeneralModule } from './modules/general/general.module';
import { UsersModule } from './modules/users/users.module';
import { UsersService } from './modules/users/users.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token:
        process.env.TELEGRAM_BOT_TOKEN ||
        (() => {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined');
        })(),
    }),
    WelcomeModule,
    GeneralModule,
    UsersModule,
  ],
  providers: [AppService, UsersService],
})
export class AppModule {}
