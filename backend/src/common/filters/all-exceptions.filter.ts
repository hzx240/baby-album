import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误，请稍后重试';

    // 处理 HTTP 异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;

        // 处理验证错误
        if (Array.isArray(responseObj.message)) {
          message = this.formatValidationErrors(responseObj.message);
        }
      }
    }
    // 处理其他错误
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录错误
    console.error('Exception:', {
      path: request.url,
      method: request.method,
      status,
      message,
      exception,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private formatValidationErrors(errors: string[]): string {
    const errorMap: { [key: string]: string } = {
      email: '邮箱地址',
      password: '密码',
      displayName: '显示名称',
      name: '名称',
      role: '角色',
      expiresInDays: '有效期',
      filename: '文件名',
      contentType: '内容类型',
      fileSize: '文件大小',
      familyId: '家庭ID',
      photoId: '照片ID',
      token: '令牌',
    };

    const formattedErrors = errors.map((error) => {
      // 匹配 "field must be longer than or equal to X characters"
      const minLengthMatch = error.match(/(\w+) must be longer than or equal to (\d+) characters/);
      if (minLengthMatch) {
        const field = minLengthMatch[1];
        const length = minLengthMatch[2];
        const fieldName = errorMap[field] || field;
        return `${fieldName}至少需要${length}个字符`;
      }

      // 匹配 "field should not be empty"
      const emptyMatch = error.match(/(\w+) should not be empty/);
      if (emptyMatch) {
        const field = emptyMatch[1];
        const fieldName = errorMap[field] || field;
        return `${fieldName}不能为空`;
      }

      // 匹配 "field must be an email"
      const emailMatch = error.match(/(\w+) must be an email/);
      if (emailMatch) {
        return '请输入有效的邮箱地址';
      }

      // 匹配 "field must be a string"
      const stringMatch = error.match(/(\w+) must be a string/);
      if (stringMatch) {
        const field = stringMatch[1];
        const fieldName = errorMap[field] || field;
        return `${fieldName}必须是字符串`;
      }

      // 匹配 "field must be one of"
      const enumMatch = error.match(/(\w+) must be one of/);
      if (enumMatch) {
        const field = enumMatch[1];
        const fieldName = errorMap[field] || field;
        return `${fieldName}的值无效`;
      }

      // 匹配 "property.*has failed"
      const constraintMatch = error.match(/(\w+) (\w+) has failed the following constraints:/);
      if (constraintMatch) {
        const field = constraintMatch[1];
        const constraint = constraintMatch[2];
        const fieldName = errorMap[field] || field;
        return `${fieldName}格式不正确`;
      }

      // 默认返回原始错误消息（如果是中文就直接返回）
      if (/[\u4e00-\u9fa5]/.test(error)) {
        return error;
      }

      // 返回通用错误消息
      return '请求参数验证失败';
    });

    return formattedErrors.join('；');
  }
}
