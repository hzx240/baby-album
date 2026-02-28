import type { GrowthRecord } from '@/types';

interface GrowthRecordListProps {
  records: GrowthRecord[];
  onEdit: (record: GrowthRecord) => void;
  onDelete: (recordId: string) => void;
}

export function GrowthRecordList({ records, onEdit, onDelete }: GrowthRecordListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = (record: GrowthRecord) => {
    if (window.confirm(`确定要删除 ${formatDate(record.recordDate)} 的记录吗？`)) {
      onDelete(record.id);
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无成长记录</p>
        <p className="text-sm mt-2">点击上方按钮添加第一条记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500">{formatDate(record.recordDate)}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {record.height !== null && record.height !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                    身高
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {record.height} cm
                  </span>
                </span>
              )}
              {record.weight !== null && record.weight !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                    体重
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {record.weight} kg
                  </span>
                </span>
              )}
              {record.headCirc !== null && record.headCirc !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700">
                    头围
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {record.headCirc} cm
                  </span>
                </span>
              )}
            </div>
            {record.notes && (
              <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(record)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              编辑
            </button>
            <button
              onClick={() => handleDelete(record)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
