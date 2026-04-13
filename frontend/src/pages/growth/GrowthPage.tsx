import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GrowthChart } from '@/components/growth/GrowthChart';
import { GrowthRecordForm } from '@/components/growth/GrowthRecordForm';
import { GrowthRecordList } from '@/components/growth/GrowthRecordList';
import { downloadGrowthReport } from '@/components/reports/GrowthReportGenerator';
import { useGrowthStore } from '@/stores/growth.store';
import { useChildStore } from '@/stores/child.store';
import type { GrowthRecord, CreateGrowthRecordRequest } from '@/types';

type MeasurementType = 'height' | 'weight' | 'headCirc';

export default function GrowthPage() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const { records, isLoading, fetchRecords, createRecord, updateRecord, deleteRecord } = useGrowthStore();
  const { children, fetchChildren } = useChildStore();

  const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType>('height');
  const [dateRange, setDateRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  // Fetch children and records when component mounts or childId changes
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (childId) {
      fetchRecords(childId);
    }
  }, [childId, fetchRecords]);

  // Find the current child
  const currentChild = useMemo(() => {
    return (children || []).find((c) => c.id === childId);
  }, [children, childId]);

  // 如果 childId 不存在，自动跳转到第一个孩子的成长页面
  useEffect(() => {
    if (!childId && children && children.length > 0) {
      navigate(`/growth/${children[0].id}`, { replace: true });
    }
  }, [childId, children, navigate]);

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
        <p className="text-gray-600">正在跳转...</p>
      </div>
    );
  }

  if (isLoading || !currentChild) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="animate-heartbeat">📈</span> 成长追踪
        </h1>
        <p className="text-gray-500 text-sm">记录宝宝的成长数据，实时查看成长曲线</p>
      </div>

      {/* 图表卡片 */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)',
          boxShadow: '0 4px 20px rgba(255,107,157,0.10)',
        }}
      >
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800">成长曲线</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="text-sm border border-pink-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="1m">最近 1 个月</option>
            <option value="3m">最近 3 个月</option>
            <option value="6m">最近 6 个月</option>
            <option value="1y">最近 1 年</option>
            <option value="all">全部数据</option>
          </select>
        </div>

        {/* 指标胶囊 Tab */}
        <div className="flex gap-2 mb-5">
          {(
            [
              { key: 'height', label: '📏 身高', activeColor: 'bg-pink-500' },
              { key: 'weight', label: '⚖️ 体重', activeColor: 'bg-orange-500' },
              { key: 'headCirc', label: '🔵 头围', activeColor: 'bg-teal-500' },
            ] as const
          ).map(({ key, label, activeColor }) => (
            <button
              key={key}
              onClick={() => setSelectedMeasurementType(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedMeasurementType === key
                  ? `${activeColor} text-white shadow-md`
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <GrowthChart
          records={filteredRecords}
          measurementType={selectedMeasurementType}
          child={currentChild}
          childId={childId}
          dateRange={dateRange}
          showWHOCurves={true}
        />
      </div>

      {/* 历史记录卡片 */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 4px 20px rgba(255,107,157,0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">历史记录</h2>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const birthDate = currentChild.birthDate || new Date().toISOString();
                  await downloadGrowthReport(
                    {
                      name: currentChild.name,
                      birthDate,
                      gender: currentChild.gender || undefined,
                    },
                    records,
                    [],
                  );
                } catch (err) {
                  console.error('PDF export failed:', err);
                  alert('导出PDF失败，请重试');
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-md bg-teal-500 hover:bg-teal-600 flex items-center gap-1"
            >
              <span>📄</span> 导出PDF
            </button>
            <button
              onClick={() => {
                if (showForm) {
                  handleCancel();
                } else {
                  setShowForm(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-md"
              style={{
                background: showForm
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #ff6b9d 0%, #ff9f4a 100%)',
              }}
            >
              {showForm ? '取消' : '＋ 添加记录'}
            </button>
          </div>
        </div>

        {showForm && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)' }}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingRecord ? '✏️ 编辑记录' : '➕ 添加新记录'}
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
