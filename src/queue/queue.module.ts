// src/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AddressProcessor } from './address.processor/address.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({ name: 'address-queue' }),
  ],
  providers: [AddressProcessor],
  exports: [BullModule],
})
export class QueueModule {}
