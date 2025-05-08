import { IUser } from '../user/user.interface';

export interface IUserRegistrationData extends IUser {
  group_id?: string | number | null;
  region_id?: string | null;
}
