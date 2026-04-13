import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { timelineApi } from '@/api/timeline';
import { photoApi } from '@/api/photo';
import { useChildStore } from '@/stores/child.store';
import VirtualPhotoGrid from '@/components/VirtualPhotoGrid';
import PhotoViewer from '@/components/PhotoViewer';
import { Modal, Input, Select } from '@/components/ui';
import { Loading, EmptyState } from '@/components/ui';
import type { TimelineMonth, Photo, Milestone } from '@/types';

export default function TimelinePage() {
  const navigate = useNavigate();
  const { children } = useChildStore();

  const [timelineData, setTimelineData] = useState<TimelineMonth[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(
    undefined
  );

  // Photo viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<
    Array<{ id: string; url: string; uploadedAt: string }>
  >([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());

  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneType, setMilestoneType] = useState<'birthday' | 'first-step' | 'first-word' | 'custom'>('custom');
  const [savingMilestone, setSavingMilestone] = useState(false);

  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const getColumnCount = () => {
      const width = window.innerWidth;
      if (width < 640) return 2;
      if (width < 768) return 3;
      if (width < 1024) return 4;
      return 5;
    };

    setColumnCount(getColumnCount());
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadTimeline();
    loadMilestones();
  }, [selectedChildId]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timelineApi.getTimeline({
        childId: selectedChildId,
      });

      setTimelineData(response.months || []);

      const allPhotosList: Photo[] = [];
      (response.months || []).forEach((month) => {
        allPhotosList.push(...month.photos);
      });
      setAllPhotos(allPhotosList);

      const photoIds = allPhotosList.map((p) => p.id);
      const thumbUrls = await photoApi.getPhotoUrlsBatch(photoIds, 'thumb');
      const originalUrls = await photoApi.getPhotoUrlsBatch(
        photoIds,
        'original'
      );

      const viewerData = allPhotosList.map((photo) => ({
        id: photo.id,
        url: originalUrls.get(photo.id) || '',
        uploadedAt: photo.uploadedAt,
      }));

      setPhotoUrls(thumbUrls);
      setViewerPhotos(viewerData);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载时间线失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await timelineApi.getMilestones({
        childId: selectedChildId,
      });
      setMilestones(response.data || []);
    } catch (err: any) {
      console.error('Failed to load milestones:', err);
    }
  };

  const handleCreateMilestone = async () => {
    if (!milestoneTitle.trim() || !milestoneDate) {
      setError('请填写里程碑标题和日期');
      return;
    }

    setSavingMilestone(true);
    setError(null);
    try {
      await timelineApi.createMilestone({
        title: milestoneTitle,
        description: milestoneDescription || undefined,
        eventDate: milestoneDate,
        eventType: milestoneType,
        childId: selectedChildId,
      });

      setShowMilestoneModal(false);
      setMilestoneTitle('');
      setMilestoneDescription('');
      setMilestoneDate('');
      setMilestoneType('custom');

      await loadMilestones();
    } catch (err: any) {
      setError(err.response?.data?.message || '创建里程碑失败');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('确定要删除这个里程碑吗？')) return;

    try {
      await timelineApi.deleteMilestone(milestoneId);
      setMilestones(milestones.filter((m) => m.id !== milestoneId));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除里程碑失败');
    }
  };

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleViewerDelete = async (photoId: string) => {
    try {
      await photoApi.deletePhoto(photoId);
      setAllPhotos(prev => prev.filter(p => p.id !== photoId));
      setViewerPhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoUrls(prev => {
        const next = new Map(prev);
        next.delete(photoId);
        return next;
      });
      await loadTimeline();
    } catch (err: any) {
      setError(err.response?.data?.message || '删除照片失败');
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await photoApi.deletePhoto(photoId);
      setAllPhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoUrls(prev => {
        const next = new Map(prev);
        next.delete(photoId);
        return next;
      });
      setViewerPhotos(prev => prev.filter(p => p.id !== photoId));
      await loadTimeline();
    } catch (err: any) {
      setError(err.response?.data?.message || '删除照片失败');
    }
  };

  const milestonesMap = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    milestones.forEach((m) => {
      const date = new Date(m.eventDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(m);
    });
    return map;
  }, [milestones]);

  const getMilestoneIcon = (type: string): string => {
    const icons: Record<string, string> = {
      birthday: '🎂',
      'first-step': '👣',
      'first-word': '💬',
      custom: '⭐',
    };
    return icons[type] || '⭐';
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="animate-fade-in relative">
      <style>{`
        .timeline-line {
            background: linear-gradient(to bottom, transparent, #9f4043 15%, #006c5d 50%, #295fa7 85%, transparent);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(20px);
        }
      `}</style>
      
      {/* Header & Filters Section */}
      <section className="max-w-5xl mx-auto mb-16 relative animate-slide-up">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="font-body text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-2 block">生命记录</span>
            <h2 className="text-6xl font-headline font-semibold text-on-background italic">时光轴</h2>
          </div>
          
          <div className="flex flex-col gap-4 items-end">
            {(children || []).length > 0 && (
              <select
                className="bg-surface-container-high border-none rounded-lg py-2 px-4 text-xs font-bold text-on-surface focus:ring-2 focus:ring-secondary/20"
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value || undefined)}
              >
                <option value="">所有宝贝</option>
                {(children || []).map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-full overflow-x-auto w-full">
              <button onClick={() => { setSelectedChildId(undefined); }} className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-primary text-on-primary shadow-lg shadow-primary/20 whitespace-nowrap">所有回忆</button>
              <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors whitespace-nowrap" onClick={() => setShowMilestoneModal(true)}>+ 添加里程碑</button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-5xl mx-auto">
          {error}
        </div>
      )}

      {/* Timeline Section */}
      <section className="max-w-5xl mx-auto relative pb-20">
        {timelineData.length === 0 ? (
          <EmptyState
            icon="📅"
            title="时光轴为空"
            description="上传照片或添加里程碑，开始记录美好时刻。"
          />
        ) : (
          <>
            <div className="absolute left-1/2 top-0 bottom-0 w-1.5 -translate-x-1/2 timeline-line opacity-20 hidden md:block"></div>
            <div className="space-y-32">
              {timelineData.map((monthData, index) => {
                const monthKey = `${monthData.year}-${monthData.month}`;
                const monthMilestones = milestonesMap.get(monthKey) || [];
                const isLeft = index % 2 === 0;

                return (
                  <div key={monthKey} className="relative">
                    {/* Month Milestone Cards */}
                    {monthMilestones.map((milestone, mIndex) => {
                      const localIsLeft = (index + mIndex) % 2 === 0;
                      return (
                        <div key={milestone.id} className="relative flex flex-col md:flex-row items-center group mb-24">
                          <div className={`w-full md:w-1/2 md:${localIsLeft ? 'pr-16 text-right' : 'pr-16 md:hidden text-left'} ${!localIsLeft ? 'hidden md:block' : ''}`}>
                            {localIsLeft && (
                              <div className="glass-card p-6 rounded-xl shadow-xl hover:translate-y-[-4px] transition-all duration-500 border border-white/20 text-left md:text-right">
                                <span className="font-body text-[10px] uppercase tracking-widest text-tertiary font-bold">
                                  {new Date(milestone.eventDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                                <h3 className="font-headline text-2xl font-semibold text-rose-900 mt-2 mb-3 italic flex items-center md:justify-end gap-2">
                                  {milestone.title} {getMilestoneIcon(milestone.eventType)}
                                </h3>
                                {milestone.description && (
                                  <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-light">{milestone.description}</p>
                                )}
                                <div className="flex items-center justify-start md:justify-end gap-6 border-t border-primary/5 pt-4">
                                  <button onClick={() => handleDeleteMilestone(milestone.id)} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase">删除</button>
                                </div>
                              </div>
                            )}
                            {!localIsLeft && (
                              <span className="font-headline text-4xl text-secondary-dim italic opacity-20">里程碑</span>
                            )}
                          </div>
                          
                          {/* Marker */}
                          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center z-10">
                            <div className="w-12 h-12 rounded-full glass-card border-4 border-white flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform duration-500">
                              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(159,64,67,0.6)]"></div>
                            </div>
                          </div>

                          <div className={`w-full md:w-1/2 md:${!localIsLeft ? 'pl-16 text-left' : 'pl-16 hidden md:block'}`}>
                            {!localIsLeft && (
                              <div className="glass-card p-6 rounded-xl shadow-xl hover:translate-y-[-4px] transition-all duration-500 border border-white/20 text-left">
                                <span className="font-body text-[10px] uppercase tracking-widest text-secondary font-bold">
                                  {new Date(milestone.eventDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                                <h3 className="font-headline text-2xl font-semibold text-on-secondary-fixed-variant mt-2 mb-3 italic flex items-center gap-2">
                                  {getMilestoneIcon(milestone.eventType)} {milestone.title}
                                </h3>
                                {milestone.description && (
                                  <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-light">{milestone.description}</p>
                                )}
                                <div className="flex items-center justify-start gap-6 border-t border-secondary/5 pt-4">
                                  <button onClick={() => handleDeleteMilestone(milestone.id)} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase">删除</button>
                                </div>
                              </div>
                            )}
                            {localIsLeft && (
                              <span className="font-headline text-4xl text-rose-100 italic opacity-40">里程碑</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Photos Section */}
                    {monthData.photos.length > 0 && (
                      <div className="relative z-20 bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-stone-100 mb-16">
                        <div className="mb-6 border-b border-stone-100 pb-4">
                          <h3 className="font-headline text-2xl text-on-surface">
                            {new Date(monthData.year, monthData.month).toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })}
                          </h3>
                          <span className="text-xs font-bold uppercase tracking-widest text-stone-400 mt-2 block">{monthData.photos.length} 个回忆</span>
                        </div>
                        <VirtualPhotoGrid
                          photos={monthData.photos}
                          photoUrls={photoUrls}
                          columnCount={columnCount}
                          rowHeight={250}
                          onPhotoClick={(idx) => {
                            let globalIndex = 0;
                            for (let i = 0; i < index; i++) {
                              globalIndex += timelineData[i].photos.length;
                            }
                            globalIndex += idx;
                            handleOpenViewer(globalIndex);
                          }}
                          onPhotoDelete={handlePhotoDelete}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Photo Viewer */}
      {viewerOpen && viewerPhotos.length > 0 && (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onDelete={handleViewerDelete}
          onDownload={(photoId, url) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `photo-${photoId}.jpg`;
            link.click();
          }}
        />
      )}

      {/* Create Milestone Modal */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title="添加里程碑"
        footer={
          <>
            <button
              className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors"
              onClick={() => setShowMilestoneModal(false)}
              disabled={savingMilestone}
            >
              取消
            </button>
            <button className="btn-primary ml-2" onClick={handleCreateMilestone} disabled={savingMilestone}>
              {savingMilestone ? '保存中...' : '保存里程碑'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="标题"
            placeholder="例如：第一次走路、生日"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            maxLength={100}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <Select
              options={[
                { value: 'birthday', label: '🎂 生日' },
                { value: 'first-step', label: '👣 第一次走路' },
                { value: 'first-word', label: '💬 第一次说话' },
                { value: 'custom', label: '⭐ 自定义' },
              ]}
              value={milestoneType}
              onChange={(e) => setMilestoneType(e.target.value as typeof milestoneType)}
            />
          </div>
          <Input
            label="日期"
            type="date"
            value={milestoneDate}
            onChange={(e) => setMilestoneDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              placeholder="记录这个特别的瞬间..."
              value={milestoneDescription}
              onChange={(e) => setMilestoneDescription(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200 text-on-surface resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}