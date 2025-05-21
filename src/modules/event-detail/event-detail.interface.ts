export interface IEventDetail {
  id: string;
  group_id: string;
  is_one_person: boolean;
  name: string;
  slug: string;
  image_url: string | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  timezone: string | null;
  address: string | null;
  location: string | null;
  year: number | null;
}
