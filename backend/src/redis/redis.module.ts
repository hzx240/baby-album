import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, CacheService],
  exports: [CacheService, RedisService],
})
export class RedisModule {
  static register() {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [RedisService, CacheService],
      exports: [CacheService, RedisService],
    };
  }
}
