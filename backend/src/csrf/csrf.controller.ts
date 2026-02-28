import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import * as crypto from 'crypto';
import { Public } from '../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('csrf')
@Controller('csrf')
export class CsrfController {
  @Get('token')
  @Public() // 允许未认证用户获取CSRF token
  @SkipThrottle() // 跳过速率限制
  @ApiOperation({ summary: '获取CSRF token' })
  getCsrfToken(@Res({ passthrough: true }) response: Response) {
    // 生成CSRF token
    const token = crypto.randomBytes(32).toString('hex');

    // 设置到cookie
    response.cookie('csrf-token', token, {
      httpOnly: false, // 前端需要读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24小时
    });

    return {
      token,
      message: 'CSRF token已生成',
    };
  }
}
