import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  logLevel: process.env.LOG_LEVEL || 'log',
};

// Validate required environment variables
export const validateConfig = () => {
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is not defined`);
    }
  }
};
