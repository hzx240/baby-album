import { api } from '@/lib/api-client';
import type {
  GrowthRecord,
  CreateGrowthRecordRequest,
  UpdateGrowthRecordRequest,
  QueryGrowthRecordsParams,
  PaginatedResponse,
} from '@/types';

/**
 * Growth Record API
 *
 * Phase 1: Mock data implementation
 * Phase 2: Real API integration (after backend schema is ready)
 */

// Mock data for development
const mockGrowthRecords: GrowthRecord[] = [
  {
    id: '1',
    childId: 'child-1',
    recordType: 'HEIGHT',
    value: 75.5,
    date: '2026-01-15',
    notes: '宝宝长高了',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    childId: 'child-1',
    recordType: 'HEIGHT',
    value: 76.2,
    date: '2026-02-01',
    notes: null,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: '3',
    childId: 'child-1',
    recordType: 'HEIGHT',
    value: 77.0,
    date: '2026-02-15',
    notes: null,
    createdAt: '2026-02-15T10:00:00Z',
  },
];

/**
 * Get growth records for a child
 * TODO: Replace with real API call when backend is ready
 */
export async function getGrowthRecords(
  childId: string,
  params?: QueryGrowthRecordsParams
): Promise<PaginatedResponse<GrowthRecord>> {
  // Phase 1: Return mock data
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  let filteredRecords = mockGrowthRecords.filter((r) => r.childId === childId);

  // Apply filters
  if (params?.recordType) {
    filteredRecords = filteredRecords.filter((r) => r.recordType === params.recordType);
  }

  if (params?.startDate) {
    filteredRecords = filteredRecords.filter((r) => r.date >= params.startDate!);
  }

  if (params?.endDate) {
    filteredRecords = filteredRecords.filter((r) => r.date <= params.endDate!);
  }

  // Sort by date descending
  filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  return {
    data: paginatedRecords,
    meta: {
      total: filteredRecords.length,
      page,
      limit,
      totalPages: Math.ceil(filteredRecords.length / limit),
    },
  };

  // Phase 2: Real API call
  // const response = await api.get<PaginatedResponse<GrowthRecord>>(
  //   `/api/children/${childId}/growth`,
  //   { params }
  // );
  // return response.data;
}

/**
 * Create a new growth record
 * TODO: Replace with real API call when backend is ready
 */
export async function createGrowthRecord(
  data: CreateGrowthRecordRequest
): Promise<GrowthRecord> {
  // Phase 1: Return mock data
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newRecord: GrowthRecord = {
    id: `temp-${Date.now()}`,
    childId: data.childId,
    recordType: data.recordType,
    value: data.value,
    date: data.date,
    notes: data.notes || null,
    createdAt: new Date().toISOString(),
  };

  mockGrowthRecords.push(newRecord);
  return newRecord;

  // Phase 2: Real API call
  // const response = await api.post<GrowthRecord>(
  //   `/api/children/${data.childId}/growth`,
  //   data
  // );
  // return response.data;
}

/**
 * Update a growth record
 * TODO: Replace with real API call when backend is ready
 */
export async function updateGrowthRecord(
  childId: string,
  recordId: string,
  data: UpdateGrowthRecordRequest
): Promise<GrowthRecord> {
  // Phase 1: Return mock data
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = mockGrowthRecords.findIndex((r) => r.id === recordId);
  if (index === -1) {
    throw new Error('Record not found');
  }

  const updatedRecord = {
    ...mockGrowthRecords[index],
    ...data,
  };

  mockGrowthRecords[index] = updatedRecord;
  return updatedRecord;

  // Phase 2: Real API call
  // const response = await api.put<GrowthRecord>(
  //   `/api/children/${childId}/growth/${recordId}`,
  //   data
  // );
  // return response.data;
}

/**
 * Delete a growth record
 * TODO: Replace with real API call when backend is ready
 */
export async function deleteGrowthRecord(
  childId: string,
  recordId: string
): Promise<void> {
  // Phase 1: Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = mockGrowthRecords.findIndex((r) => r.id === recordId);
  if (index !== -1) {
    mockGrowthRecords.splice(index, 1);
  }

  // Phase 2: Real API call
  // await api.delete(`/api/children/${childId}/growth/${recordId}`);
}

/**
 * Export growth records as CSV
 * TODO: Implement when backend is ready
 */
export async function exportGrowthRecordsCSV(childId: string): Promise<Blob> {
  // Phase 1: Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 500));

  const records = mockGrowthRecords.filter((r) => r.childId === childId);
  const csv = [
    'Date,Type,Value,Notes',
    ...records.map((r) =>
      [r.date, r.recordType, r.value, r.notes || ''].join(',')
    ),
  ].join('\n');

  return new Blob([csv], { type: 'text/csv' });

  // Phase 2: Real API call
  // const response = await api.get(`/api/children/${childId}/growth/export`, {
  //   responseType: 'blob',
  // });
  // return response.data;
}

/**
 * Import growth records from CSV
 * TODO: Implement when backend is ready
 */
export async function importGrowthRecordsCSV(
  childId: string,
  file: File
): Promise<{ success: number; failed: number }> {
  // Phase 1: Mock implementation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: 10,
    failed: 0,
  };

  // Phase 2: Real API call
  // const formData = new FormData();
  // formData.append('file', file);
  //
  // const response = await api.post<{ success: number; failed: number }>(
  //   `/api/children/${childId}/growth/import`,
  //   formData,
  //   {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   }
  // );
  // return response.data;
}

export const growthApi = {
  getGrowthRecords,
  createGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
  exportGrowthRecordsCSV,
  importGrowthRecordsCSV,
};
