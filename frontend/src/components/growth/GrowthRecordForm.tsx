import { useState } from 'react';
import type { CreateGrowthRecordRequest, GrowthRecord } from '@/types';

interface GrowthRecordFormProps {
  childId: string;
  onSubmit: (data: CreateGrowthRecordRequest) => void;
  onCancel: () => void;
  initialData?: Partial<GrowthRecord>;
}

export function GrowthRecordForm({
  childId,
  onSubmit,
  onCancel,
  initialData,
}: GrowthRecordFormProps) {
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [headCirc, setHeadCirc] = useState(initialData?.headCirc?.toString() || '');
  const [recordDate, setRecordDate] = useState(
    initialData?.recordDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate at least one measurement is provided
    if (!height && !weight && !headCirc) {
      newErrors.measurements = '请至少填写一项测量值';
    }

    // Validate height
    if (height) {
      const numHeight = parseFloat(height);
      if (isNaN(numHeight) || numHeight < 0 || numHeight > 200) {
        newErrors.height = '身高范围：0-200cm';
      }
    }

    // Validate weight
    if (weight) {
      const numWeight = parseFloat(weight);
      if (isNaN(numWeight) || numWeight < 0 || numWeight > 100) {
        newErrors.weight = '体重范围：0-100kg';
      }
    }

    // Validate head circumference
    if (headCirc) {
      const numHeadCirc = parseFloat(headCirc);
      if (isNaN(numHeadCirc) || numHeadCirc < 0 || numHeadCirc > 60) {
        newErrors.headCirc = '头围范围：0-60cm';
      }
    }

    // Validate date
    if (!recordDate) {
      newErrors.recordDate = '请选择日期';
    } else if (new Date(recordDate) > new Date()) {
      newErrors.recordDate = '日期不能晚于今天';
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
        recordDate,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        headCirc: headCirc ? parseFloat(headCirc) : undefined,
        notes: notes || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.measurements && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.measurements}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
            身高 (cm) <span className="text-gray-400">可选</span>
          </label>
          <input
            type="number"
            id="height"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="例如：75.5"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.height
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            体重 (kg) <span className="text-gray-400">可选</span>
          </label>
          <input
            type="number"
            id="weight"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="例如：9.8"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.weight
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
        </div>

        <div>
          <label htmlFor="headCirc" className="block text-sm font-medium text-gray-700 mb-1">
            头围 (cm) <span className="text-gray-400">可选</span>
          </label>
          <input
            type="number"
            id="headCirc"
            step="0.1"
            value={headCirc}
            onChange={(e) => setHeadCirc(e.target.value)}
            placeholder="例如：45.2"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.headCirc
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.headCirc && <p className="text-red-500 text-sm mt-1">{errors.headCirc}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700 mb-1">
          日期
        </label>
        <input
          type="date"
          id="recordDate"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.recordDate
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.recordDate && <p className="text-red-500 text-sm mt-1">{errors.recordDate}</p>}
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
