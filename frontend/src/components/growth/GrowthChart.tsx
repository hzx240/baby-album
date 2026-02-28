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

interface GrowthChartProps {
  records: GrowthRecord[];
  recordType: 'HEIGHT' | 'WEIGHT' | 'HEAD_CIRCUMFERENCE';
  showWHOCurves?: boolean;
  dateRange?: '1m' | '3m' | '6m' | '1y' | 'all';
}

export function GrowthChart({
  records,
  recordType,
  showWHOCurves = true,
  dateRange = 'all',
}: GrowthChartProps) {
  const chartData = useMemo(() => {
    // Filter records by date range
    const now = new Date();
    const filteredRecords = records.filter((record) => {
      const recordDate = new Date(record.date);
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((record) => ({
        date: new Date(record.date).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        }),
        value: record.value,
        fullDate: record.date,
      }));
  }, [records, dateRange]);

  const getYAxisLabel = () => {
    switch (recordType) {
      case 'HEIGHT':
        return '身高 (cm)';
      case 'WEIGHT':
        return '体重 (kg)';
      case 'HEAD_CIRCUMFERENCE':
        return '头围 (cm)';
      default:
        return '';
    }
  };

  const getLineColor = () => {
    switch (recordType) {
      case 'HEIGHT':
        return '#3b82f6'; // blue
      case 'WEIGHT':
        return '#10b981'; // green
      case 'HEAD_CIRCUMFERENCE':
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

