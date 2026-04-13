/**
 * Child API Tests
 * Testing child API client functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { childApi } from './child';
import type {
  Child,
  CreateChildRequest,
  UpdateChildRequest,
} from '@/types';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '@/lib/api-client';

describe('Child API', () => {
  const mockChild: Child = {
    id: 'child-123',
    familyId: 'family-123',
    name: 'Test Child',
    birthDate: '2023-01-01T00:00:00Z',
    gender: 'F',
    avatar: null,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChildren', () => {
    it('should fetch all children', async () => {
      const mockChildren = [mockChild];
      vi.mocked(api.get).mockResolvedValue({ data: mockChildren });

      const result = await childApi.getChildren();

      expect(result).toEqual(mockChildren);
      expect(api.get).toHaveBeenCalledWith('/api/v1/children');
    });

    it('should return empty array when no children', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const result = await childApi.getChildren();

      expect(result).toEqual([]);
      expect(api.get).toHaveBeenCalledWith('/api/v1/children');
    });
  });

  describe('getChild', () => {
    it('should fetch single child by id', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockChild });

      const result = await childApi.getChild('child-123');

      expect(result).toEqual(mockChild);
      expect(api.get).toHaveBeenCalledWith('/api/v1/children/child-123');
    });

    it('should handle special characters in child id', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockChild });

      const childId = 'child-with-special-chars_123';
      await childApi.getChild(childId);

      expect(api.get).toHaveBeenCalledWith(`/api/v1/children/${childId}`);
    });
  });

  describe('createChild', () => {
    it('should create a new child', async () => {
      const createData: CreateChildRequest = {
        name: 'New Baby',
        birthDate: '2024-01-01',
        gender: 'male',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockChild });

      const result = await childApi.createChild(createData);

      expect(result).toEqual(mockChild);
      expect(api.post).toHaveBeenCalledWith('/api/v1/children', createData);
    });

    it('should create child without gender', async () => {
      const createData: CreateChildRequest = {
        name: 'Baby',
        birthDate: '2024-02-15',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockChild });

      await childApi.createChild(createData);

      expect(api.post).toHaveBeenCalledWith('/api/v1/children', createData);
    });

    it('should handle Chinese characters in name', async () => {
      const createData: CreateChildRequest = {
        name: '宝宝小明',
        birthDate: '2024-01-01',
        gender: 'male',
      };

      const childWithChineseName = { ...mockChild, name: createData.name };
      vi.mocked(api.post).mockResolvedValue({ data: childWithChineseName });

      const result = await childApi.createChild(createData);

      expect(result.name).toBe('宝宝小明');
    });
  });

  describe('updateChild', () => {
    it('should update child', async () => {
      const updateData: UpdateChildRequest = {
        name: 'Updated Name',
        gender: 'female',
      };

      const updatedChild = { ...mockChild, ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedChild });

      const result = await childApi.updateChild('child-123', updateData);

      expect(result).toEqual(updatedChild);
      expect(api.patch).toHaveBeenCalledWith('/api/v1/children/child-123', updateData);
    });

    it('should handle partial updates', async () => {
      const updateData: UpdateChildRequest = {
        name: 'New Name Only',
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockChild });

      await childApi.updateChild('child-123', updateData);

      expect(api.patch).toHaveBeenCalledWith('/api/v1/children/child-123', updateData);
    });

    it('should update birth date', async () => {
      const updateData: UpdateChildRequest = {
        birthDate: '2023-06-15',
      };

      const updatedChild = { ...mockChild, birthDate: '2023-06-15T00:00:00Z' };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedChild });

      const result = await childApi.updateChild('child-123', updateData);

      expect(result.birthDate).toBeDefined();
    });
  });

  describe('deleteChild', () => {
    it('should delete child', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await childApi.deleteChild('child-123');

      expect(api.delete).toHaveBeenCalledWith('/api/v1/children/child-123');
    });

    it('should handle delete with unicode id', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await childApi.deleteChild('child-中文-123');

      expect(api.delete).toHaveBeenCalledWith('/api/v1/children/child-中文-123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle future birth date', async () => {
      const createData: CreateChildRequest = {
        name: 'Unborn Baby',
        birthDate: '2025-12-31',
        gender: 'female',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockChild });

      await childApi.createChild(createData);

      expect(api.post).toHaveBeenCalledWith('/api/v1/children', createData);
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(100);
      const updateData: UpdateChildRequest = { name: longName };

      vi.mocked(api.patch).mockResolvedValue({
        data: { ...mockChild, name: longName },
      });

      const result = await childApi.updateChild('child-123', updateData);

      expect(result.name).toBe(longName);
    });

    it('should handle all gender options', async () => {
      const genders = ['M', 'F', 'X', null];

      for (const gender of genders) {
        const createData: CreateChildRequest = {
          name: 'Test Child',
          birthDate: '2024-01-01',
          gender: gender as any,
        };

        vi.mocked(api.post).mockResolvedValue({
          data: { ...mockChild, gender: gender || null },
        });

        const result = await childApi.createChild(createData);

        expect(result.gender).toBe(gender || null);
      }
    });
  });
});
