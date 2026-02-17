/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { AddressProcessor } from './address.processor';
import { PrismaService } from '../../prisma/prisma.service';
import type { Job } from 'bullmq';

describe('AddressProcessor', () => {
  let provider: AddressProcessor;

  beforeEach(async () => {
    const prismaMock = {
      address: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressProcessor,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    provider = module.get<AddressProcessor>(AddressProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should not create when address already exists', async () => {
    const prismaMock = {
      address: {
        findUnique: jest.fn().mockResolvedValue({ cep: '01001000' }),
        create: jest.fn(),
      },
    };
    const prov = provider as unknown as { prisma: PrismaService };
    prov.prisma = prismaMock as unknown as PrismaService;
    await provider.process({
      name: 'save-address',
      data: { cep: '01001000', street: 'A', city: 'B', state: 'SP' },
    } as unknown as Job);
    expect(prismaMock.address.create).not.toHaveBeenCalled();
  });

  it('should create when address does not exist', async () => {
    const prismaMock = {
      address: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    const prov = provider as unknown as { prisma: PrismaService };
    prov.prisma = prismaMock as unknown as PrismaService;
    await provider.process({
      name: 'save-address',
      data: { cep: '02002000', street: 'B', city: 'C', state: 'RJ' },
    } as unknown as Job);
    expect(prismaMock.address.create).toHaveBeenCalledWith({
      data: { cep: '02002000', street: 'B', city: 'C', state: 'RJ' },
    });
  });
});
