import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { TOKENS } from '../core/tokens';
import { FindAddressByCepUseCase } from '../core/use-cases/find-address-by-cep.usecase';

describe('AddressService', () => {
  let service: AddressService;
  let moduleRef: TestingModule;

  const repositoryMock = {
    findByCep: jest.fn(),
    create: jest.fn(),
  };

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const providerMock = {
    fetch: jest.fn(),
  };

  const queuePortMock = {
    enqueueSaveAddress: jest.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: TOKENS.REPOSITORY, useValue: repositoryMock },
        { provide: TOKENS.CACHE, useValue: cacheMock },
        { provide: TOKENS.CEP_PROVIDER, useValue: providerMock },
        { provide: TOKENS.QUEUE, useValue: queuePortMock },
        {
          provide: FindAddressByCepUseCase,
          useValue: new FindAddressByCepUseCase(
            cacheMock,
            repositoryMock,
            providerMock,
            queuePortMock,
          ),
        },
      ],
    }).compile();

    service = moduleRef.get(AddressService);

    repositoryMock.findByCep.mockReset();
    repositoryMock.create.mockReset();
    cacheMock.get.mockReset();
    cacheMock.set.mockReset();
    providerMock.fetch.mockReset();
    queuePortMock.enqueueSaveAddress.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return cached address if exists in Redis', async () => {
    cacheMock.get.mockResolvedValue(
      JSON.stringify({ cep: '123', city: 'TestCity' }),
    );
    const result = await service.findByCep('123');
    expect(result).toEqual({ cep: '123', city: 'TestCity' });
    expect(repositoryMock.findByCep).not.toHaveBeenCalled();
  });

  it('should return from database when present and cache it', async () => {
    cacheMock.get.mockResolvedValue(null);
    const dbAddress = {
      cep: '12345678',
      street: 'Rua A',
      city: 'Cidade',
      state: 'ST',
    };
    repositoryMock.findByCep.mockResolvedValue(dbAddress);
    const result = await service.findByCep('12345678');
    expect(result).toEqual(dbAddress);
    expect(repositoryMock.findByCep).toHaveBeenCalledWith('12345678');
    expect(cacheMock.set).toHaveBeenCalled();
  });

  it('should call ViaCEP and enqueue save job when not cached or in DB', async () => {
    cacheMock.get.mockResolvedValue(null);
    repositoryMock.findByCep.mockResolvedValue(null);
    providerMock.fetch.mockResolvedValue({
      cep: '01001000',
      logradouro: 'Praça da Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    const result = await service.findByCep('01001000');
    expect(result).toEqual({
      cep: '01001000',
      logradouro: 'Praça da Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(queuePortMock.enqueueSaveAddress).toHaveBeenCalledWith(
      {
        cep: '01001000',
        street: 'Praça da Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      '01001000',
    );
    expect(repositoryMock.create).not.toHaveBeenCalled();
  });
});
