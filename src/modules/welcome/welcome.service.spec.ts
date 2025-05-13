import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeService } from './welcome.service';
import { UserService } from '../user/user.service';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { Context } from 'telegraf';
import { IUser } from '../user/user.interface';
import { ICountry } from '../country/country.interface';
import { ICity } from '../city/city.interface';

describe('WelcomeService', () => {
  let service: WelcomeService;
  let userService: UserService;
  let countryService: CountryService;
  let cityService: CityService;

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
      ],
    }).compile();

    service = module.get<WelcomeService>(WelcomeService);
    userService = module.get<UserService>(UserService);
    countryService = module.get<CountryService>(CountryService);
    cityService = module.get<CityService>(CityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleStartCommand', () => {
    it('should show profile if user is already registered', async () => {
      // Mock context
      const mockContext = {
        message: {
          from: { id: 123456 },
          text: '/start',
        },
        reply: jest.fn().mockResolvedValue(undefined),
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
        sendPhoto: jest.fn().mockResolvedValue(undefined),
      } as unknown as Context;

      jest.spyOn(service, 'handleProfile').mockResolvedValue(undefined);
      jest.spyOn(userService, 'isUserRegistered').mockResolvedValue(true);

      await service.handleStartCommand(mockContext);

      expect(userService.isUserRegistered).toHaveBeenCalledWith(123456);
      expect(service.handleProfile).toHaveBeenCalledWith(mockContext);
    });

    it('should send welcome message if user is not registered', async () => {
      // Mock context
      const mockContext = {
        message: {
          from: { id: 123456 },
          text: '/start',
        },
        reply: jest.fn().mockResolvedValue(undefined),
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
        sendPhoto: jest.fn().mockResolvedValue(undefined),
      } as unknown as Context;

      jest.spyOn(userService, 'isUserRegistered').mockResolvedValue(false);

      await service.handleStartCommand(mockContext);

      expect(userService.isUserRegistered).toHaveBeenCalledWith(123456);
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
      // Mock context
      const mockContext = {
        message: {
          from: { id: 123456 },
        },
        callbackQuery: undefined,
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
      } as unknown as Context;

      jest.spyOn(userService, 'findUser').mockResolvedValue(undefined);

      await service.handleProfile(mockContext);

      expect(userService.findUser).toHaveBeenCalledWith(123456);
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('❌ *You are not registered yet\\!*'),
      );
    });

    it('should display user profile if user is registered', async () => {
      // Mock context
      const mockContext = {
        message: {
          from: { id: 123456 },
        },
        callbackQuery: undefined,
        replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
      } as unknown as Context;

      const mockUser: IUser = {
        telegram_id: 123456,
        username: 'testuser',
        tg_first_name: 'Test',
        tg_last_name: 'User',
        pizza_name: 'TestPizza',
        discord_name: 'TestUser#1234',
        country_id: '1',
        city_id: '1',
        role: 'user',
        mafia_movie: 'The Godfather',
        ninja_turtle_character: ['Donatello', 'Michelangelo'],
        pizza_topping: 'Pepperoni',
      };

      const mockCountry: ICountry = {
        id: 1,
        name: 'United States',
        region_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockCity: ICity = {
        id: '1',
        name: 'New York',
        country_id: '1',
      };

      // Use explicit mock implementations instead of asserting parameter types
      jest.spyOn(userService, 'findUser').mockResolvedValue(mockUser);
      jest.spyOn(countryService, 'getCountryById').mockImplementation(async () => mockCountry);
      jest.spyOn(cityService, 'getCityById').mockImplementation(async () => mockCity);

      await service.handleProfile(mockContext);

      expect(userService.findUser).toHaveBeenCalledWith(123456);
      expect(countryService.getCountryById).toHaveBeenCalled();
      expect(cityService.getCityById).toHaveBeenCalled();
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('📋 *Your Profile*'),
        expect.objectContaining({
          reply_markup: expect.any(Object),
        }),
      );
    });
  });
});
