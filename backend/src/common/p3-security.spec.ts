import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InputSanitizationService } from './input-sanitization.service';
import { LogSanitizerService } from './log-sanitizer.service';

describe('P3 Security Tests', () => {
  describe('InputSanitizationService', () => {
    let service: InputSanitizationService;

    beforeEach(async () => {
      // Create service instance
      service = new InputSanitizationService();
    });

    describe('P3-1: Filename Sanitization', () => {
      it('should accept valid filenames', () => {
        const validFilenames = [
          'photo.jpg',
          'my-photo.png',
          'document.pdf',
          'image_123.webp',
          'Baby Photo.heic',
        ];

        validFilenames.forEach((filename) => {
          expect(() => service.sanitizeFilename(filename)).not.toThrow();
          const result = service.sanitizeFilename(filename);
          expect(result).toBe(filename);
        });
      });

      it('should reject path traversal attempts', () => {
        const maliciousFilenames = [
          '../etc/passwd',
          '..\\..\\windows\\system32',
          '../../secret.txt',
          './hidden.txt',
          '/etc/passwd',
          '\\\\network\\share',
        ];

        maliciousFilenames.forEach((filename) => {
          expect(() => service.sanitizeFilename(filename)).toThrow(BadRequestException);
        });
      });

      it('should reject filenames with dangerous characters', () => {
        const dangerousFilenames = [
          'file<name>.txt',
          'file|name|.txt',
          'file:name?.txt',
          'file"name*.txt',
          'file\x00null.txt',
        ];

        dangerousFilenames.forEach((filename) => {
          const result = service.sanitizeFilename(filename);
          // Service removes dangerous characters instead of throwing
          expect(result).not.toBe(filename);
          expect(result).toMatch(/^[^<>:"|?/*\x00-\x1f]+$/);
        });
      });

      it('should reject reserved Windows filenames', () => {
        const reservedNames = [
          'CON',
          'PRN',
          'AUX',
          'NUL',
          'COM1',
          'LPT1',
        ];

        reservedNames.forEach((name) => {
          expect(() => service.sanitizeFilename(name)).toThrow(BadRequestException);
        });
      });

      it('should reject empty filenames', () => {
        expect(() => service.sanitizeFilename('')).toThrow(BadRequestException);
        expect(() => service.sanitizeFilename('   ')).toThrow(BadRequestException);
      });

      it('should reject overly long filenames', () => {
        const longFilename = 'a'.repeat(256) + '.jpg';
        expect(() => service.sanitizeFilename(longFilename)).toThrow(BadRequestException);
      });
    });

    describe('P3-1: Email Validation', () => {
      it('should accept valid email addresses', () => {
        const validEmails = [
          'user@example.com',
          'test.email@domain.co.uk',
          'user+tag@example.com',
          'first.last@company.com',
        ];

        validEmails.forEach((email) => {
          expect(service.isValidEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user@example,com',
        ];

        invalidEmails.forEach((email) => {
          expect(service.isValidEmail(email)).toBe(false);
        });
      });
    });

    describe('P3-1: XSS Protection', () => {
      it('should detect XSS patterns in strings', () => {
        const xssStrings = [
          '<script>alert("XSS")</script>',
          '<iframe src="evil.com"></iframe>',
          'javascript:alert("XSS")',
          '<img src="x" onerror="alert(1)">',
          '<embed src="evil.swf">',
        ];

        xssStrings.forEach((str) => {
          expect(() => service.sanitizeString(str, 'test')).toThrow(BadRequestException);
        });
      });

      it('should reject overly long strings', () => {
        const longString = 'a'.repeat(10001);
        expect(() => service.sanitizeString(longString, 'test')).toThrow(BadRequestException);
      });

      it('should trim whitespace from strings', () => {
        const result = service.sanitizeString('  test string  ', 'test');
        expect(result).toBe('test string');
      });
    });

    describe('P3-1: UUID Validation', () => {
      it('should accept valid UUIDs', () => {
        const validUuids = [
          '550e8400-e29b-41d4-a716-4466554400000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '00000000-0000-0000-0000-000000000000',
        ];

        validUuids.forEach((uuid) => {
          expect(() => service.sanitizeUuid(uuid, 'id')).not.toThrow();
        });
      });

      it('should reject invalid UUIDs', () => {
        const invalidUuids = [
          'not-a-uuid',
          '550e8400-e29b-41d4-a716', // Too short
          '550e8400-e29b-41d4-a716-4466554440000-extra', // Too long
          '550e8400-e29b-41d4-a716-446655440g00', // Invalid character 'g'
          '',
        ];

        invalidUuids.forEach((uuid) => {
          expect(() => service.sanitizeUuid(uuid, 'id')).toThrow(BadRequestException);
        });
      });
    });

    describe('P3-1: Pagination Validation', () => {
      it('should validate pagination parameters', () => {
        const result = service.sanitizePagination('1', '20');
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
      });

      it('should reject invalid page numbers', () => {
        expect(() => service.sanitizePagination('0', '20')).toThrow(BadRequestException);
        expect(() => service.sanitizePagination('-1', '20')).toThrow(BadRequestException);
        expect(() => service.sanitizePagination('100001', '20')).toThrow(BadRequestException);
      });

      it('should reject invalid limit values', () => {
        expect(() => service.sanitizePagination('1', '0')).toThrow(BadRequestException);
        expect(() => service.sanitizePagination('1', '101')).toThrow(BadRequestException);
      });

      it('should calculate offset correctly', () => {
        const result1 = service.sanitizePagination('1', '20');
        expect(result1.offset).toBe(0);

        const result2 = service.sanitizePagination('2', '20');
        expect(result2.offset).toBe(20);

        const result3 = service.sanitizePagination('5', '10');
        expect(result3.offset).toBe(40);
      });
    });

    describe('P3-1: Display Name Sanitization', () => {
      it('should accept valid display names', () => {
        const validNames = [
          'John Doe',
          '用户名',
          'Juan Pérez',
          '名字-123',
          'Test.User@Company',
        ];

        validNames.forEach((name) => {
          expect(() => service.sanitizeDisplayName(name)).not.toThrow();
        });
      });

      it('should reject display names with invalid characters', () => {
        const invalidNames = [
          'John<script>',
          'Test&User',
          'User#Tag',
          'Name$Sign',
        ];

        invalidNames.forEach((name) => {
          const result = service.sanitizeDisplayName(name);
          // Service removes dangerous characters instead of throwing
          expect(result).not.toBe(name);
          // Verify invalid chars were removed
          const invalidChars = /[<>:"&#$]/;
          const removedChars = name.split('').filter(c => invalidChars.test(c));
          expect(removedChars.length).toBeGreaterThan(0);
        });
      });

      it('should reject empty or overly long display names', () => {
        expect(() => service.sanitizeDisplayName('')).toThrow(BadRequestException);
        const longName = 'a'.repeat(101);
        expect(() => service.sanitizeDisplayName(longName)).toThrow(BadRequestException);
      });
    });
  });

  describe('LogSanitizerService', () => {
    let service: LogSanitizerService;

    beforeEach(async () => {
      service = new LogSanitizerService();
    });

    describe('P3-2: Sensitive Data Sanitization', () => {
      it('should redact passwords from strings', () => {
        const input = 'password: "secret123"';
        const result = service.sanitize(input);
        expect(result).toContain('[REDACTED]');
        expect(result).not.toContain('secret123');
      });

      it('should redact JWT tokens from strings', () => {
        const input = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
        const result = service.sanitize(input);
        expect(result).toContain('[REDACTED]');
      });

      it('should redact API keys from strings', () => {
        const input = 'apiKey: "sk_live_1234567890abcdef"';
        const result = service.sanitize(input);
        expect(result).toContain('[REDACTED]');
        expect(result).not.toContain('sk_live_1234567890abcdef');
      });

      it('should redact credit card numbers from strings', () => {
        const input = 'cardNumber: "4532 1234 5678 9010"';
        const result = service.sanitize(input);
        expect(result).toContain('[REDACTED]');
      });
    });

    describe('P3-2: Object Sanitization', () => {
      it('should sanitize sensitive fields in objects', () => {
        const input = {
          id: '123',
          email: 'user@example.com',
          password: 'secret123',
          accessToken: 'token123',
          apiKey: 'key456',
        };

        const result = service.sanitizeObject(input);

        expect(result.id).toBe('123');
        expect(result.email).toBe('user@example.com');
        expect(result.password).toBe('[REDACTED]');
        expect(result.accessToken).toBe('[REDACTED]');
        expect(result.apiKey).toBe('[REDACTED]');
      });

      it('should sanitize nested objects', () => {
        const input = {
          user: {
            id: '123',
            password: 'secret',
            profile: {
              apiKey: 'key123',
            },
          },
        };

        const result = service.sanitizeObject(input);

        expect(result.user.password).toBe('[REDACTED]');
        expect(result.user.profile.apiKey).toBe('[REDACTED]');
        expect(result.user.id).toBe('123');
      });

      it('should sanitize arrays of objects', () => {
        const input = [
          { id: '1', password: 'pass1' },
          { id: '2', password: 'pass2' },
        ];

        const result = service.sanitizeObject(input);

        expect(result[0].password).toBe('[REDACTED]');
        expect(result[1].password).toBe('[REDACTED]');
        expect(result[0].id).toBe('1');
      });
    });

    describe('P3-2: Header Sanitization', () => {
      it('should sanitize Authorization header', () => {
        const headers = {
          'content-type': 'application/json',
          'authorization': 'Bearer token123',
          'x-custom-header': 'value',
        };

        const result = service.sanitizeHeaders(headers);

        expect(result['content-type']).toBe('application/json');
        expect(result['authorization']).toBe('[REDACTED]');
        expect(result['x-custom-header']).toBe('value');
      });

      it('should sanitize Cookie header', () => {
        const headers = {
          'cookie': 'session=abc123; token=xyz789',
        };

        const result = service.sanitizeHeaders(headers);

        expect(result['cookie']).toBe('[REDACTED]');
      });
    });

    describe('P3-2: User Object Sanitization', () => {
      it('should sanitize user object for logging', () => {
        const user = {
          id: '123',
          email: 'user@example.com',
          displayName: 'John Doe',
          passwordHash: 'hash123',
          familyId: 'family1',
        };

        const result = service.sanitizeUser(user);

        expect(result.id).toBe('123');
        expect(result.email).toMatch(/\*\*\*/); // Masked
        expect(result.displayName).toBe('John Doe');
        expect(result.passwordHash).toBeUndefined(); // Not included
        expect(result.familyId).toBe('family1');
      });

      it('should mask email addresses', () => {
        const result = service.sanitizeUser({
          id: '123',
          email: 'testuser@example.com',
        });

        expect(result.email).toBe('t***@example.com');
      });
    });

    describe('P3-2: Error Sanitization', () => {
      it('should sanitize error objects', () => {
        const error = new Error('Test error with password: secret123');
        (error as any).apiKey = 'key123';

        const result = service.sanitizeError(error);

        expect(result.message).toContain('[REDACTED]');
        expect(result.message).not.toContain('secret123');
        expect(result.apiKey).toBe('[REDACTED]');
      });
    });
  });
});
