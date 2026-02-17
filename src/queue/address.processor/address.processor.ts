// src/queue/address.processor/address.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
@Processor('address-queue')
export class AddressProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ cep: string; street: string; city: string; state: string }>,
  ) {
    if (job.name && job.name !== 'save-address') return;

    const { cep, street, city, state } = job.data;

    const exists = await this.prisma.address.findUnique({ where: { cep } });
    if (exists) return;

    await this.prisma.address.create({ data: { cep, street, city, state } });

    console.log(`CEP ${cep} salvo no banco.`);
  }
}
