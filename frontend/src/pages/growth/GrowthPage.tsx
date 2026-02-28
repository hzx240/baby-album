import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GrowthChart } from '@/components/growth/GrowthChart';
import { GrowthRecordForm } from '@/components/growth/GrowthRecordForm';
import { GrowthRecordList } from '@/components/growth/GrowthRecordList';
import { useGrowthStore } from '@/stores/growth.store';
import type { GrowthRecord, CreateGrowthRecordRequest } from '@/types';

type MeasurementType = 'height' | 'weight' | 'headCirc';

export default function GrowthPage() {
  const { childId } = useParams<{ childId: string }>();
  const { records, isLoading, fetchRecords, createRecord, updateRecord, deleteRecord } = useGrowthStore();

  const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType>('height');
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  // Fetch records when component mounts or childId changes
  useEffect(() => {
    if (childId) {
      fetchRecords(childId);
    }
  }, [childId, fetchRecords]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const value = r[selectedMeasurementType];
      return value !== null && value !== undefined;
    });
  }, [records, selectedMeasurementType]);

  const handleSubmit = async (data: CreateGrowthRecordRequest) => {
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, data);
        setEditingRecord(null);
      } else {
        await createRecord(data);
      }
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('保存失败，请重试');
    }
  };

  const handleEdit = (record: GrowthRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (recordId: string) => {
    try {
      await deleteRecord(recordId);
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('删除失败，请重试');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  if (!childId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">错误：未指定孩子ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

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
            onClick={() => setSelectedMeasurementType('height')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedMeasurementType === 'height'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            身高
          </button>
          <button
            onClick={() => setSelectedMeasurementType('weight')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedMeasurementType === 'weight'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            体重
          </button>
          <button
            onClick={() => setSelectedMeasurementType('headCirc')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedMeasurementType === 'headCirc'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            头围
          </button>
        </div>

        <GrowthChart
          records={filteredRecords}
          measurementType={selectedMeasurementType}
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
              childId={childId}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={
                editingRecord
                  ? {
                      recordDate: editingRecord.recordDate,
                      height: editingRecord.height ?? undefined,
                      weight: editingRecord.weight ?? undefined,
                      headCirc: editingRecord.headCirc ?? undefined,
                      notes: editingRecord.notes ?? undefined,
                    }
                  : undefined
              }
            />
          </div>
        )}

        <GrowthRecordList
          records={records.sort(
            (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
          )}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
