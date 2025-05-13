import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { Context } from 'telegraf';

describe('AppService', () => {
  let service: AppService;
  let mockContext: Partial<Context>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);

    mockContext = {
      replyWithMarkdownV2: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleHelpCommand', () => {
    it('should call replyWithMarkdownV2 with help menu text', async () => {
      await service.handleHelpCommand(mockContext as Context);

      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledTimes(1);
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('*Help Menu*'),
      );
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
      );
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('/profile'),
      );
      expect(mockContext.replyWithMarkdownV2).toHaveBeenCalledWith(
        expect.stringContaining('/help'),
      );
    });
  });
});
