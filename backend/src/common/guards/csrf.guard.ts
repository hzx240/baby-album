import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';

// 装饰器：跳过CSRF验证
export const SkipCsrf = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('skip-csrf', true, descriptor.value);
    } else {
      Reflect.defineMetadata('skip-csrf', true, target);
    }
  };
};

/**
 * CSRF保护Guard
 * 使用双重提交Cookie模式
 *
 * 工作原理:
 * 1. 服务器生成CSRF token并设置到cookie中
 * 2. 前端从cookie读取token并在请求头中发送
 * 3. 服务器验证cookie中的token和请求头中的token是否匹配
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否跳过CSRF验证
    const skipCsrf = this.reflector.get<boolean>(
      'skip-csrf',
      context.getHandler(),
    );
    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // 只对状态改变操作进行CSRF验证
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return true;
    }

    // 生成或验证CSRF token
    const cookieToken = request.cookies?.['csrf-token'];
    const headerToken = request.headers['x-csrf-token'] as string;

    // 如果cookie中没有token，生成一个新的
    if (!cookieToken) {
      const newToken = this.generateToken();
      const response = context.switchToHttp().getResponse();
      response.cookie('csrf-token', newToken, {
        httpOnly: false, // 前端需要读取
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24小时
      });

      // 第一次请求时，如果没有header token，允许通过
      // 但要求后续请求必须携带token
      if (!headerToken) {
        throw new ForbiddenException('CSRF token缺失，请刷新页面后重试');
      }
    }

    // 验证token
    if (!headerToken || !cookieToken) {
      throw new ForbiddenException('CSRF token缺失');
    }

    if (headerToken !== cookieToken) {
      throw new ForbiddenException('CSRF token验证失败');
    }

    return true;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
