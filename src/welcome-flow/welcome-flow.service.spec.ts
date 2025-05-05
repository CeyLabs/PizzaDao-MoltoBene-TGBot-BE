import { Test, TestingModule } from '@nestjs/testing';
import { WelcomeFlowService } from './welcome-flow.service';

describe('WelcomeFlowService', () => {
  let service: WelcomeFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WelcomeFlowService],
    }).compile();

    service = module.get<WelcomeFlowService>(WelcomeFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
