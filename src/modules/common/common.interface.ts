export type UserFlow = 'welcome' | 'broadcast' | 'idle';

export interface IUserState {
  flow: UserFlow;
  messages?: any[];
  step?: string;
  [key: string]: unknown;
}
