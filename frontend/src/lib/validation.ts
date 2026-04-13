/**
 * Validation utilities for frontend
 * Provides defense-in-depth security layer
 */

import { validate as uuidValidate } from 'uuid';

/**
 * Validates UUID v4 format
 * @param id - The ID to validate
 * @param fieldName - Field name for error message (default: 'ID')
 * @throws Error if ID is invalid
 */
export const validateUUID = (id: string, fieldName: string = 'ID'): void => {
  if (!id || typeof id !== 'string') {
    throw new Error(`${fieldName} 不能为空`);
  }

  if (!uuidValidate(id)) {
    throw new Error(`${fieldName} 格式无效`);
  }
};

/**
 * Checks if a string is valid UUID v4
 * @param id - The ID to check
 * @returns true if valid, false otherwise
 */
export const isValidUUID = (id: string): boolean => {
  return uuidValidate(id);
};
