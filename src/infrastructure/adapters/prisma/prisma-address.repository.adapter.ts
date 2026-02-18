import { Injectable } from '@nestjs/common';
import type { Address } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AddressRepositoryPort } from '../../../core/ports/address-repository.port';

@Injectable()
export class PrismaAddressRepositoryAdapter implements AddressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByCep(cep: string): Promise<Address | null> {
    return this.prisma.address.findUnique({ where: { cep } });
  }

  create(data: {
    cep: string;
    street: string;
    city: string;
    state: string;
  }): Promise<Address> {
    return this.prisma.address.create({ data });
  }
}
