import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private registeredUsers = new Set<number>();

  addUser(userId: number): void {
    this.registeredUsers.add(userId);
  }

  isUserRegistered(userId: number): boolean {
    return this.registeredUsers.has(userId);
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }
}
