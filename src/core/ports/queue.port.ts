export interface QueuePort {
  enqueueSaveAddress(
    payload: { cep: string; street: string; city: string; state: string },
    jobId: string,
  ): Promise<void>;
}
