export interface BroadcastMessage {
  scope: 'all' | 'city';
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
