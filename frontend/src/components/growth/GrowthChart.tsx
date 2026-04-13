import { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

// 计算月龄
function calculateAgeInMonths(birthDate: string, targetDate: string): number {
  const birth = new Date(birthDate);
  const target = new Date(targetDate);
  const months =
    (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth());
  return Math.max(0, Math.min(60, months));
}

// 指标配置
const MEASUREMENT_CONFIG = {
  height: {
    label: '身高 (cm)',
    color: '#ff6b9d',
    gradientStart: 'rgba(255,107,157,0.25)',
    gradientEnd: 'rgba(255,107,157,0)',
    dotColor: '#e6356f',
  },
  weight: {
    label: '体重 (kg)',
    color: '#f97316',
    gradientStart: 'rgba(249,115,22,0.25)',
    gradientEnd: 'rgba(249,115,22,0)',
    dotColor: '#ea6000',
  },
  headCirc: {
    label: '头围 (cm)',
    color: '#14b8a6',
    gradientStart: 'rgba(20,184,166,0.25)',
    gradientEnd: 'rgba(20,184,166,0)',
    dotColor: '#0d9488',
  },
};

// 自定义 Tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
  measurementType,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  measurementType: MeasurementType;
}) => {
  if (!active || !payload || !payload.length) return null;

  const config = MEASUREMENT_CONFIG[measurementType];
  const actualEntry = payload.find((p) => p.dataKey === 'value');
  const p50Entry = payload.find((p) => p.dataKey === 'p50');

  return (
    <div
      className="rounded-xl p-3 text-sm shadow-lg border border-pink-100"
      style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)' }}
    >
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {actualEntry && (
        <p style={{ color: config.color }} className="font-bold">
          实际：{actualEntry.value} {measurementType === 'weight' ? 'kg' : 'cm'}
        </p>
      )}
      {p50Entry && (
        <p className="text-gray-500">WHO 中位数：{p50Entry.value}</p>
      )}
    </div>
  );
};

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

  const config = MEASUREMENT_CONFIG[measurementType];

  const chartData = useMemo(() => {
    const now = new Date();
    const filteredRecords = records.filter((record) => {
      if (record[measurementType] === null) return false;
      const recordDate = new Date(record.recordDate);
      const diffMonths =
        (now.getFullYear() - recordDate.getFullYear()) * 12 +
        (now.getMonth() - recordDate.getMonth());
      switch (dateRange) {
        case '1m': return diffMonths <= 1;
        case '3m': return diffMonths <= 3;
        case '6m': return diffMonths <= 6;
        case '1y': return diffMonths <= 12;
        default: return true;
      }
    });

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
          p50: who?.p50,
          p97: who?.p97,
        };
      });
  }, [records, measurementType, dateRange, whoData]);

  useEffect(() => {
    if (!showWHOCurves || !child.birthDate || !child.gender) return;
    const gender = child.gender as 'male' | 'female';
    if (gender !== 'male' && gender !== 'female') return;

    const fetchWHOData = async () => {
      setIsLoadingWHO(true);
      const newWhoData = new Map<string, WHOStandardsData>();
      try {
        const uniqueDates = [...new Set(records.map((r) => r.recordDate))];
        await Promise.all(
          uniqueDates.map(async (recordDate) => {
            try {
              const ageMonths = calculateAgeInMonths(child.birthDate!, recordDate);
              const data = await growthApi.getWHOStandards(childId, measurementType, gender, ageMonths);
              newWhoData.set(recordDate, data);
            } catch {
              // ignore per-record errors
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

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-56 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)' }}
      >
        <div className="text-5xl mb-3 animate-float">📈</div>
        <p className="font-semibold text-gray-600 mb-1">还没有成长数据</p>
        <p className="text-sm text-gray-400">点击"添加记录"开始记录宝宝的成长曲线</p>
      </div>
    );
  }

  return (
    <div>
      {isLoadingWHO && (
        <p className="text-xs text-pink-400 mb-2 flex items-center gap-1">
          <span className="animate-spin inline-block">⏳</span> 加载 WHO 标准数据中…
        </p>
      )}

      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${measurementType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f0e0e8" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#f0e0e8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: config.label,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: 11 },
            }}
          />
          <Tooltip content={<CustomTooltip measurementType={measurementType} />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#6b7280', fontSize: 12 }}>{value}</span>
            )}
          />

          {/* WHO 参考区间 (P3 ~ P97 阴影区) */}
          {showWHOCurves && whoData.size > 0 && (
            <>
              <Area
                type="monotone"
                dataKey="p97"
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="rgba(209,213,219,0.15)"
                dot={false}
                name="P97 (WHO)"
                legendType="line"
              />
              <Area
                type="monotone"
                dataKey="p50"
                stroke="#86efac"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill="rgba(134,239,172,0.1)"
                dot={false}
                name="P50 中位数 (WHO)"
                legendType="line"
              />
              <Area
                type="monotone"
                dataKey="p3"
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
                name="P3 (WHO)"
                legendType="line"
              />
            </>
          )}

          {/* 实际数据曲线 */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={3}
            fill={`url(#gradient-${measurementType})`}
            dot={{ r: 5, fill: config.dotColor, stroke: 'white', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: config.dotColor, stroke: 'white', strokeWidth: 2 }}
            name="实际数据"
          />
        </AreaChart>
      </ResponsiveContainer>

      {showWHOCurves && child.birthDate && child.gender && (
        <div className="mt-3 p-3 rounded-xl bg-green-50 text-xs text-gray-500 flex gap-4 flex-wrap">
          <span>📊 <b>P3 / P97</b>：正常参考范围</span>
          <span>📈 <b>P50</b>：同龄儿童中位数</span>
          <span>实线：宝宝的实际数据</span>
        </div>
      )}
    </div>
  );
}
