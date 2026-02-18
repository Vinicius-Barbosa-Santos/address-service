// src/address/address.service.ts
import { Injectable } from '@nestjs/common';
import type { Address } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { TOKENS } from '../core/tokens';
import type { AddressRepositoryPort } from '../core/ports/address-repository.port';
import { FindAddressByCepUseCase } from '../core/use-cases/find-address-by-cep.usecase';

@Injectable()
export class AddressService {
  constructor(
    private readonly findAddressByCep: FindAddressByCepUseCase,
    @Inject(TOKENS.REPOSITORY)
    private readonly repository: AddressRepositoryPort,
  ) {}

  async findByCep(
    cep: string,
  ): Promise<
    | Address
    | { cep: string; logradouro: string; localidade: string; uf: string }
  > {
    return this.findAddressByCep.execute(cep);
  }

  async create(data: {
    cep: string;
    street: string;
    city: string;
    state: string;
  }) {
    return this.repository.create(data);
  }
}
