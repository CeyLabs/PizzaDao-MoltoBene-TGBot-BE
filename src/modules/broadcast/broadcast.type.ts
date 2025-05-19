export interface UserAccess {
  role: string;
  city_data?: { city_name: string }[];
  region_name?: string;
  country_name?: string;
}

export interface AdminAccessResult {
  role: 'admin';
  city_data: {
    city_id: string;
    city_name: string;
    group_id: string | null;
    telegram_link: string | null;
  }[];
  region_data: {
    region_id: string;
    region_name: string;
    country_id: string;
    country_name: string;
    city_id: string;
    city_name: string;
    group_id: string | null;
    telegram_link: string | null;
  }[];
  country_data: {
    country_id: string;
    country_name: string;
    city_data: {
      city_id: string;
      city_name: string;
      group_id: string | null;
      telegram_link: string | null;
    }[];
  }[];
}

export interface UserAccessInfo {
  userAccess: UserAccess[] | 'no access' | AdminAccessResult;
  role: string;
  userId: number | undefined;
}
