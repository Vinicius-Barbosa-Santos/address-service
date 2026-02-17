import { Test, TestingModule } from '@nestjs/testing';
import { AddressProcessor } from './address.processor';

describe('AddressProcessor', () => {
  let provider: AddressProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressProcessor],
    }).compile();

    provider = module.get<AddressProcessor>(AddressProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
