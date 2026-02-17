// src/address/address.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get(':cep')
  async getByCep(@Param('cep') cep: string) {
    return this.addressService.findByCep(cep);
  }
}
