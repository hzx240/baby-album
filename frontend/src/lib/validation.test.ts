/**
 * Validation Library Tests
 * Testing validation utilities
 */

import { describe, it, expect } from 'vitest';
import { validateUUID, isValidUUID } from './validation';

describe('Validation Library', () => {
  describe('validateUUID', () => {
    it('should validate correct UUID v4 format', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => validateUUID(validUUID)).not.toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => validateUUID('')).toThrow('ID 不能为空');
    });

    it('should throw error for null input', () => {
      expect(() => validateUUID(null as any)).toThrow('ID 不能为空');
    });

    it('should throw error for undefined input', () => {
      expect(() => validateUUID(undefined as any)).toThrow('ID 不能为空');
    });

    it('should throw error for invalid UUID format', () => {
      const invalidUUID = 'not-a-uuid';
      expect(() => validateUUID(invalidUUID)).toThrow('ID 格式无效');
    });

    it('should throw error for partially valid UUID', () => {
      const partialUUID = '550e8400-e29b-41d4';
      expect(() => validateUUID(partialUUID)).toThrow('ID 格式无效');
    });

    it('should include custom field name in error message', () => {
      expect(() => validateUUID('', 'PhotoId')).toThrow('PhotoId 不能为空');
      expect(() => validateUUID('invalid', 'AlbumId')).toThrow('AlbumId 格式无效');
    });

    it('should validate UUID with different case', () => {
      const upperCaseUUID = '550E8400-E29B-41D4-A716-446655440000';
      expect(() => validateUUID(upperCaseUUID)).not.toThrow();
    });

    it('should reject UUID without dashes', () => {
      const noDashUUID = '550e8400e29b41d4a716446655440000';
      expect(() => validateUUID(noDashUUID)).toThrow('ID 格式无效');
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isValidUUID(null as any)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isValidUUID(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidUUID(12345 as any)).toBe(false);
      expect(isValidUUID({} as any)).toBe(false);
      expect(isValidUUID([] as any)).toBe(false);
    });

    it('should return false for UUID without dashes', () => {
      const noDashUUID = '550e8400e29b41d4a716446655440000';
      expect(isValidUUID(noDashUUID)).toBe(false);
    });

    it('should return false for partially valid UUID', () => {
      const partialUUID = '550e8400-e29b-41d4';
      expect(isValidUUID(partialUUID)).toBe(false);
    });

    it('should handle UUID v1 format', () => {
      // UUID v1 has different time-based pattern
      const uuidv1 = '00000000-0000-1000-8000-000000000000';
      expect(isValidUUID(uuidv1)).toBe(true);
    });

    it('should handle mixed case UUID', () => {
      const mixedCaseUUID = '550E8400-e29b-41D4-a716-446655440000';
      expect(isValidUUID(mixedCaseUUID)).toBe(true);
    });
  });

  describe('Security edge cases', () => {
    it('should reject potential injection attempts', () => {
      const injection = "550e8400-e29b-41d4-a716-446655440'; DROP TABLE users; --";
      expect(isValidUUID(injection)).toBe(false);
    });

    it('should reject XSS attempts', () => {
      const xss = '<script>alert("XSS")</script>';
      expect(isValidUUID(xss)).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      const pathTraversal = '../../../etc/passwd';
      expect(isValidUUID(pathTraversal)).toBe(false);
    });

    it('should reject very long strings (DoS prevention)', () => {
      const longString = 'a'.repeat(10000);
      expect(isValidUUID(longString)).toBe(false);
    });
  });
});
