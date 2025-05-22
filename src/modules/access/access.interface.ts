export interface IRegionAccess {
  id: string;
  user_telegram_id: string | number;
  region_id: string;
  created_at: Date;
}

export interface ICountryAccess {
  id: string;
  user_telegram_id: string | number;
  country_id: string;
  created_at: Date;
}

export interface ICityAccess {
  id: string;
  user_telegram_id: string | number;
  city_id: string;
  created_at: Date;
}
