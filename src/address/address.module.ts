// src/address/address.module.ts
import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { TOKENS } from '../core/tokens';
import { PrismaAddressRepositoryAdapter } from '../infrastructure/adapters/prisma/prisma-address.repository.adapter';
import { RedisCacheAdapter } from '../infrastructure/adapters/redis/redis.cache.adapter';
import { ViaCepProviderAdapter } from '../infrastructure/adapters/viacep/viacep.provider.adapter';
import { BullQueueAdapter } from '../infrastructure/adapters/bull/bull.queue.adapter';
import { FindAddressByCepUseCase } from '../core/use-cases/find-address-by-cep.usecase';

@Module({
  imports: [PrismaModule, QueueModule],
  providers: [
    AddressService,
    { provide: TOKENS.REPOSITORY, useClass: PrismaAddressRepositoryAdapter },
    { provide: TOKENS.CACHE, useClass: RedisCacheAdapter },
    { provide: TOKENS.CEP_PROVIDER, useClass: ViaCepProviderAdapter },
    { provide: TOKENS.QUEUE, useClass: BullQueueAdapter },
    {
      provide: FindAddressByCepUseCase,
      useFactory: (
        cache: RedisCacheAdapter,
        repo: PrismaAddressRepositoryAdapter,
        provider: ViaCepProviderAdapter,
        queue: BullQueueAdapter,
      ) => new FindAddressByCepUseCase(cache, repo, provider, queue),
      inject: [
        TOKENS.CACHE,
        TOKENS.REPOSITORY,
        TOKENS.CEP_PROVIDER,
        TOKENS.QUEUE,
      ],
    },
  ],
  controllers: [AddressController],
})
export class AddressModule {}
