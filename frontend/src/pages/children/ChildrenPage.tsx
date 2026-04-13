import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChildStore } from '@/stores/child.store';
import { timelineApi } from '@/api/timeline';
import { EmptyState, Loading, ErrorAlert, Modal, Input, Button } from '@/components/ui';
import type { Milestone } from '@/types';

export default function ChildrenPage() {
  const navigate = useNavigate();
  const { children, fetchChildren, isLoading, error, clearError, createChild, updateChild, deleteChild } = useChildStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthDate, setNewChildBirthDate] = useState('');
  const [newChildGender, setNewChildGender] = useState<'male' | 'female' | 'other'>('other');
  
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('other');

  useEffect(() => {
    fetchChildren().catch((err) => {
      console.error('Failed to fetch children:', err);
    });
  }, [fetchChildren]);

  const childrenArray = Array.isArray(children) ? children : [];
  const selectedChild = childrenArray[selectedChildIndex];

  useEffect(() => {
    if (selectedChild) {
      timelineApi.getMilestones({ childId: selectedChild.id }).then(res => {
        setMilestones(res.data || []);
      }).catch(console.error);
    }
  }, [selectedChild]);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    try {
      await createChild({ 
        name: newChildName,
        birthDate: newChildBirthDate ? new Date(newChildBirthDate).toISOString() : undefined,
        gender: newChildGender
      });
      setNewChildName('');
      setNewChildBirthDate('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create child:', err);
    }
  };

  const openEditModal = () => {
    if (!selectedChild) return;
    setEditName(selectedChild.name);
    setEditBirthDate(selectedChild.birthDate ? new Date(selectedChild.birthDate).toISOString().split('T')[0] : '');
    setEditGender((selectedChild as any).gender || 'other');
    setShowEditModal(true);
  };

  const handleEditChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !editName.trim()) return;
    try {
      await updateChild(selectedChild.id, {
        name: editName,
        birthDate: editBirthDate ? new Date(editBirthDate).toISOString() : undefined,
        gender: editGender
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update child:', err);
    }
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;
    if (!confirm(`确定要删除 ${selectedChild.name} 的档案吗？此操作无法撤销。`)) return;
    try {
      await deleteChild(selectedChild.id);
      setSelectedChildIndex(0);
    } catch (err) {
      console.error('Failed to delete child:', err);
    }
  };

  const calculateAgeString = (birthDate?: string | null) => {
    if (!birthDate) return '未知年龄';
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    return `${months} 个月大`;
  };

  const calculateDaysAlive = (birthDate?: string | null) => {
    if (!birthDate) return 0;
    const diff = new Date().getTime() - new Date(birthDate).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {childrenArray.length === 0 ? (
        <EmptyState
          icon="👶"
          title="暂无宝贝档案"
          description="点击下方按钮添加您的第一个宝贝档案。"
          action={{
            label: '添加宝贝档案',
            onClick: () => setShowCreateModal(true)
          }}
        />
      ) : (
        <>
          {childrenArray.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {childrenArray.map((child, idx) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                    idx === selectedChildIndex 
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {child.name}
                </button>
              ))}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                + 添加
              </button>
            </div>
          )}

          {/* Hero Section */}
          <section className="grid grid-cols-12 gap-8 items-end animate-slide-up">
            <div className="col-span-12 md:col-span-5 relative">
              <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative z-10 bg-surface-container-high flex items-center justify-center">
                {selectedChild?.avatar ? (
                  <img className="w-full h-full object-cover" src={selectedChild.avatar} alt={selectedChild.name} />
                ) : (
                  <span className="text-9xl">{selectedChild?.name?.[0]?.toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="col-span-12 md:col-span-7 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-spaceGrotesk text-xs font-bold uppercase tracking-[0.2em] text-secondary bg-secondary-container/30 px-3 py-1 rounded-full">
                    当前档案
                  </span>
                  <div className="flex gap-2">
                    <button onClick={openEditModal} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-stone-500" title="编辑档案">
                      <span className="material-symbols-outlined text-lg">edit_note</span>
                    </button>
                    <button onClick={handleDeleteChild} className="p-2 hover:bg-red-50 rounded-full transition-colors text-stone-400 hover:text-red-500" title="删除档案">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
                
                <h2 className="text-7xl font-headline font-bold text-on-surface tracking-tight truncate">
                  {selectedChild?.name || '未命名'}
                </h2>
                
                <div className="flex items-baseline gap-6">
                  <p className="font-headline text-3xl italic text-primary">
                    {calculateAgeString(selectedChild?.birthDate)}
                  </p>
                  {selectedChild?.birthDate && (
                    <div className="flex flex-col">
                      <span className="font-spaceGrotesk text-[10px] uppercase tracking-widest text-stone-400">生日</span>
                      <span className="font-spaceGrotesk font-bold text-stone-700">
                        {new Date(selectedChild.birthDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-8 flex gap-4">
                  <button onClick={openEditModal} className="bg-gradient-to-r from-primary to-primary-container px-8 py-3 rounded-full text-white font-spaceGrotesk font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    编辑档案
                  </button>
                  <button onClick={() => navigate('/growth')} className="bg-surface-container-high px-8 py-3 rounded-full text-on-surface font-spaceGrotesk font-bold text-sm hover:bg-surface-variant transition-colors">
                    成长记录
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Growth Metrics */}
          <section className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-between items-end">
              <h3 className="font-headline text-3xl font-light">生长分析</h3>
              <span className="font-spaceGrotesk text-[10px] font-bold text-stone-400 uppercase tracking-widest">模拟数据</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weight Card */}
              <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/5">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="font-spaceGrotesk text-[10px] uppercase font-bold text-stone-400 tracking-widest">当前体重</p>
                    <h4 className="font-headline text-4xl font-bold text-secondary">10.2 <span className="text-lg font-light text-stone-400">kg</span></h4>
                  </div>
                  <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-1 rounded-sm">比上个月 +0.4kg</span>
                </div>
                <div className="h-40 flex items-end gap-2 px-2">
                  <div className="flex-1 bg-secondary/5 rounded-t-lg h-[40%] transition-all hover:bg-secondary/20"></div>
                  <div className="flex-1 bg-secondary/5 rounded-t-lg h-[45%] transition-all hover:bg-secondary/20"></div>
                  <div className="flex-1 bg-secondary/5 rounded-t-lg h-[55%] transition-all hover:bg-secondary/20"></div>
                  <div className="flex-1 bg-secondary/10 rounded-t-lg h-[65%] transition-all hover:bg-secondary/30"></div>
                  <div className="flex-1 bg-secondary/15 rounded-t-lg h-[75%] transition-all hover:bg-secondary/40"></div>
                  <div className="flex-1 bg-secondary/20 rounded-t-lg h-[85%] transition-all hover:bg-secondary/50"></div>
                  <div className="flex-1 bg-secondary/30 rounded-t-lg h-[100%] transition-all hover:bg-secondary/60"></div>
                </div>
              </div>
              
              {/* Height Card */}
              <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-outline-variant/5">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="font-spaceGrotesk text-[10px] uppercase font-bold text-stone-400 tracking-widest">当前身高</p>
                    <h4 className="font-headline text-4xl font-bold text-tertiary">78.5 <span className="text-lg font-light text-stone-400">cm</span></h4>
                  </div>
                  <span className="bg-tertiary-container/30 text-on-tertiary-container text-[10px] font-bold px-2 py-1 rounded-sm">第 92 百分位</span>
                </div>
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path className="text-tertiary" d="M0,40 Q20,35 40,30 T80,15 T100,5" fill="none" stroke="currentColor" strokeWidth="2"></path>
                    <circle className="text-tertiary fill-current" cx="100" cy="5" r="3"></circle>
                    <circle className="text-tertiary/20 fill-current" cx="100" cy="5" r="6"></circle>
                  </svg>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-stone-100"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Milestone Board */}
          <section className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center">
              <h3 className="font-headline text-3xl font-light">里程碑面板</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {milestones.length > 0 ? (
                <>
                  {/* Primary Milestone */}
                  <div className="md:col-span-2 relative group overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm p-8 min-h-[300px] flex flex-col justify-end border border-outline-variant/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                    <div className="relative z-10">
                      <span className="font-spaceGrotesk text-[10px] font-bold text-primary-fixed bg-primary-dim/10 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-4 block">最近的回忆</span>
                      <h4 className="font-headline text-4xl font-bold text-on-surface mb-2">{milestones[0].title}</h4>
                      <p className="text-on-surface-variant font-spaceGrotesk text-sm mb-4">
                        {new Date(milestones[0].eventDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {milestones[0].description && (
                        <p className="text-stone-500 text-sm max-w-lg">{milestones[0].description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Secondary Milestones Stack */}
                  <div className="space-y-6">
                    {milestones.slice(1, 4).map(m => (
                      <div key={m.id} className="bg-surface-container-low p-6 rounded-xl flex items-center gap-6 group hover:bg-surface-container-high transition-colors">
                        <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-3xl shrink-0">
                          ⭐
                        </div>
                        <div>
                          <h5 className="font-headline font-bold text-lg text-on-surface">{m.title}</h5>
                          <p className="font-spaceGrotesk text-xs text-stone-500 mb-1">
                            {new Date(m.eventDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {milestones.length <= 1 && (
                       <div onClick={() => navigate('/timeline')} className="border-2 border-dashed border-outline-variant/30 p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/40 cursor-pointer group transition-all h-full min-h-[200px]">
                         <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors text-3xl">add_circle</span>
                         <p className="font-spaceGrotesk text-[10px] font-bold uppercase text-stone-400 tracking-widest group-hover:text-primary">记录成就</p>
                       </div>
                    )}
                  </div>
                </>
              ) : (
                <div onClick={() => navigate('/timeline')} className="col-span-3 border-2 border-dashed border-outline-variant/30 p-12 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/40 cursor-pointer group transition-all">
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-primary transition-colors text-4xl">add_circle</span>
                  <p className="font-spaceGrotesk text-xs font-bold uppercase text-stone-400 tracking-widest group-hover:text-primary">记录首个成就</p>
                </div>
              )}
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="bg-surface-container-lowest p-6 rounded-lg text-center border border-outline-variant/10">
              <p className="font-spaceGrotesk text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">总回忆数</p>
              <p className="font-headline text-3xl font-bold">142</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg text-center border border-outline-variant/10">
              <p className="font-spaceGrotesk text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">成长天数</p>
              <p className="font-headline text-3xl font-bold">{calculateDaysAlive(selectedChild?.birthDate)}</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg text-center border border-outline-variant/10">
              <p className="font-spaceGrotesk text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">里程碑数</p>
              <p className="font-headline text-3xl font-bold text-secondary">{milestones.length}</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg text-center border border-outline-variant/10">
              <p className="font-spaceGrotesk text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">活跃家庭成员</p>
              <p className="font-headline text-3xl font-bold text-primary">3 位成员</p>
            </div>
          </section>
        </>
      )}

      {/* Create Child Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="添加宝贝档案"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewChildName('');
                setNewChildBirthDate('');
                setNewChildGender('other');
              }}
              className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors"
            >
              取消
            </button>
            <button onClick={handleCreateChild} className="btn-primary ml-2">
              创建档案
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateChild} className="space-y-4">
          <Input
            label="姓名 *"
            type="text"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="输入宝贝姓名"
            required
            autoFocus
          />
          <Input
            label="出生日期"
            type="date"
            value={newChildBirthDate}
            onChange={(e) => setNewChildBirthDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <select
              value={newChildGender}
              onChange={(e) => setNewChildGender(e.target.value as any)}
              className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200 text-on-surface"
            >
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他/未指定</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑宝贝档案"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors"
            >
              取消
            </button>
            <button onClick={handleEditChild} className="btn-primary ml-2">
              保存修改
            </button>
          </>
        }
      >
        <form onSubmit={handleEditChild} className="space-y-4">
          <Input
            label="姓名 *"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="输入宝贝姓名"
            required
            autoFocus
          />
          <Input
            label="出生日期"
            type="date"
            value={editBirthDate}
            onChange={(e) => setEditBirthDate(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <select
              value={editGender}
              onChange={(e) => setEditGender(e.target.value as any)}
              className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200 text-on-surface"
            >
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他/未指定</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}