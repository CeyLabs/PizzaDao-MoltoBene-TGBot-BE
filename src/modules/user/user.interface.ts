export interface IUser {
  telegram_id: string | null;
  username: string | null;
  tg_first_name: string | null;
  tg_last_name: string | null;
  pizza_name: string | null;
  discord_name: string | null;
  mafia_movie: string | null;
  ninja_turtle_character: string[] | null;
  pizza_topping: string | null;
  role?: string | null;
}
