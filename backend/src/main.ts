import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvValidationService } from './common/env-validation.service';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 🔒 SECURITY: Cookie parser for CSRF protection
  app.use(cookieParser());

  // 🔒 SECURITY: Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // 允许内联脚本（React需要）
          styleSrc: ["'self'", "'unsafe-inline'"], // 允许内联样式
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'], // 允许图片来源
          connectSrc: ["'self'"], // API连接 - 使用 'self' 允许同源请求
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'blob:'],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1年
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny', // 防止点击劫持
      },
      noSniff: true, // X-Content-Type-Options: nosniff
      xssFilter: true, // X-XSS-Protection
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

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
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://[::1]:5173',
      'http://localhost:8888',
      'http://127.0.0.1:8888',
      'http://[::1]:8888',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:5176',
      'http://127.0.0.1:5176',
      'http://localhost:5177',
      'http://127.0.0.1:5177',
      'http://localhost:5178',
      'http://127.0.0.1:5178',
      'http://localhost:5179',
      'http://127.0.0.1:5179',
      'http://localhost:5180',
      'http://127.0.0.1:5180',
      'http://localhost:5181',
      'http://127.0.0.1:5181',
      'http://localhost:5182',
      'http://127.0.0.1:5182',
    ],
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
