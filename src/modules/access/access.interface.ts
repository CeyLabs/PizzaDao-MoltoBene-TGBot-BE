export interface IAccess {
  user_telegram_id: string | number;
  city_id: string;
  role: string;
}

export const USER_ROLE = {
  HOST: 'host',
  UNDERBOSS: 'underboss',
  ADMIN: 'admin',
};
