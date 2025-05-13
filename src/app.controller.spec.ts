import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Context } from 'telegraf';

describe('AppController', () => {
  let controller: AppController;
  let appService: AppService;
  let mockContext: Context;

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
    appService = module.get<AppService>(AppService);
    mockContext = {
      update: { update_id: 123 },
    } as Context;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('helpCommand', () => {
    it('should call appService.handleHelpCommand', async () => {
      await controller.helpCommand(mockContext);

      expect(appService.handleHelpCommand).toHaveBeenCalledTimes(1);
      expect(appService.handleHelpCommand).toHaveBeenCalledWith(mockContext);
    });
  });
});
