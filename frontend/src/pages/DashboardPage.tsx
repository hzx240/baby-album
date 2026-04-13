import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { photoApi } from '@/api/photo';
import { timelineApi } from '@/api/timeline';
import { albumApi } from '@/api/album';
import { useChildStore } from '@/stores/child.store';
import { Loading, EmptyState, Button } from '@/components/ui';
import type { Photo, ImportantDate } from '@/types';
import { cn } from '@/lib/utils';

// 计算宝宝年龄文字描述
function calcBabyAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  if (totalMonths < 1) {
    return `${days} 天`;
  } else if (totalMonths < 12) {
    const extraDays = Math.floor(
      (now.getTime() - new Date(birth.getFullYear(), birth.getMonth() + totalMonths, birth.getDate()).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return extraDays > 0 ? `${totalMonths} 个月零 ${extraDays} 天` : `${totalMonths} 个月`;
  } else if (months === 0) {
    return `${years} 岁`;
  } else {
    return `${years} 岁 ${months} 个月`;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { children, fetchChildren } = useChildStore();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());

  // 组件挂载时获取孩子列表
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const { data: photosResponse, isLoading: photosLoading } = useQuery({
    queryKey: ['photos', 'recent', selectedChildId],
    queryFn: async () => {
      const response = await photoApi.getPhotos({
        childId: selectedChildId,
        page: 1,
        limit: 6,
      });
      const photoIds = response.data.map((p) => p.id);
      const urls = await photoApi.getPhotoUrlsBatch(photoIds, 'thumb');
      setPhotoUrls(urls);
      return response;
    },
  });

  const { data: datesResponse, isLoading: datesLoading } = useQuery({
    queryKey: ['importantDates', selectedChildId],
    queryFn: () => timelineApi.getImportantDates({ childId: selectedChildId }),
  });

  const { data: albumsResponse, isLoading: albumsLoading } = useQuery({
    queryKey: ['albums', selectedChildId],
    queryFn: () =>
      albumApi.getAlbums({
        childId: selectedChildId,
        page: 1,
        limit: 10,
      }),
  });

  const photos = photosResponse?.data || [];
  const importantDates = datesResponse?.data || [];

  const stats = useMemo(() => {
    const upcomingDates = importantDates.filter(
      (d) => d.daysUntilNext !== undefined && d.daysUntilNext >= 0
    );
    return {
      totalPhotos: photosResponse?.meta?.total || photosResponse?.total || 0,
      totalAlbums: albumsResponse?.meta?.total || albumsResponse?.total || 0,
      totalImportantDates: importantDates.length,
      upcomingThisWeek: upcomingDates.filter(
        (d) => d.daysUntilNext !== undefined && d.daysUntilNext <= 7
      ).length,
    };
  }, [photosResponse, albumsResponse, importantDates]);

  const upcomingDates = useMemo(() => {
    return importantDates
      .filter((d) => d.daysUntilNext !== undefined && d.daysUntilNext >= 0)
      .sort((a, b) => (a.daysUntilNext || 0) - (b.daysUntilNext || 0))
      .slice(0, 5);
  }, [importantDates]);

  const getDateTypeInfo = (type: string) => {
    const types: Record<string, { icon: string; color: string }> = {
      birthday: { icon: '🎂', color: 'bg-pink-100 text-pink-700' },
      holiday: { icon: '🎉', color: 'bg-red-100 text-red-700' },
      milestone: { icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
      medical: { icon: '💊', color: 'bg-blue-100 text-blue-700' },
      school: { icon: '📚', color: 'bg-purple-100 text-purple-700' },
      other: { icon: '📅', color: 'bg-gray-100 text-gray-700' },
    };
    return types[type] || types.other;
  };

  const formatDaysUntil = (days: number): string => {
    if (days === 0) return '今天 🎉';
    if (days === 1) return '明天';
    if (days < 7) return `还有 ${days} 天`;
    if (days < 30) return `还有 ${Math.floor(days / 7)} 周`;
    return `还有 ${Math.floor(days / 30)} 个月`;
  };

  const isLoading = photosLoading || datesLoading || albumsLoading;
  if (isLoading) return <Loading />;

  // 找到第一个孩子用于展示年龄
  const primaryChild = children && children.length > 0 ? children[0] : null;

  return (
    <div className="animate-fade-in space-y-8">
      {/* 宝宝年龄横幅 */}
      {primaryChild && primaryChild.birthDate && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)',
            boxShadow: '0 4px 20px rgba(255, 107, 157, 0.12)',
          }}
        >
          <div className="text-5xl animate-heartbeat">👶</div>
          <div className="flex-1">
            <p className="text-sm text-pink-500 font-medium mb-0.5">宝宝今天</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {primaryChild.name}
              <span className="text-pink-500 mx-2">·</span>
              {calcBabyAge(primaryChild.birthDate)}
            </h2>
          </div>
          {children.length > 1 && (
            <select
              className="text-sm border border-pink-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value || undefined)}
            >
              <option value="">全部宝宝</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 统计卡片 */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">📊 成长概览</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="📷"
            label="全部照片"
            value={stats.totalPhotos}
            gradient="from-pink-50 to-rose-50"
            border="border-pink-200"
            iconBg="bg-pink-100"
            onClick={() => navigate('/photos')}
          />
          <StatCard
            icon="📁"
            label="相册数量"
            value={stats.totalAlbums}
            gradient="from-orange-50 to-amber-50"
            border="border-orange-200"
            iconBg="bg-orange-100"
            onClick={() => navigate('/albums')}
          />
          <StatCard
            icon="📅"
            label="重要日期"
            value={stats.totalImportantDates}
            gradient="from-purple-50 to-violet-50"
            border="border-purple-200"
            iconBg="bg-purple-100"
            onClick={() => navigate('/important-dates')}
          />
          <StatCard
            icon="⏰"
            label="本周提醒"
            value={stats.upcomingThisWeek}
            gradient={stats.upcomingThisWeek > 0 ? 'from-red-50 to-orange-50' : 'from-gray-50 to-slate-50'}
            border={stats.upcomingThisWeek > 0 ? 'border-red-200' : 'border-gray-200'}
            iconBg={stats.upcomingThisWeek > 0 ? 'bg-red-100' : 'bg-gray-100'}
            onClick={() => navigate('/important-dates')}
          />
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">⚡ 快速操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '📷', label: '上传照片', path: '/photos', color: 'from-pink-100 to-rose-100', border: 'border-pink-200' },
            { icon: '📁', label: '创建相册', path: '/albums', color: 'from-orange-100 to-amber-100', border: 'border-orange-200' },
            { icon: '📅', label: '添加日期', path: '/important-dates', color: 'from-purple-100 to-violet-100', border: 'border-purple-200' },
            { icon: '📖', label: '成长时间线', path: '/timeline', color: 'from-teal-100 to-cyan-100', border: 'border-teal-200' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                action.color,
                action.border
              )}
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-semibold text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 最近照片 + 即将到来 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-3">🌸 最近照片</h2>
          {photos.length === 0 ? (
            <EmptyState
              icon="📷"
              title="还没有照片"
              description="上传第一张宝宝照片，开始记录成长时光"
              action={{ label: '去上传', onClick: () => navigate('/photos') }}
            />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/photos/${photo.id}`)}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-pink-50">
                    {photoUrls.get(photo.id) ? (
                      <img
                        src={photoUrls.get(photo.id)}
                        alt={photo.id}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-orange-100 animate-pulse" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-3">🗓️ 即将到来</h2>
          {upcomingDates.length === 0 ? (
            <EmptyState
              icon="📅"
              title="暂无近期日期"
              description="添加宝宝的生日、节日等重要日期"
              action={{ label: '去添加', onClick: () => navigate('/important-dates') }}
            />
          ) : (
            <div className="space-y-3">
              {upcomingDates.map((date) => {
                const typeInfo = getDateTypeInfo(date.dateType);
                return (
                  <div
                    key={date.id}
                    className="p-4 rounded-xl border-2 border-pink-100 bg-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    style={{ boxShadow: '0 2px 8px rgba(255,107,157,0.08)' }}
                    onClick={() => navigate('/important-dates')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('text-2xl w-10 h-10 flex items-center justify-center rounded-xl', typeInfo.color)}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{date.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {date.nextDate ? (
                            <>
                              <span className="font-medium text-pink-500">{formatDaysUntil(date.daysUntilNext || 0)}</span>
                              <span className="text-gray-400 ml-1">
                                （{new Date(date.nextDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}）
                              </span>
                            </>
                          ) : (
                            <span>
                              {new Date(date.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 无孩子时的欢迎引导 */}
      {(!children || children.length === 0) && (
        <div
          className="p-8 rounded-2xl text-center"
          style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)', boxShadow: '0 4px 20px rgba(255,107,157,0.12)' }}
        >
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">欢迎来到宝宝成长相册！</h3>
          <p className="text-gray-500 mb-5">先添加宝宝的档案，开启记录成长的旅程 ✨</p>
          <Button onClick={() => navigate('/children')}>
            <span className="mr-2">👶</span>添加宝宝档案
          </Button>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  gradient: string;
  border: string;
  iconBg: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, gradient, border, iconBg, onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl border-2 bg-gradient-to-br transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
        gradient,
        border
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0', iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800 leading-tight">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}
