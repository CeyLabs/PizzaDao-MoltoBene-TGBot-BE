/**
 * @fileoverview User controller for handling user-related HTTP requests
 * @module user.controller
 */

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

/**
 * Guard for protecting routes with API key authentication
 * @class ApiKeyGuard
 * @implements {CanActivate}
 * @description Validates the presence and correctness of the API key in request headers
 */
@Injectable()
class ApiKeyGuard implements CanActivate {
  /**
   * Validates the API key from request headers
   * @param {ExecutionContext} context - The execution context
   * @returns {boolean} True if the API key is valid
   * @throws {UnauthorizedException} If the API key is invalid or missing
   */
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    if (apiKey && apiKey === process.env.USER_API_KEY) {
      return true;
    }
    throw new UnauthorizedException('Invalid API key');
  }
}

/**
 * Controller for handling user-related HTTP requests
 * @class UserController
 * @description Provides endpoints for user management operations
 */
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves all users
   * @returns {Promise<any>} Array of user objects
   * @protected Requires valid API key
   */
  @UseGuards(ApiKeyGuard)
  @Get('')
  async getUsers(): Promise<any> {
    const users = await this.userService.getAllUsers();
    return users;
  }
}
