export interface ICity {
  id: string;
  name: string;
  country_id: string;
  telegram_link?: string;
}

export interface ICityForVars {
  city_name: string;
  group_id?: string | null;
  telegram_link?: string | null;
}
