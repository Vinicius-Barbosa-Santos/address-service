import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { QueuePort } from '../../../core/ports/queue.port';

@Injectable()
export class BullQueueAdapter implements QueuePort {
  constructor(@InjectQueue('address-queue') private readonly queue: Queue) {}

  async enqueueSaveAddress(
    payload: { cep: string; street: string; city: string; state: string },
    jobId: string,
  ): Promise<void> {
    await this.queue.add('save-address', payload, { jobId });
  }
}
