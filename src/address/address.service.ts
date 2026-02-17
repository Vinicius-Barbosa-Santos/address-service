// src/address/address.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import Redis from 'ioredis';
import type { Address } from '@prisma/client';

type ViaCepResponse = {
  cep: string;
  logradouro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

@Injectable()
export class AddressService {
  private redis = new Redis(); // default localhost:6379

  constructor(
    private prisma: PrismaService,
    @InjectQueue('address-queue') private addressQueue: Queue,
  ) {}

  // Consulta principal
  async findByCep(cep: string): Promise<Address | ViaCepResponse> {
    const cached = await this.redis.get(cep);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown as Address;
      return parsed;
    }

    const addressDb = await this.prisma.address.findUnique({ where: { cep } });
    if (addressDb) {
      await this.redis.set(cep, JSON.stringify(addressDb), 'EX', 3600);
      return addressDb;
    }

    const resp = await axios.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );
    const data = resp.data;
    if (data?.erro) {
      return { cep, logradouro: '', localidade: '', uf: '' };
    }

    void this.addressQueue.add(
      'save-address',
      {
        cep: data.cep,
        street: data.logradouro,
        city: data.localidade,
        state: data.uf,
      },
      { jobId: data.cep },
    );

    return data;
  }

  // Persistência direta (opcional)
  async create(data: {
    cep: string;
    street: string;
    city: string;
    state: string;
  }) {
    return this.prisma.address.create({ data });
  }
}
