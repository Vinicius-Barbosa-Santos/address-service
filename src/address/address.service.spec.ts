import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import axios from 'axios';
jest.mock('axios');

describe('AddressService', () => {
  let service: AddressService;

  const prismaMock = {
    address: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const queueMock = {
    add: jest.fn(),
  };

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken('address-queue'), useValue: queueMock },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);

    // fecha a conexão real do Redis criada no construtor para evitar handles abertos
    const originalRedis = (
      service as unknown as { redis?: { disconnect?: () => void } }
    ).redis;
    if (originalRedis && typeof originalRedis.disconnect === 'function') {
      originalRedis.disconnect();
    }
    (
      service as unknown as {
        redis: {
          get: (...args: unknown[]) => unknown;
          set: (...args: unknown[]) => unknown;
        };
      }
    ).redis = redisMock as unknown as {
      get: (...args: unknown[]) => unknown;
      set: (...args: unknown[]) => unknown;
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return cached address if exists in Redis', async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({ cep: '123', city: 'TestCity' }),
    );

    const result = await service.findByCep('123');

    expect(result).toEqual({ cep: '123', city: 'TestCity' });
    expect(prismaMock.address.findUnique).not.toHaveBeenCalled();
  });

  it('should return from database when present and cache it', async () => {
    redisMock.get.mockResolvedValue(null);
    const dbAddress = {
      cep: '12345678',
      street: 'Rua A',
      city: 'Cidade',
      state: 'ST',
    };
    prismaMock.address.findUnique.mockResolvedValue(dbAddress);
    const result = await service.findByCep('12345678');
    expect(result).toEqual(dbAddress);
    expect(prismaMock.address.findUnique).toHaveBeenCalledWith({
      where: { cep: '12345678' },
    });
    expect(redisMock.set).toHaveBeenCalled();
  });

  it('should call ViaCEP and enqueue save job when not cached or in DB', async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.address.findUnique.mockResolvedValue(null);
    const mockedAxios = axios as unknown as {
      get: jest.Mock;
    };
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        cep: '01001000',
        logradouro: 'Praça da Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      },
    });
    const result = await service.findByCep('01001000');
    expect(result).toEqual({
      cep: '01001000',
      logradouro: 'Praça da Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(queueMock.add).toHaveBeenCalledWith(
      'save-address',
      {
        cep: '01001000',
        street: 'Praça da Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      { jobId: '01001000' },
    );
    expect(prismaMock.address.create).not.toHaveBeenCalled();
  });
});
