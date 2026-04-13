import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should throw 503 when database is unavailable', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('db down')),
    };

    const controller = new HealthController(prisma as any);

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
