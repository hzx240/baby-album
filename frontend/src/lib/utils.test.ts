/**
 * Utils Library Tests
 * Testing utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red', 'bg-blue')).toBe('text-red bg-blue');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'active', false && 'inactive')).toBe(
        'base-class active'
      );
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle objects with boolean values', () => {
      expect(cn({ 'class-a': true, 'class-b': false, 'class-c': true })).toBe(
        'class-a class-c'
      );
    });

    it('should deduplicate conflicting Tailwind classes', () => {
      expect(cn('p-4 p-2')).toBe('p-2');
    });

    it('should merge conflicting classes keeping the last one', () => {
      expect(cn('text-red text-blue')).toBe('text-blue');
    });

    it('should handle mixed input types', () => {
      expect(cn('base', { active: true }, ['additional'])).toBe(
        'base active additional'
      );
    });

    it('should filter out undefined and null values', () => {
      expect(cn('base', null, undefined, 'active')).toBe('base active');
    });

    it('should handle complex Tailwind conflicts', () => {
      expect(cn('w-full w-1/2')).toBe('w-1/2');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long class strings', () => {
      const longClasses = 'class1 class2 class3'.repeat(100);
      const result = cn(longClasses);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special characters in class names', () => {
      expect(cn('hover:text-red', 'dark:bg-blue')).toBe(
        'hover:text-red dark:bg-blue'
      );
    });

    it('should handle numbers (edge case)', () => {
      expect(cn(1 as any, 'text-red')).toBe('1 text-red');
    });
  });
});
