import type { Address } from '@prisma/client';

export interface AddressRepositoryPort {
  findByCep(cep: string): Promise<Address | null>;
  create(data: {
    cep: string;
    street: string;
    city: string;
    state: string;
  }): Promise<Address>;
}
