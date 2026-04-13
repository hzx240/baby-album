import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class PathTraversalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    if (!file) {
      return true; // 没有文件，放行（由其他 guard 处理）
    }

    const filename = file.originalname;

    // 检测路径遍历攻击
    // 1. 检查是否包含 ..
    if (filename.includes('..')) {
      throw new BadRequestException('Invalid filename: path traversal detected');
    }

    // 2. 检查是否包含路径分隔符
    if (filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename: path separator detected');
    }

    // 3. 规范化路径并比较
    const normalized = path.normalize(filename);
    if (normalized !== filename) {
      throw new BadRequestException('Invalid filename: path normalization mismatch');
    }

    // 4. 检查绝对路径
    if (path.isAbsolute(filename)) {
      throw new BadRequestException('Invalid filename: absolute path detected');
    }

    // 5. 检查 Windows 驱动器路径
    if (/^[a-zA-Z]:\\/.test(filename)) {
      throw new BadRequestException('Invalid filename: Windows drive path detected');
    }

    return true;
  }
}
