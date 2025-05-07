export interface UserRegistrationData {
    telegram_id: number;
    group_id?: string | null,
    username: string | null;
    tg_first_name: string | null;
    tg_last_name: string | null;
    custom_full_name: string | null;
    country: string | null;
    city: string | null;
    role: string;
    mafia_movie: string | null;
    ninja_turtle_character: string | null;
    pizza_topping: string | null;
  }