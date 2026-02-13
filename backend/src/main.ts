import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvValidationService } from './common/env-validation.service';
import { Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 🔒 SECURITY: Request size limits to prevent DoS attacks
  // Limit JSON body size
  app.use(express.json({
    limit: process.env.MAX_JSON_SIZE || '10mb',
  }));

  // Limit URL-encoded body size
  app.use(express.urlencoded({
    limit: process.env.MAX_URL_ENCODED_SIZE || '10mb',
    extended: true,
  }));

  // 启用 CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 启用环境验证（在应用启动时检查配置）
  try {
    const envValidation = app.get(EnvValidationService);
    await envValidation.onModuleInit();
  } catch (error) {
    logger.error('❌ Environment validation failed:');
    logger.error(error.message);
    process.exit(1); // Exit if environment is invalid
  }

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return constraints.join(', ');
        });
        return new BadRequestException(messages.join('. '));
      },
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
