import { Context } from 'telegraf';

interface SessionData {
  broadcastTarget?: 'all' | 'subgroup' | null;
}

export interface MyContext extends Context {
  session: SessionData;
}
