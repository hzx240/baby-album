import { api } from '@/lib/api-client';
import type {
  GrowthRecord,
  CreateGrowthRecordRequest,
  UpdateGrowthRecordRequest,
  QueryGrowthRecordsParams,
} from '@/types';

/**
 * Growth Record API
 * Integrated with backend API
 */

/**
 * Get growth records for a child
 */
export async function getGrowthRecords(
  childId: string,
  params?: QueryGrowthRecordsParams
): Promise<GrowthRecord[]> {
  const response = await api.get<GrowthRecord[]>(
    `/api/children/${childId}/growth`,
    { params }
  );
  return response.data;
}

/**
 * Create a new growth record
 */
export async function createGrowthRecord(
  childId: string,
  data: CreateGrowthRecordRequest
): Promise<GrowthRecord> {
  const { childId: _unused, ...body } = data;
  const response = await api.post<GrowthRecord>(
    `/api/children/${childId}/growth`,
    body
  );
  return response.data;
}

/**
 * Update a growth record
 */
export async function updateGrowthRecord(
  childId: string,
  recordId: string,
  data: UpdateGrowthRecordRequest
): Promise<GrowthRecord> {
  const response = await api.put<GrowthRecord>(
    `/api/children/${childId}/growth/${recordId}`,
    data
  );
  return response.data;
}

/**
 * Delete a growth record
 */
export async function deleteGrowthRecord(
  childId: string,
  recordId: string
): Promise<void> {
  await api.delete(`/api/children/${childId}/growth/${recordId}`);
}

/**
 * Export growth records as CSV
 */
export async function exportGrowthRecordsCSV(childId: string): Promise<Blob> {
  const response = await api.get(`/api/children/${childId}/growth/export`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Import growth records from CSV
 */
export async function importGrowthRecordsCSV(
  childId: string,
  file: File
): Promise<{ success: number; failed: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ success: number; failed: number }>(
    `/api/children/${childId}/growth/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * WHO Standards Data
 */
export interface WHOStandardsData {
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

/**
 * Get WHO growth standards for a specific measurement
 */
export async function getWHOStandards(
  childId: string,
  measurementType: 'height' | 'weight' | 'headCirc',
  gender: 'male' | 'female',
  ageMonths: number
): Promise<WHOStandardsData> {
  const response = await api.get<WHOStandardsData>(
    `/api/children/${childId}/growth/who-standards`,
    {
      params: {
        measurementType,
        gender,
        ageMonths,
      },
    }
  );
  return response.data;
}

export const growthApi = {
  getGrowthRecords,
  createGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
  exportGrowthRecordsCSV,
  importGrowthRecordsCSV,
  getWHOStandards,
};

