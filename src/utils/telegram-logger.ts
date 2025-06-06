import axios from 'axios';

const chatId = process.env.LOG_GROUP_ID;
const threadIds = {
  error: process.env.LOG_ERROR_THREAD_ID,
  info: process.env.LOG_INFO_THREAD_ID,
  warning: process.env.LOG_INFO_THREAD_ID,
};

export class TelegramLogger {
  private static readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private static readonly isLocalhost = process.env.NODE_ENV === 'localhost';

  static async error(message: string, context?: any, userId?: string) {
    const formatted = TelegramLogger.formatLog('ERROR', message, String(context), userId);
    await TelegramLogger.sendMessage('error', formatted);
  }

  static async info(message: string, context?: string, userId?: string) {
    const formatted = TelegramLogger.formatLog('INFO', message, context, userId);
    await TelegramLogger.sendMessage('info', formatted);
  }

  static async warning(message: string, context?: string, userId?: string) {
    const formatted = TelegramLogger.formatLog('WARNING', message, context, userId);
    await TelegramLogger.sendMessage('warning', formatted);
  }

  private static formatLog(
    level: 'INFO' | 'ERROR' | 'WARNING',
    message: string,
    context?: string,
    userId?: string,
  ): string {
    let emoji = 'ℹ️';
    if (level === 'ERROR') emoji = '❌';
    if (level === 'WARNING') emoji = '⚠️';
    const timestamp = new Date().toISOString();

    let header = `${emoji} <b>[${level}]</b> | <i>${timestamp}</i>`;
    if (userId) header += ` | <code>User: ${userId}</code>`;
    let body = `<pre>${TelegramLogger.escapeHtml(message)}</pre>`;
    if (context && level === 'INFO') {
      body += `\n<b>Context:</b> <pre>${TelegramLogger.escapeHtml(context)}</pre>`;
    } else if (context && level === 'ERROR') {
      body += `\n<b>ERROR:</b> <code>${TelegramLogger.escapeHtml(context)}</code>`;
    }

    return `${header}\n${body}`;
  }

  private static async sendMessage(
    type: 'error' | 'info' | 'warning',
    message: string,
    reply_markup?: object,
  ) {
    if (!TelegramLogger.botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }
    const threadId = threadIds[type];
    let formattedMessage = message;
    if (TelegramLogger.isLocalhost) {
      if (type === 'info') formattedMessage = '💬 Info:\n'.concat(message);
      else if (type === 'error') formattedMessage = '❗ Error:\n'.concat(message);
      else if (type === 'warning') formattedMessage = '⚠️ Warning:\n'.concat(message);
    }
    const url = `https://api.telegram.org/bot${TelegramLogger.botToken}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: `${formattedMessage}`,
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

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
