import axios from 'axios';
import { Injectable } from '@nestjs/common';

const chatId = process.env.LOG_GROUP_ID;
const threadIds = {
  error: process.env.LOG_ERROR_THREAD_ID,
  info: process.env.LOG_INFO_THREAD_ID,
};

@Injectable()
export class TelegramLoggerService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly isLocalhost = process.env.NODE_ENV === 'localhost';

  async logError(message: string) {
    await this.sendMessage('error', message);
  }

  async logEvent(message: string) {
    await this.sendMessage('info', message);
  }

  private async sendMessage(type: 'error' | 'info', message: string, reply_markup?: object) {
    if (!this.botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }
    const threadId = threadIds[type];
    let formattedMessage = message;
    if (this.isLocalhost) {
      if (type === 'info') formattedMessage = '💬 Info:\n'.concat(message);
      else if (type === 'error') formattedMessage = '❗ Error:\n'.concat(message);
    }
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: `${this.escapeHtml(formattedMessage)}`,
      message_thread_id: threadId,
      parse_mode: 'HTML',
    };
    if (reply_markup) {
      body['reply_markup'] = reply_markup;
    }
    try {
      await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Failed to send Telegram log:', err);
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
