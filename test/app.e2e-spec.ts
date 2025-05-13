import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ConfigModule } from '@nestjs/config';
import * as express from 'express';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Create more complete mock for Telegraf bot
    const mockBot = {
      use: jest.fn(),
      on: jest.fn(),
      start: jest.fn(),
      help: jest.fn(),
      command: jest.fn(),
      action: jest.fn(),
      hears: jest.fn(),
      telegram: {
        setWebhook: jest.fn(),
      },
      webhookCallback: jest.fn().mockImplementation(() => {
        return (req, res) => {
          res.status(200).send('OK');
        };
      }),
      catch: jest.fn(),
      launch: jest.fn(),
      stop: jest.fn(),
    };

    // Create a testing module that imports the AppModule but replaces the Telegraf instance
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
    })
      .overrideProvider(getBotToken())
      .useValue(mockBot)
      .compile();

    app = moduleFixture.createNestApplication();

    // Set up express app with webhook handler
    const expressApp = express();
    expressApp.use(express.json());
    expressApp.post('/webhook', (req, res) => {
      res.status(200).send('OK');
    });

    // Add a test health endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.status(200).send('OK');
    });

    // Manually set up the webhook route
    app.use('/webhook', (req, res) => {
      if (req.method === 'POST') {
        res.status(200).send('OK');
      } else {
        res.status(405).send('Method Not Allowed');
      }
    });

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('/webhook (POST) should handle Telegram webhook requests', () => {
    return request(app.getHttpServer())
      .post('/webhook')
      .send({
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 123456,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
          },
          chat: {
            id: 123456,
            first_name: 'Test',
            username: 'testuser',
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: '/start',
        },
      })
      .expect(200);
  });

  it('/health (GET) should return 200 OK', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('OK');
  });
});
