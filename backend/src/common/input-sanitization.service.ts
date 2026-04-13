import { Injectable, BadRequestException } from '@nestjs/common';

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]*src[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
  '../',
  '..\\',
  '%2e',
  '%25',
  '..%5c',
  '%5c',
  '..%2f',
  '%2f',
  '..%5c',
  '%5c%5c',
  '%2e%2e',
  '%2f%2e',
  './',
  '.\\',
];

const COMMAND_INJECTION_PATTERNS = [
  /;\s*\w+/,
  /\|\s*\w+/,
  /\$\(/,
];

const SQL_INJECTION_PATTERNS = [
  /(\/)|(\-)|(#)/i,
  /(\bor\b).*?=/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /union(\s|\+)+(all)?(\s|\+)+select/i,
  /drop(\s|\+)+table/i,
  /insert(\s|\+)+into/i,
];

const DANGEROUS_FILENAME_CHARS = /[<>:"|?*\x00-\x1f\/]/g;

const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
];

@Injectable()
export class InputSanitizationService {
  private matchesPattern(pattern: RegExp, value: string): boolean {
    pattern.lastIndex = 0;
    return pattern.test(value);
  }

  sanitizeString(input: string, fieldName: string = 'input'): string {
    if (typeof input !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }
    let sanitized = input.trim();
    if (sanitized.length > 10000) {
      throw new BadRequestException(`${fieldName} is too long (max 10000 characters)`);
    }
    for (const pattern of XSS_PATTERNS) {
      if (this.matchesPattern(pattern, sanitized)) {
        throw new BadRequestException(
          `${fieldName} contains potentially dangerous content (XSS detected)`,
        );
      }
    }
    return sanitized;
  }

  sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') {
      throw new BadRequestException('Filename must be a string');
    }
    const trimmed = filename.trim();
    if (!trimmed) {
      throw new BadRequestException('Filename cannot be empty');
    }
    if (trimmed.length > 255) {
      throw new BadRequestException('Filename is too long (max 255 characters)');
    }
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      throw new BadRequestException('Filename must not contain path separators');
    }
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (trimmed.includes(pattern)) {
        throw new BadRequestException('Filename contains invalid path sequences');
      }
    }

    const sanitized = trimmed.replace(DANGEROUS_FILENAME_CHARS, '');
    if (!sanitized) {
      throw new BadRequestException('Filename contains invalid characters');
    }

    const baseName = sanitized.split('.')[0].toUpperCase();
    if (RESERVED_NAMES.includes(baseName)) {
      throw new BadRequestException('Filename contains reserved Windows name');
    }
    return sanitized;
  }

  sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new BadRequestException('Email must be a string');
    }
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new BadRequestException('Invalid email format');
    }
    return trimmed;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  sanitizeUuid(id: string, fieldName: string = 'id'): string {
    if (typeof id !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }
    const trimmed = id.trim();
    if (!trimmed) {
      throw new BadRequestException(`${fieldName} cannot be empty`);
    }

    // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx
    // Strict regex for proper UUID v4 validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,13}$/i;

    if (!uuidRegex.test(trimmed)) {
      throw new BadRequestException(
        `${fieldName} must be a valid UUID (format: xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx)`
      );
    }
    return trimmed;
  }

  isValidUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,13}$/i;
    return uuidRegex.test(id);
  }

  sanitizePagination(page: string, limit: string): { page: number; limit: number; offset: number } {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (pageNum < 1 || pageNum > 100000) {
      throw new BadRequestException('Page must be between 1 and 100000');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    return {
      page: pageNum,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    };
  }

  sanitizeDisplayName(displayName: string): string {
    if (typeof displayName !== 'string') {
      throw new BadRequestException('Display name must be a string');
    }
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new BadRequestException('Display name cannot be empty');
    }
    if (trimmed.length < 2) {
      throw new BadRequestException('Display name must be at least 2 characters');
    }
    if (trimmed.length > 100) {
      throw new BadRequestException('Display name is too long (max 100 characters)');
    }

    for (const pattern of XSS_PATTERNS) {
      if (this.matchesPattern(pattern, trimmed)) {
        throw new BadRequestException('Display name contains potentially dangerous content');
      }
    }

    const sanitized = trimmed.replace(/[<>"'`&#$]/g, '').trim();
    const validPattern = /^[\p{L}\p{M}\p{N}\s._\-@]+$/u;
    if (!sanitized || !validPattern.test(sanitized)) {
      throw new BadRequestException(
        'Display name can only contain letters, numbers, Chinese characters, spaces, dots, hyphens, underscores, and @'
      );
    }

    return sanitized;
  }

  sanitizeArray(inputs: string[], fieldName: string = 'input'): string[] {
    if (!Array.isArray(inputs)) {
      throw new BadRequestException(`${fieldName} must be an array`);
    }
    return inputs.map((input) => this.sanitizeString(input, fieldName));
  }
}
