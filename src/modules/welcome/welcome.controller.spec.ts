import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeController } from './welcome.controller';
import { WelcomeService } from './welcome.service';
import { Context } from 'telegraf';

describe('WelcomeController', () => {
  let controller: WelcomeController;
  let welcomeService: jest.Mocked<WelcomeService>;
  let mockContext: Partial<Context>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WelcomeController],
      providers: [
        {
          provide: WelcomeService,
          useValue: {
            handleStartCommand: jest.fn().mockResolvedValue(undefined),
            handleProfile: jest.fn().mockResolvedValue(undefined),
            handleUserRegistration: jest.fn().mockResolvedValue(undefined),
            handleNewMember: jest.fn().mockResolvedValue(undefined),
            handleCallbackQuery: jest.fn().mockResolvedValue(undefined),
            handlePrivateChat: jest.fn().mockResolvedValue(undefined),
            handleLeftChatMember: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<WelcomeController>(WelcomeController);
    welcomeService = module.get<WelcomeService>(WelcomeService) as jest.Mocked<WelcomeService>;
    mockContext = {
      message: {
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
        text: '/start',
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: 1,
          type: 'private',
          first_name: 'Test',
        },
      },
      reply: jest.fn().mockResolvedValue(undefined),
      replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
    } as Partial<Context>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startCommand', () => {
    it('should call welcomeService.handleStartCommand', async () => {
      const handleStartCommand = jest.spyOn(welcomeService, 'handleStartCommand');
      await controller.startCommand(mockContext as Context);

      expect(handleStartCommand).toHaveBeenCalledTimes(1);
      expect(handleStartCommand).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleProfileCommand', () => {
    it('should call welcomeService.handleProfile', async () => {
      const handleProfile = jest.spyOn(welcomeService, 'handleProfile');
      await controller.handleProfileCommand(mockContext as Context);

      expect(handleProfile).toHaveBeenCalledTimes(1);
      expect(handleProfile).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleUserRegistration', () => {
    it('should call welcomeService.handleUserRegistration', async () => {
      const handleUserRegistration = jest.spyOn(welcomeService, 'handleUserRegistration');
      await controller.handleUserRegistration(mockContext as Context);

      expect(handleUserRegistration).toHaveBeenCalledTimes(1);
      expect(handleUserRegistration).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleNewMember', () => {
    it('should call welcomeService.handleNewMember', async () => {
      const handleNewMember = jest.spyOn(welcomeService, 'handleNewMember');
      await controller.handleNewMember(mockContext as Context);

      expect(handleNewMember).toHaveBeenCalledTimes(1);
      expect(handleNewMember).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleCallbackQuery', () => {
    it('should call welcomeService.handleCallbackQuery', async () => {
      const handleCallbackQuery = jest.spyOn(welcomeService, 'handleCallbackQuery');
      await controller.handleCallbackQuery(mockContext as Context);

      expect(handleCallbackQuery).toHaveBeenCalledTimes(1);
      expect(handleCallbackQuery).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handlePrivateChat', () => {
    it('should call welcomeService.handlePrivateChat', async () => {
      const handlePrivateChat = jest.spyOn(welcomeService, 'handlePrivateChat');
      await controller.handlePrivateChat(mockContext as Context);

      expect(handlePrivateChat).toHaveBeenCalledTimes(1);
      expect(handlePrivateChat).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleLeftChatMember', () => {
    it('should call welcomeService.handleLeftChatMember', async () => {
      const handleLeftChatMember = jest.spyOn(welcomeService, 'handleLeftChatMember');
      await controller.handleLeftChatMember(mockContext as Context);

      expect(handleLeftChatMember).toHaveBeenCalledTimes(1);
      expect(handleLeftChatMember).toHaveBeenCalledWith(mockContext);
    });
  });
});
