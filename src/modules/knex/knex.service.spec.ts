import { Test, TestingModule } from '@nestjs/testing';
import { KnexService } from './knex.service';
import knex, { Knex } from 'knex';

// Mock the knex module
jest.mock('knex');

describe('KnexService', () => {
  let service: KnexService;
  let mockKnex: jest.MockedFunction<typeof knex>;
  let mockKnexInstance: Partial<Knex>;

  beforeEach(async () => {
    // Set up mocks
    mockKnexInstance = {
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    mockKnex = knex as jest.MockedFunction<typeof knex>;
    mockKnex.mockReturnValue(mockKnexInstance as Knex);

    const module: TestingModule = await Test.createTestingModule({
      providers: [KnexService],
    }).compile();

    service = module.get<KnexService>(KnexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize knex with configuration', () => {
      service.onModuleInit();
      
      expect(mockKnex).toHaveBeenCalledTimes(1);
      expect(service.knex).toBeDefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should destroy knex connection if it exists', async () => {
      // Set up the knex property
      service.knex = mockKnexInstance as Knex;
      
      await service.onModuleDestroy();
      
      expect(mockKnexInstance.destroy).toHaveBeenCalledTimes(1);
    });

    it('should not try to destroy knex connection if it does not exist', async () => {
      // Set knex to undefined
      service.knex = undefined as unknown as Knex;
      
      await service.onModuleDestroy();
      
      expect(mockKnexInstance.destroy).not.toHaveBeenCalled();
    });
  });
}); 