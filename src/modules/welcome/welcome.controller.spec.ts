import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeController } from './welcome.controller';
import { WelcomeService } from './welcome.service';
import { Context } from 'telegraf';

describe('WelcomeController', () => {
  let controller: WelcomeController;
  let welcomeService: WelcomeService;
  let mockContext: Context;

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
    welcomeService = module.get<WelcomeService>(WelcomeService);
    mockContext = {
      update: { update_id: 123 }
    } as Context;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startCommand', () => {
    it('should call welcomeService.handleStartCommand', async () => {
      await controller.startCommand(mockContext);
      
      expect(welcomeService.handleStartCommand).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleStartCommand).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleProfileCommand', () => {
    it('should call welcomeService.handleProfile', async () => {
      await controller.handleProfileCommand(mockContext);
      
      expect(welcomeService.handleProfile).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleProfile).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleUserRegistration', () => {
    it('should call welcomeService.handleUserRegistration', async () => {
      await controller.handleUserRegistration(mockContext);
      
      expect(welcomeService.handleUserRegistration).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleUserRegistration).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleNewMember', () => {
    it('should call welcomeService.handleNewMember', async () => {
      await controller.handleNewMember(mockContext);
      
      expect(welcomeService.handleNewMember).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleNewMember).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleCallbackQuery', () => {
    it('should call welcomeService.handleCallbackQuery', async () => {
      await controller.handleCallbackQuery(mockContext);
      
      expect(welcomeService.handleCallbackQuery).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleCallbackQuery).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handlePrivateChat', () => {
    it('should call welcomeService.handlePrivateChat', async () => {
      await controller.handlePrivateChat(mockContext);
      
      expect(welcomeService.handlePrivateChat).toHaveBeenCalledTimes(1);
      expect(welcomeService.handlePrivateChat).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('handleLeftChatMember', () => {
    it('should call welcomeService.handleLeftChatMember', async () => {
      await controller.handleLeftChatMember(mockContext);
      
      expect(welcomeService.handleLeftChatMember).toHaveBeenCalledTimes(1);
      expect(welcomeService.handleLeftChatMember).toHaveBeenCalledWith(mockContext);
    });
  });
}); 