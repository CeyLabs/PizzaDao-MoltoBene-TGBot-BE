import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Context } from 'telegraf';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;
  let mockContext: Partial<Context>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            handleHelpCommand: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService) as jest.Mocked<AppService>;
    mockContext = {
      message: {
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
        text: '/help',
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

  describe('helpCommand', () => {
    it('should call appService.handleHelpCommand', async () => {
      const handleHelpCommand = jest.spyOn(appService, 'handleHelpCommand');
      await controller.helpCommand(mockContext as Context);

      expect(handleHelpCommand).toHaveBeenCalledTimes(1);
      expect(handleHelpCommand).toHaveBeenCalledWith(mockContext);
    });
  });
});
