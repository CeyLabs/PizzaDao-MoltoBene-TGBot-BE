import { Update } from 'nestjs-telegraf';
import {} from 'telegraf';
import { AppService } from './app.service';
import { Controller } from '@nestjs/common';

@Update()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
