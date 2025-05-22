export interface IUserAccess {
  role: string;
  city_data?: { city_name: string }[];
  region_name?: string;
  country_name?: string;
}

export interface IAdminAccessResult {
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

export interface IUserAccessInfo {
  userAccess: IUserAccess[] | IAdminAccessResult | null;
  role: string;
  userId: number | undefined;
}

export interface IPostMessage {
  text: string | null;
  isPinned: boolean;
  urlButtons: { text: string; url: string }[];
  mediaUrl: string | null;
  mediaType?: 'photo' | 'video' | 'document' | 'animation';
  messageId?: number;
}

export interface IBroadcastSession {
  step: 'awaiting_message' | 'creating_post' | 'idle';
  selectedAction?: string;
  messages: IPostMessage[];
  currentAction?: 'attach_media' | 'add_url_buttons';
  currentMessageIndex?: number;
}
