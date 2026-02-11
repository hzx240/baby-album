import api from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';
import type {
  Child,
  CreateChildRequest,
  UpdateChildRequest,
} from '@/types';

export const childApi = {
  /**
   * Get all children in the family
   */
  getChildren: async (): Promise<Child[]> => {
    const response = await api.get<Child[]>(API_ROUTES.CHILDREN);
    return response.data;
  },

  /**
   * Get a single child by ID
   */
  getChild: async (childId: string): Promise<Child> => {
    const response = await api.get<Child>(API_ROUTES.CHILD(childId));
    return response.data;
  },

  /**
   * Create a new child
   */
  createChild: async (data: CreateChildRequest): Promise<Child> => {
    const response = await api.post<Child>(API_ROUTES.CHILDREN, data);
    return response.data;
  },

  /**
   * Update a child
   */
  updateChild: async (
    childId: string,
    data: UpdateChildRequest
  ): Promise<Child> => {
    const response = await api.patch<Child>(API_ROUTES.CHILD(childId), data);
    return response.data;
  },

  /**
   * Delete a child
   */
  deleteChild: async (childId: string): Promise<void> => {
    await api.delete(API_ROUTES.CHILD(childId));
  },
};
