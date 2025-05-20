export type UserFlow = 'welcome' | 'broadcast' | 'idle';

export interface UserState {
  flow: UserFlow;
  messages?: any[];
  step?: string;
  [key: string]: unknown;
}
