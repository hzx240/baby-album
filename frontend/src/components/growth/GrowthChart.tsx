import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { GrowthRecord } from '@/types';

type MeasurementType = 'height' | 'weight' | 'headCirc';

interface GrowthChartProps {
  records: GrowthRecord[];
  measurementType: MeasurementType;
  showWHOCurves?: boolean;
  dateRange?: '1m' | '3m' | '6m' | '1y' | 'all';
}

export function GrowthChart({
  records,
  measurementType,
  showWHOCurves = true,
  dateRange = 'all',
}: GrowthChartProps) {
  const chartData = useMemo(() => {
    // Filter records by date range and measurement type
    const now = new Date();
    const filteredRecords = records.filter((record) => {
      // Skip records without the selected measurement
      if (record[measurementType] === null) return false;

      const recordDate = new Date(record.recordDate);
      const diffMonths =
        (now.getFullYear() - recordDate.getFullYear()) * 12 +
        (now.getMonth() - recordDate.getMonth());

      switch (dateRange) {
        case '1m':
          return diffMonths <= 1;
        case '3m':
          return diffMonths <= 3;
        case '6m':
          return diffMonths <= 6;
        case '1y':
          return diffMonths <= 12;
        default:
          return true;
      }
    });

    // Sort by date
    return filteredRecords
      .sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
      .map((record) => ({
        date: new Date(record.recordDate).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        }),
        value: record[measurementType],
        fullDate: record.recordDate,
      }));
  }, [records, measurementType, dateRange]);

  const getYAxisLabel = () => {
    switch (measurementType) {
      case 'height':
        return '身高 (cm)';
      case 'weight':
        return '体重 (kg)';
      case 'headCirc':
        return '头围 (cm)';
      default:
        return '';
    }
  };

  const getLineColor = () => {
    switch (measurementType) {
      case 'height':
        return '#3b82f6'; // blue
      case 'weight':
        return '#10b981'; // green
      case 'headCirc':
        return '#f59e0b'; // amber
      default:
        return '#6b7280';
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 mb-2">暂无数据</p>
          <p className="text-sm text-gray-400">请先添加成长记录</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={getLineColor()}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name={getYAxisLabel()}
        />
        {/* TODO: Add WHO standard curves when data is available */}
      </LineChart>
    </ResponsiveContainer>
  );
}

