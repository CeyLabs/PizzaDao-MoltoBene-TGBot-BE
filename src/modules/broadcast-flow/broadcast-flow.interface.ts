export interface BroadcastMessage {
  scope: 'all' | 'supergroup' | 'allsubgroups' | 'city';
  city?: string;
  place?: string;
  date?: string;
  time?: string;
  externalLinks?: string;
  content: string;
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
  pin?: boolean;
}

export interface BroadcastResult {
  success: boolean;
  message: string;
  groupCount: number;
  failedGroups?: string[];
  errorDetails?: Record<string, string>;
}

export interface BroadcastState {
  step: string;
  message: BroadcastMessage;
}

export interface CityData {
  id: string;
  name: string;
  venues: string[];
}

export interface TelegramGroup {
  id: string;
  name: string;
  chatId?: string;
  city?: string;
  type: 'group' | 'supergroup' | 'subgroup' | 'channel';
}

export interface Admin {
  userId: number;
  name: string;
  role: 'super-admin' | 'admin';
  cities: string[];
}
