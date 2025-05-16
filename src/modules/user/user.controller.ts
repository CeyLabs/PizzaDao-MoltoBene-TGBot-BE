import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';

// Simple API Key Guard implementation
@Injectable()
class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    if (apiKey && apiKey === process.env.USER_API_KEY) {
      return true;
    }
    throw new UnauthorizedException('Invalid API key');
  }
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(ApiKeyGuard)
  @Get('')
  async getUsers(): Promise<any> {
    const users = await this.userService.getAllUsers();
    return users;
  }
}
