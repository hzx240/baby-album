import { create } from 'zustand';
import { growthApi } from '@/api/growth';
import type {
  GrowthRecord,
  CreateGrowthRecordRequest,
  UpdateGrowthRecordRequest,
  QueryGrowthRecordsParams,
} from '@/types';

export type MeasurementType = 'height' | 'weight' | 'headCirc';

interface GrowthState {
  records: GrowthRecord[];
  isLoading: boolean;
  error: string | null;
  selectedMeasurement: MeasurementType;
  dateRange: '1m' | '3m' | '6m' | '1y' | 'all';

  // Actions
  fetchRecords: (childId: string, params?: QueryGrowthRecordsParams) => Promise<void>;
  createRecord: (childId: string, data: CreateGrowthRecordRequest) => Promise<GrowthRecord>;
  updateRecord: (
    childId: string,
    recordId: string,
    data: UpdateGrowthRecordRequest
  ) => Promise<void>;
  deleteRecord: (childId: string, recordId: string) => Promise<void>;
  setSelectedMeasurement: (type: MeasurementType) => void;
  setDateRange: (range: '1m' | '3m' | '6m' | '1y' | 'all') => void;
  clearError: () => void;
  exportCSV: (childId: string) => Promise<void>;
  importCSV: (childId: string, file: File) => Promise<{ success: number; failed: number }>;
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  selectedMeasurement: 'height',
  dateRange: 'all',

  fetchRecords: async (childId: string, params?: QueryGrowthRecordsParams) => {
    set({ isLoading: true, error: null });
    try {
      const records = await growthApi.getGrowthRecords(childId, params);
      set({ records, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '获取成长记录失败',
        isLoading: false,
      });
    }
  },

  createRecord: async (childId: string, data: CreateGrowthRecordRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newRecord = await growthApi.createGrowthRecord(childId, data);
      set((state) => ({
        records: [...state.records, newRecord],
        isLoading: false,
      }));
      return newRecord;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '添加成长记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRecord: async (
    childId: string,
    recordId: string,
    data: UpdateGrowthRecordRequest
  ) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRecord = await growthApi.updateGrowthRecord(childId, recordId, data);
      set((state) => ({
        records: state.records.map((r) => (r.id === recordId ? updatedRecord : r)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '更新成长记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRecord: async (childId: string, recordId: string) => {
    set({ isLoading: true, error: null });
    try {
      await growthApi.deleteGrowthRecord(childId, recordId);
      set((state) => ({
        records: state.records.filter((r) => r.id !== recordId),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '删除成长记录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedMeasurement: (type: MeasurementType) => {
    set({ selectedMeasurement: type });
  },

  setDateRange: (range: '1m' | '3m' | '6m' | '1y' | 'all') => {
    set({ dateRange: range });
  },

  clearError: () => set({ error: null }),

  exportCSV: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      const blob = await growthApi.exportGrowthRecordsCSV(childId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth-records-${childId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '导出CSV失败',
        isLoading: false,
      });
      throw error;
    }
  },

  importCSV: async (childId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const result = await growthApi.importGrowthRecordsCSV(childId, file);

      // Refresh records after import
      await get().fetchRecords(childId);

      set({ isLoading: false });
      return result;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '导入CSV失败',
        isLoading: false,
      });
      throw error;
    }
  },
}));
