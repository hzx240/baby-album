import { useState, useMemo } from 'react';
import { GrowthChart } from '@/components/growth/GrowthChart';
import { GrowthRecordForm } from '@/components/growth/GrowthRecordForm';
import { GrowthRecordList } from '@/components/growth/GrowthRecordList';
import type { GrowthRecord, RecordType, CreateGrowthRecordRequest } from '@/types';

// Mock data for development
const mockRecords: GrowthRecord[] = [
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
  {
    id: '4',
    childId: 'child-1',
    recordType: 'WEIGHT',
    value: 9.5,
    date: '2026-01-15',
    notes: null,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '5',
    childId: 'child-1',
    recordType: 'WEIGHT',
    value: 9.8,
    date: '2026-02-01',
    notes: null,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: '6',
    childId: 'child-1',
    recordType: 'WEIGHT',
    value: 10.2,
    date: '2026-02-15',
    notes: null,
    createdAt: '2026-02-15T10:00:00Z',
  },
];

export default function GrowthPage() {
  const [records, setRecords] = useState<GrowthRecord[]>(mockRecords);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('HEIGHT');
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.recordType === selectedRecordType);
  }, [records, selectedRecordType]);

  const handleSubmit = (data: CreateGrowthRecordRequest) => {
    if (editingRecord) {
      // Update existing record
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                recordType: data.recordType,
                value: data.value,
                date: data.date,
                notes: data.notes || null,
              }
            : r
        )
      );
      setEditingRecord(null);
    } else {
      // Create new record
      const newRecord: GrowthRecord = {
        id: `temp-${Date.now()}`,
        childId: data.childId,
        recordType: data.recordType,
        value: data.value,
        date: data.date,
        notes: data.notes || null,
        createdAt: new Date().toISOString(),
      };
      setRecords((prev) => [...prev, newRecord]);
    }
    setShowForm(false);
  };

  const handleEdit = (record: GrowthRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">成长追踪</h1>
        <p className="text-gray-600">记录宝宝的成长数据，查看成长曲线</p>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">成长曲线</h2>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">最近1个月</option>
              <option value="3m">最近3个月</option>
              <option value="6m">最近6个月</option>
              <option value="1y">最近1年</option>
              <option value="all">全部</option>
            </select>
          </div>
        </div>

        {/* Record Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedRecordType('HEIGHT')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedRecordType === 'HEIGHT'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            身高
          </button>
          <button
            onClick={() => setSelectedRecordType('WEIGHT')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedRecordType === 'WEIGHT'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            体重
          </button>
          <button
            onClick={() => setSelectedRecordType('HEAD_CIRCUMFERENCE')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedRecordType === 'HEAD_CIRCUMFERENCE'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            头围
          </button>
        </div>

        <GrowthChart
          records={filteredRecords}
          recordType={selectedRecordType}
          dateRange={dateRange}
          showWHOCurves={true}
        />
      </div>

      {/* Records Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">历史记录</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {showForm ? '取消' : '添加记录'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingRecord ? '编辑记录' : '添加新记录'}
            </h3>
            <GrowthRecordForm
              childId="child-1"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={
                editingRecord
                  ? {
                      recordType: editingRecord.recordType,
                      value: editingRecord.value,
                      date: editingRecord.date,
                      notes: editingRecord.notes || undefined,
                    }
                  : undefined
              }
            />
          </div>
        )}

        <GrowthRecordList
          records={records.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
