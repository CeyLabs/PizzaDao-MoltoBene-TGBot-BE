import { Context } from 'telegraf';

interface SessionData {
  broadcastTarget?: 'all' | 'supergroup' | 'subgroup' | null;
}

export interface MyContext extends Context {
  session: SessionData;
}
