export interface TelegramGroup {
  id: string;
  name: string;
  chatId: string;
  city: string;
  type: 'group' | 'supergroup' | 'channel';
}
