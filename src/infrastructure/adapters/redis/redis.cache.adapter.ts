import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { CachePort } from '../../../core/ports/cache.port';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  private readonly redis = new Redis();

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }
}
