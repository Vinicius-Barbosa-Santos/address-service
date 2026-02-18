import type { ViaCepResponse } from '../models/via-cep';

export interface CepProviderPort {
  fetch(cep: string): Promise<ViaCepResponse>;
}
