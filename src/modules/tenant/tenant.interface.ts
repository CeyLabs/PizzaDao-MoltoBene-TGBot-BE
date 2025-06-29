export interface ITenant {
  id: string;
  name: string;
  bot_token: string;
  bot_username?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}
