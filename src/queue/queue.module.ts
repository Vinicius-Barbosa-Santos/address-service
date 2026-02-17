import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AddressProcessor } from './address.processor/address.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'address-queue',
    }),
  ],
  providers: [AddressProcessor],
})
export class QueueModule {}
