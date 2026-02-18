import type { Address } from '@prisma/client';
import type { CachePort } from '../ports/cache.port';
import type { AddressRepositoryPort } from '../ports/address-repository.port';
import type { CepProviderPort } from '../ports/cep-provider.port';
import type { QueuePort } from '../ports/queue.port';
import type { ViaCepResponse } from '../models/via-cep';

export class FindAddressByCepUseCase {
  constructor(
    private readonly cache: CachePort,
    private readonly repository: AddressRepositoryPort,
    private readonly provider: CepProviderPort,
    private readonly queue: QueuePort,
  ) {}

  async execute(cep: string): Promise<Address | ViaCepResponse> {
    const cached = await this.cache.get(cep);
    if (cached) {
      return JSON.parse(cached) as Address;
    }
    const fromDb = await this.repository.findByCep(cep);
    if (fromDb) {
      await this.cache.set(cep, JSON.stringify(fromDb), 3600);
      return fromDb;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const data = (await this.provider.fetch(cep)) as ViaCepResponse;
    if (data && data.erro) {
      return { cep, logradouro: '', localidade: '', uf: '' };
    }
    await this.queue.enqueueSaveAddress(
      {
        cep: data.cep,
        street: data.logradouro,
        city: data.localidade,
        state: data.uf,
      },
      data.cep,
    );
    return data;
  }
}
