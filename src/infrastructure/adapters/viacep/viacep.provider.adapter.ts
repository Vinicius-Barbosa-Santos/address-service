import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { ViaCepResponse } from '../../../core/models/via-cep';
import type { CepProviderPort } from '../../../core/ports/cep-provider.port';

@Injectable()
export class ViaCepProviderAdapter implements CepProviderPort {
  async fetch(cep: string): Promise<ViaCepResponse> {
    const resp = await axios.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );
    return resp.data;
  }
}
