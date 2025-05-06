import { Injectable } from '@nestjs/common';
import { Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';

@Update()
@Injectable()
export class GeneralService {
  constructor(private readonly userRegistryService: UsersService) {}

  isUserRegistered(userId: number): Promise<boolean> {
    return this.userRegistryService.isUserRegistered(userId);
  }
}
