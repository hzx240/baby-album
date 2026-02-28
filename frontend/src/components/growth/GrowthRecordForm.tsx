import { useState } from 'react';
import type { RecordType, CreateGrowthRecordRequest } from '@/types';

interface GrowthRecordFormProps {
  childId: string;
  onSubmit: (data: CreateGrowthRecordRequest) => void;
  onCancel: () => void;
  initialData?: {
    recordType: RecordType;
    value: number;
    date: string;
    notes?: string;
  };
}

export function GrowthRecordForm({
  childId,
  onSubmit,
  onCancel,
  initialData,
}: GrowthRecordFormProps) {
  const [recordType, setRecordType] = useState<RecordType>(
    initialData?.recordType || 'HEIGHT'
  );
  const [value, setValue] = useState(initialData?.value?.toString() || '');
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate value
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) {
      newErrors.value = '请输入有效的数值';
    } else {
      switch (recordType) {
        case 'HEIGHT':
          if (numValue < 0 || numValue > 200) {
            newErrors.value = '身高范围：0-200cm';
          }
          break;
        case 'WEIGHT':
          if (numValue < 0 || numValue > 100) {
            newErrors.value = '体重范围：0-100kg';
          }
          break;
        case 'HEAD_CIRCUMFERENCE':
          if (numValue < 0 || numValue > 60) {
            newErrors.value = '头围范围：0-60cm';
          }
          break;
      }
    }

    // Validate date
    if (!date) {
      newErrors.date = '请选择日期';
    } else if (new Date(date) > new Date()) {
      newErrors.date = '日期不能晚于今天';
    }

    // Validate notes
    if (notes && notes.length > 500) {
      newErrors.notes = '备注最多500字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        childId,
        recordType,
        value: parseFloat(value),
        date,
        notes: notes || undefined,
      });
    }
  };

  const getLabel = () => {
    switch (recordType) {
      case 'HEIGHT':
        return '身高 (cm)';
      case 'WEIGHT':
        return '体重 (kg)';
      case 'HEAD_CIRCUMFERENCE':
        return '头围 (cm)';
      default:
        return '数值';
    }
  };

  const getPlaceholder = () => {
    switch (recordType) {
      case 'HEIGHT':
        return '例如：75.5';
      case 'WEIGHT':
        return '例如：9.8';
      case 'HEAD_CIRCUMFERENCE':
        return '例如：45.2';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          记录类型
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecordType('HEIGHT')}
            className={`px-4 py-2 rounded-lg ${
              recordType === 'HEIGHT'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            身高
          </button>
          <button
            type="button"
            onClick={() => setRecordType('WEIGHT')}
            className={`px-4 py-2 rounded-lg ${
              recordType === 'WEIGHT'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            体重
          </button>
          <button
            type="button"
            onClick={() => setRecordType('HEAD_CIRCUMFERENCE')}
            className={`px-4 py-2 rounded-lg ${
              recordType === 'HEAD_CIRCUMFERENCE'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            头围
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
          {getLabel()}
        </label>
        <input
          type="number"
          id="value"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={getPlaceholder()}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.value
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          日期
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.date
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          备注（可选）
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="记录一些特殊情况或观察..."
          rows={3}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.notes
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
        <p className="text-gray-400 text-xs mt-1">{notes.length}/500</p>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          保存
        </button>
      </div>
    </form>
  );
}

