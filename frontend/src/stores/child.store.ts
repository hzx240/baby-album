import { create } from 'zustand';
import { childApi } from '@/api/child';
import type { Child, CreateChildRequest, UpdateChildRequest } from '@/types';

interface ChildState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChildren: () => Promise<void>;
  setSelectedChild: (child: Child | null) => void;
  createChild: (data: CreateChildRequest) => Promise<Child>;
  updateChild: (childId: string, data: UpdateChildRequest) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  clearError: () => void;
}

export const useChildStore = create<ChildState>((set) => ({
  children: [],
  selectedChild: null,
  isLoading: false,
  error: null,

  fetchChildren: async () => {
    set({ isLoading: true, error: null });
    try {
      const children = await childApi.getChildren();
      set({ children, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取宝贝列表失败',
        isLoading: false,
      });
    }
  },

  setSelectedChild: (child: Child | null) => {
    set({ selectedChild: child });
  },

  createChild: async (data: CreateChildRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newChild = await childApi.createChild(data);
      set((state) => ({
        children: [...state.children, newChild],
        isLoading: false,
      }));
      return newChild;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '添加宝贝失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateChild: async (childId: string, data: UpdateChildRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedChild = await childApi.updateChild(childId, data);
      set((state) => ({
        children: state.children.map((c) =>
          c.id === childId ? updatedChild : c
        ),
        selectedChild:
          state.selectedChild?.id === childId
            ? updatedChild
            : state.selectedChild,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新宝贝失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteChild: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      await childApi.deleteChild(childId);
      set((state) => ({
        children: state.children.filter((c) => c.id !== childId),
        selectedChild:
          state.selectedChild?.id === childId
            ? null
            : state.selectedChild,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除宝贝失败',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
