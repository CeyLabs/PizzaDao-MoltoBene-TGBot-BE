/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeService } from './welcome.service';
import { UserService } from '../user/user.service';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { Context } from 'telegraf';
import { IUser } from '../user/user.interface';
import { MembershipService } from '../membership/membership.service';
import { CallbackQuery, Message } from 'telegraf/types';

// Define a more complete mock message type that extends the required Telegraf types
type MockMessage = Partial<Message.TextMessage> & {
  message_id: number;
  date: number;
  chat: {
    id: number;
    type: string;
    first_name?: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
  };
  text?: string;
  edit_date?: undefined;
  voice?: {
    duration: number;
    mime_type: string;
    file_id: string;
    file_unique_id: string;
    file_size: number;
  };
};

type MockContext = Partial<Context> & {
  message?: MockMessage;
  callbackQuery?: CallbackQuery;
  reply?: jest.Mock;
  replyWithMarkdownV2?: jest.Mock;
  sendPhoto?: jest.Mock;
};

describe('WelcomeService', () => {
  let service: WelcomeService;
  let userService: jest.Mocked<UserService>;
  let membershipService: jest.Mocked<MembershipService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WelcomeService,
        {
          provide: UserService,
          useValue: {
            isUserRegistered: jest.fn(),
            findUser: jest.fn(),
            getAllRegions: jest.fn(),
          },
        },
        {
          provide: CountryService,
          useValue: {
            getCountryById: jest.fn(),
          },
        },
        {
          provide: CityService,
          useValue: {
            getCityByGroupId: jest.fn(),
            getCityById: jest.fn(),
          },
        },
        {
          provide: MembershipService,
          useValue: {
            getCitiesByUser: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<WelcomeService>(WelcomeService);
    userService = module.get<UserService>(UserService) as jest.Mocked<UserService>;
    membershipService = module.get<MembershipService>(
      MembershipService,
    ) as jest.Mocked<MembershipService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleStartCommand', () => {
    it('should show profile if user is already registered', async () => {
      const mockContext: MockContext = {
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 123456,
            type: 'private',
            first_name: 'Test',
          },
          from: {
            id: 123456,
            is_bot: false,
            first_name: 'Test',
          },
          text: '/start',
          edit_date: undefined,
          voice: {
            duration: 0,
            mime_type: 'audio/ogg',
            file_id: 'test-file-id',
            file_unique_id: 'test-unique-id',
            file_size: 0,
          },
        } as MockMessage,
        reply: jest.fn().mockResolvedValue(undefined),
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
        sendPhoto: jest.fn().mockResolvedValue(undefined),
      };

      const handleProfile = jest.spyOn(service, 'handleProfile').mockResolvedValue(undefined);
      const isUserRegistered = jest.spyOn(userService, 'isUserRegistered').mockResolvedValue(true);

      await service.handleStartCommand(mockContext as unknown as Context);

      expect(isUserRegistered).toHaveBeenCalledWith('123456');
      expect(handleProfile).toHaveBeenCalledWith(mockContext);
    });

    it('should send welcome message if user is not registered', async () => {
      const mockContext: MockContext = {
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 123456,
            type: 'private',
            first_name: 'Test',
          },
          from: {
            id: 123456,
            is_bot: false,
            first_name: 'Test',
          },
          text: '/start',
          edit_date: undefined,
          voice: {
            duration: 0,
            mime_type: 'audio/ogg',
            file_id: 'test-file-id',
            file_unique_id: 'test-unique-id',
            file_size: 0,
          },
        } as MockMessage,
        reply: jest.fn().mockResolvedValue(undefined),
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
        sendPhoto: jest.fn().mockResolvedValue(undefined),
      };

      const isUserRegistered = jest.spyOn(userService, 'isUserRegistered').mockResolvedValue(false);

      await service.handleStartCommand(mockContext as unknown as Context);

      expect(isUserRegistered).toHaveBeenCalledWith('123456');
      expect(mockContext.sendPhoto).toHaveBeenCalledTimes(1);
      expect(mockContext.sendPhoto).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          caption: expect.stringContaining('Welcome to PizzaDAO'),
          parse_mode: 'MarkdownV2',
          reply_markup: expect.any(Object),
        }),
      );
    });
  });

  describe('handleProfile', () => {
    it('should show error message if user is not registered', async () => {
      const mockContext: MockContext = {
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 123456,
            type: 'private',
            first_name: 'Test',
          },
          from: {
            id: 123456,
            is_bot: false,
            first_name: 'Test',
          },
          edit_date: undefined,
          voice: {
            duration: 0,
            mime_type: 'audio/ogg',
            file_id: 'test-file-id',
            file_unique_id: 'test-unique-id',
            file_size: 0,
          },
        } as MockMessage,
        callbackQuery: undefined,
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
      };

      const findUser = jest.spyOn(userService, 'findUser').mockResolvedValue(undefined);

      await service.handleProfile(mockContext as unknown as Context);

      expect(findUser).toHaveBeenCalledWith('123456');
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('❌ *You are not registered yet\\!*'),
      );
    });

    it('should display user profile if user is registered', async () => {
      const mockContext: MockContext = {
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 123456,
            type: 'private',
            first_name: 'Test',
          },
          from: {
            id: 123456,
            is_bot: false,
            first_name: 'Test',
          },
          edit_date: undefined,
          voice: {
            duration: 0,
            mime_type: 'audio/ogg',
            file_id: 'test-file-id',
            file_unique_id: 'test-unique-id',
            file_size: 0,
          },
        } as MockMessage,
        callbackQuery: undefined,
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
      };

      const mockUser: IUser = {
        telegram_id: '123456',
        username: 'testuser',
        tg_first_name: 'Test',
        tg_last_name: 'User',
        pizza_name: 'TestPizza',
        discord_name: 'TestUser#1234',
        mafia_movie: 'The Godfather',
        ninja_turtle_character: ['Donatello', 'Michelangelo'],
        pizza_topping: 'Pepperoni',
      };

      const findUser = jest.spyOn(userService, 'findUser').mockResolvedValue(mockUser);
      const getCitiesByUser = jest
        .spyOn(membershipService, 'getCitiesByUser')
        .mockResolvedValue([]);

      await service.handleProfile(mockContext as unknown as Context);

      expect(findUser).toHaveBeenCalledWith('123456');
      expect(getCitiesByUser).toHaveBeenCalledWith('123456');
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('📋 *Your Profile*'),
        expect.objectContaining({
          reply_markup: expect.any(Object),
        }),
      );
    });
  });
});
