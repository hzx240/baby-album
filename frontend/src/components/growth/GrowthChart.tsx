import { useMemo, useState, useEffect } from 'react';
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
import type { GrowthRecord, Child } from '@/types';
import { growthApi, type WHOStandardsData } from '@/api/growth';

type MeasurementType = 'height' | 'weight' | 'headCirc';

interface GrowthChartProps {
  records: GrowthRecord[];
  measurementType: MeasurementType;
  child: Child;
  childId: string;
  showWHOCurves?: boolean;
  dateRange?: '1m' | '3m' | '6m' | '1y' | 'all';
}

// Calculate age in months from birth date to a specific date
function calculateAgeInMonths(birthDate: string, targetDate: string): number {
  const birth = new Date(birthDate);
  const target = new Date(targetDate);
  const months = (target.getFullYear() - birth.getFullYear()) * 12 +
                 (target.getMonth() - birth.getMonth());
  return Math.max(0, Math.min(60, months)); // WHO data is for 0-60 months
}

export function GrowthChart({
  records,
  measurementType,
  child,
  childId,
  showWHOCurves = true,
  dateRange = 'all',
}: GrowthChartProps) {
  const [whoData, setWhoData] = useState<Map<string, WHOStandardsData>>(new Map());
  const [isLoadingWHO, setIsLoadingWHO] = useState(false);

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
      .map((record) => {
        const who = whoData.get(record.recordDate);
        return {
          date: new Date(record.recordDate).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          }),
          value: record[measurementType],
          fullDate: record.recordDate,
          p3: who?.p3,
          p15: who?.p15,
          p50: who?.p50,
          p85: who?.p85,
          p97: who?.p97,
        };
      });
  }, [records, measurementType, dateRange, whoData]);

  // Fetch WHO standards data for all record dates
  useEffect(() => {
    if (!showWHOCurves || !child.birthDate || !child.gender) {
      return;
    }

    const gender = child.gender as 'male' | 'female';
    if (gender !== 'male' && gender !== 'female') {
      return;
    }

    const fetchWHOData = async () => {
      setIsLoadingWHO(true);
      const newWhoData = new Map<string, WHOStandardsData>();

      try {
        // Fetch WHO data for each unique record date
        const uniqueDates = [...new Set(records.map(r => r.recordDate))];

        await Promise.all(
          uniqueDates.map(async (recordDate) => {
            try {
              const ageMonths = calculateAgeInMonths(child.birthDate!, recordDate);
              const data = await growthApi.getWHOStandards(
                childId,
                measurementType,
                gender,
                ageMonths
              );
              newWhoData.set(recordDate, data);
            } catch (error) {
              console.error(`Failed to fetch WHO data for ${recordDate}:`, error);
            }
          })
        );

        setWhoData(newWhoData);
      } catch (error) {
        console.error('Failed to fetch WHO standards:', error);
      } finally {
        setIsLoadingWHO(false);
      }
    };

    fetchWHOData();
  }, [records, measurementType, child.birthDate, child.gender, childId, showWHOCurves]);

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
    <div>
      {isLoadingWHO && (
        <div className="text-sm text-gray-500 mb-2">加载WHO标准数据...</div>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />

          {/* User's actual data */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={getLineColor()}
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
            name="实际数据"
          />

          {/* WHO Standard Curves */}
          {showWHOCurves && whoData.size > 0 && (
            <>
              <Line
                type="monotone"
                dataKey="p3"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="P3 (WHO)"
              />
              <Line
                type="monotone"
                dataKey="p15"
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="P15 (WHO)"
              />
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                name="P50 (WHO)"
              />
              <Line
                type="monotone"
                dataKey="p85"
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="P85 (WHO)"
              />
              <Line
                type="monotone"
                dataKey="p97"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="P97 (WHO)"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {showWHOCurves && child.birthDate && child.gender && (
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-1">WHO儿童生长标准参考线说明：</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>P3-P97: 正常范围（97%的儿童在此范围内）</li>
            <li>P50: 中位数（50%的儿童在此值以上）</li>
            <li>实线：您孩子的实际数据</li>
            <li>虚线：WHO标准参考曲线</li>
          </ul>
        </div>
      )}
    </div>
  );
}
