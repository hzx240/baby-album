import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { albumApi } from '@/api/album';
import { photoApi } from '@/api/photo';
import { Modal, Input, SmartRuleBuilder } from '@/components/ui';
import { Loading } from '@/components/ui';
import type { Album, SmartRule } from '@/types';

export default function AlbumsListPage() {
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [isSmartAlbum, setIsSmartAlbum] = useState(false);
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [coverUrls, setCoverUrls] = useState<Map<string, string>>(new Map());
  const [filterType, setFilterType] = useState<'all' | 'smart' | 'standard'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'size' | 'alpha'>('newest');

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await albumApi.getAlbums({
        page: 1,
        limit: 50,
      });
      setAlbums(response.data);

      const coverPromises = response.data
        .filter((album) => album.coverPhotoId)
        .map(async (album) => {
          if (album.coverPhotoId) {
            const urlData = await photoApi.getPhotoUrl(
              album.coverPhotoId,
              'thumb'
            );
            return { albumId: album.id, url: urlData.url };
          }
          return null;
        });

      const urls = await Promise.all(coverPromises);
      const urlMap = new Map<string, string>();
      urls.forEach((item) => {
        if (item) {
          urlMap.set(item.albumId, item.url);
        }
      });
      setCoverUrls(urlMap);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载相册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim()) {
      setError('请输入相册名称');
      return;
    }

    if (isSmartAlbum && smartRules.length === 0) {
      setRulesError('智能相册至少需要一条规则');
      return;
    }

    setCreating(true);
    setError(null);
    setRulesError(null);
    try {
      await albumApi.createAlbum({
        name: albumName,
        description: albumDescription || undefined,
        isSmart: isSmartAlbum,
        smartRules: isSmartAlbum ? smartRules : undefined,
      });
      setShowCreateModal(false);
      resetCreateForm();
      await loadAlbums();
    } catch (err: any) {
      setError(err.response?.data?.message || '创建相册失败');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setAlbumName('');
    setAlbumDescription('');
    setIsSmartAlbum(false);
    setSmartRules([]);
    setRulesError(null);
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('确定要删除这个相册吗？照片不会被删除。')) return;

    try {
      await albumApi.deleteAlbum(albumId);
      setAlbums(albums.filter((a) => a.id !== albumId));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除相册失败');
    }
  };

  const filteredAlbums = albums
    .filter(album => {
      if (filterType === 'smart') return album.isSmart;
      if (filterType === 'standard') return !album.isSmart;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'zh-CN');
      if (sortBy === 'size') return (b.photoCount || 0) - (a.photoCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-12">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <section className="flex flex-wrap items-center justify-between gap-6 animate-slide-up">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {([
            { key: 'all', label: '所有相册' },
            { key: 'standard', label: '标准相册' },
            { key: 'smart', label: '智能相册' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filterType === key
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-stone-500">
          <span className="text-xs font-spaceGrotesk uppercase tracking-tighter font-bold">排序方式:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-transparent border-none text-sm font-bold text-on-surface focus:ring-0 cursor-pointer"
          >
            <option value="newest">最新</option>
            <option value="size">相册大小</option>
            <option value="alpha">按字母</option>
          </select>
        </div>
      </section>

      {/* Bento Grid of Albums */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {filteredAlbums.map((album) => (
          <div
            key={album.id}
            onClick={() => navigate(`/albums/${album.id}`)}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-outline-variant/10"
          >
            {album.coverPhotoId && coverUrls.get(album.coverPhotoId) ? (
              <img
                src={coverUrls.get(album.coverPhotoId)}
                alt={album.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center ${album.isSmart ? 'bg-gradient-to-br from-purple-100 to-blue-100' : 'bg-surface-container-low'}`}>
                <span className="text-6xl mb-2">{album.isSmart ? '🔮' : '📁'}</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-transparent"></div>
            
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20`}>
                {album.isSmart ? '智能相册' : '标准相册'}
              </span>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-headline font-bold mb-1 truncate">{album.name}</h3>
                  <p className="font-spaceGrotesk text-xs opacity-80">{album.photoCount} 张照片 • {new Date(album.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAlbum(album.id);
                  }}
                  className="text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Album Placeholder */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="aspect-[4/5] rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-4 group hover:border-primary/50 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-3xl text-stone-400 group-hover:text-on-primary-container">create_new_folder</span>
          </div>
          <span className="font-headline font-bold text-stone-500 group-hover:text-primary">新建相册</span>
        </button>
      </section>

      {/* Insights / Data Section */}
      <section className="mt-20 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h2 className="font-headline text-3xl font-bold mb-8 text-rose-900">档案洞察</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-tertiary text-4xl mb-4">face_6</span>
            <h4 className="font-spaceGrotesk text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">识别出的人物</h4>
            <p className="text-3xl font-headline font-bold">已识别 12 人</p>
            <div className="mt-4 flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-surface shadow-sm bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full border-2 border-surface shadow-sm bg-gray-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-surface shadow-sm bg-gray-400"></div>
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold border-2 border-surface">+9</div>
            </div>
          </div>
          
          <div className="p-8 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-secondary text-4xl mb-4">location_on</span>
            <h4 className="font-spaceGrotesk text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">主要地点</h4>
            <p className="text-3xl font-headline font-bold">4 个城市</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-stone-600">London (242), Brighton (89), Oxford (42)</p>
            </div>
          </div>
          
          <div className="p-8 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-primary text-4xl mb-4">auto_fix_high</span>
            <h4 className="font-spaceGrotesk text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">AI 建议</h4>
            <p className="text-3xl font-headline font-bold">5 种新排版</p>
            <button onClick={() => { setIsSmartAlbum(true); setShowCreateModal(true); }} className="mt-4 text-sm font-bold text-primary underline decoration-primary/20 underline-offset-4">试试智能排版</button>
          </div>
        </div>
      </section>

      {/* Create Album Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="创建相册"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              disabled={creating}
              className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors"
            >
              取消
            </button>
            <button onClick={handleCreateAlbum} disabled={creating} className="btn-primary ml-2">
              {creating ? '创建中...' : '创建相册'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">相册类型</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsSmartAlbum(false)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  !isSmartAlbum ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">📁</div>
                <div className="font-bold font-headline">标准相册</div>
                <div className="text-xs text-gray-500 mt-1">手动将照片添加到您的相册中</div>
              </button>
              <button
                type="button"
                onClick={() => setIsSmartAlbum(true)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  isSmartAlbum ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🔮</div>
                <div className="font-bold font-headline">智能相册</div>
                <div className="text-xs text-gray-500 mt-1">根据您的规则自动整理</div>
              </button>
            </div>
          </div>

          <Input
            label="相册名称"
            placeholder={isSmartAlbum ? '例如：成长记录' : '输入相册名称'}
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            maxLength={100}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述（可选）</label>
            <textarea
              placeholder="输入相册描述"
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200 text-on-surface resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          {isSmartAlbum && (
            <div className="pt-4 border-t border-gray-200">
              <SmartRuleBuilder
                initialRules={smartRules}
                onRulesChange={setSmartRules}
                error={rulesError || undefined}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}