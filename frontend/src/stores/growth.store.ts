import { create } from 'zustand';
import { growthApi } from '@/api/growth';
import type { GrowthRecord, CreateGrowthRecordRequest, UpdateGrowthRecordRequest } from '@/types';

interface GrowthState {
  records: GrowthRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecords: (childId: string) => Promise<void>;
  createRecord: (data: CreateGrowthRecordRequest) => Promise<void>;
  updateRecord: (recordId: string, data: UpdateGrowthRecordRequest) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  clearError: () => void;
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,

  fetchRecords: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      const records = await growthApi.getGrowthRecords(childId);
      set({ records, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch records',
        isLoading: false
      });
    }
  },

  createRecord: async (data: CreateGrowthRecordRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newRecord = await growthApi.createGrowthRecord(data.childId, data);
      set((state) => ({
        records: [...state.records, newRecord],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create record',
        isLoading: false
      });
      throw error;
    }
  },

  updateRecord: async (recordId: string, data: UpdateGrowthRecordRequest) => {
    set({ isLoading: true, error: null });
    try {
      // Get childId from existing record
      const existingRecord = get().records.find((r) => r.id === recordId);
      if (!existingRecord) {
        throw new Error('Record not found');
      }
      const updatedRecord = await growthApi.updateGrowthRecord(existingRecord.childId, recordId, data);
      set((state) => ({
        records: state.records.map((r) => (r.id === recordId ? updatedRecord : r)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update record',
        isLoading: false
      });
      throw error;
    }
  },

  deleteRecord: async (recordId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get childId from existing record
      const existingRecord = get().records.find((r) => r.id === recordId);
      if (!existingRecord) {
        throw new Error('Record not found');
      }
      await growthApi.deleteGrowthRecord(existingRecord.childId, recordId);
      set((state) => ({
        records: state.records.filter((r) => r.id !== recordId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete record',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
