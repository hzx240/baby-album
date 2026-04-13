import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { albumApi } from '@/api/album';
import { photoApi } from '@/api/photo';
import VirtualPhotoGrid from '@/components/VirtualPhotoGrid';
import PhotoViewer from '@/components/PhotoViewer';
import { Button, Card, Modal, Input, Badge, SmartRuleBuilder } from '@/components/ui';
import { Loading, EmptyState } from '@/components/ui';
import type { Album, Photo, SmartRule } from '@/types';

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [editingSmartRules, setEditingSmartRules] = useState<SmartRule[]>([]);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<
    Array<{ id: string; url: string; uploadedAt: string }>
  >([]);
  const [columnCount, setColumnCount] = useState(4);

  // Responsive column count
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
    if (!albumId) return;
    loadAlbum();
  }, [albumId]);

  const loadAlbum = async () => {
    if (!albumId) return;

    setLoading(true);
    setError(null);
    try {
      const [albumData, photosData] = await Promise.all([
        albumApi.getAlbum(albumId),
        albumApi.getPhotos(albumId, 1, 100),
      ]);

      setAlbum(albumData);
      setPhotos(photosData.data);

      // Batch load photo URLs
      const photoIds = photosData.data.map((p) => p.id);
      const thumbUrls = await photoApi.getPhotoUrlsBatch(photoIds, 'thumb');
      const originalUrls = await photoApi.getPhotoUrlsBatch(
        photoIds,
        'original'
      );

      const viewerData = photosData.data.map((photo) => ({
        id: photo.id,
        url: originalUrls.get(photo.id) || '',
        uploadedAt: photo.uploadedAt,
      }));

      setPhotoUrls(thumbUrls);
      setViewerPhotos(viewerData);

      setAlbumName(albumData.name);
      setAlbumDescription(albumData.description || '');
      // Parse smartRules if it's a string
      const parsedRules = typeof albumData.smartRules === 'string'
        ? JSON.parse(albumData.smartRules || '[]')
        : albumData.smartRules || [];
      setEditingSmartRules(parsedRules);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载相册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSmartAlbum = async () => {
    if (!albumId || !album?.isSmart) return;

    setRefreshing(true);
    setError(null);
    try {
      const result = await albumApi.refreshSmartAlbum(albumId);
      await loadAlbum();
      setToast(`刷新成功：添加 ${result.added} 张，移除 ${result.removed} 张，共 ${result.total} 张`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || '刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveAlbum = async () => {
    if (!albumId || !albumName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await albumApi.updateAlbum(albumId, {
        name: albumName,
        description: albumDescription || undefined,
      });
      setShowEditModal(false);
      await loadAlbum();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!albumId) return;
    if (!confirm('确定要删除这个相册吗？照片不会被删除。')) return;

    try {
      await albumApi.deleteAlbum(albumId);
      navigate('/albums');
    } catch (err: any) {
      setError(err.response?.data?.message || '删除相册失败');
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!albumId) return;
    if (!confirm('确定要从相册中移除这张照片吗？')) return;

    try {
      await albumApi.removePhotos(albumId, { photoIds: [photoId] });
      setPhotos(photos.filter((p) => p.id !== photoId));
      setPhotoUrls((prev) => {
        const newUrls = new Map(prev);
        newUrls.delete(photoId);
        return newUrls;
      });
      setViewerPhotos((prev) => prev.filter((p) => p.id !== photoId));

      // Update album photo count
      if (album) {
        setAlbum({ ...album, photoCount: album.photoCount - 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '移除照片失败');
    }
  };

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleViewerDelete = async (photoId: string) => {
    await handleRemovePhoto(photoId);
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !album) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <div className="text-7xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            相册加载失败
          </h2>
          <p className="text-gray-700 mb-6">{error || '相册不存在'}</p>
          <Button onClick={() => navigate('/albums')}>返回相册列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/albums')}
            className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
          >
            <span>←</span>
            <span>返回相册列表</span>
          </button>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {album.name}
              </h1>
              {album.isSmart && (
                <Badge variant="secondary" className="bg-purple-500 text-white">
                  智能相册
                </Badge>
              )}
            </div>
            {album.description && (
              <p className="text-gray-600">{album.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="primary">{album.photoCount} 张照片</Badge>
              <span className="text-sm text-gray-500">
                创建于{' '}
                {new Date(album.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {album.isSmart && album.smartRules && album.smartRules.length > 0 && (
                <span className="text-sm text-purple-600">
                  {album.smartRules.length} 条智能规则
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {album.isSmart && (
              <Button
                variant="outline"
                onClick={handleRefreshSmartAlbum}
                disabled={refreshing}
              >
                {refreshing ? '刷新中...' : '刷新相册'}
              </Button>
            )}
            {album.isSmart && (
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    const parsedRules = typeof album.smartRules === 'string'
                      ? JSON.parse(album.smartRules || '[]')
                      : album.smartRules || [];
                    setEditingSmartRules(parsedRules);
                  } catch {
                    setEditingSmartRules([]);
                  }
                  setShowRulesModal(true);
                }}
              >
                编辑规则
              </Button>
            )}
            {!album.isSmart && (
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                编辑
              </Button>
            )}
            <Button
              variant="danger"
              onClick={handleDeleteAlbum}
            >
              删除相册
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <EmptyState
          icon={album.isSmart ? '🔮' : '📸'}
          title={album.isSmart ? '智能相册暂无匹配照片' : '相册还没有照片'}
          description={album.isSmart ? '尝试刷新相册或调整智能规则' : '点击下方按钮添加照片到相册'}
          action={album.isSmart ? {
            label: '刷新相册',
            onClick: handleRefreshSmartAlbum,
          } : {
            label: '添加照片',
            onClick: () => setShowAddPhotosModal(true),
          }}
        />
      ) : (
        <div className="animate-slide-up">
          <VirtualPhotoGrid
            photos={photos}
            photoUrls={photoUrls}
            columnCount={columnCount}
            rowHeight={350}
            onPhotoClick={handleOpenViewer}
            onPhotoDelete={handleRemovePhoto}
          />
        </div>
      )}

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

      {/* Edit Album Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑相册"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSaveAlbum} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="相册名称"
            placeholder="输入相册名称"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            maxLength={100}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可选）
            </label>
            <textarea
              placeholder="输入相册描述"
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </Modal>

      {/* Add Photos Modal - Placeholder */}
      <Modal
        isOpen={showAddPhotosModal}
        onClose={() => setShowAddPhotosModal(false)}
        title="添加照片"
        size="lg"
        footer={
          <Button onClick={() => setShowAddPhotosModal(false)}>关闭</Button>
        }
      >
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            照片选择器功能正在开发中...
          </p>
          <p className="text-sm text-gray-500">
            您可以从照片列表中选择照片添加到相册
          </p>
        </div>
      </Modal>

      {/* Smart Rules Edit Modal */}
      <Modal
        isOpen={showRulesModal}
        onClose={() => {
          setShowRulesModal(false);
          setRulesError(null);
        }}
        title="编辑智能规则"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowRulesModal(false);
                setRulesError(null);
                try {
                  const parsedRules = typeof album?.smartRules === 'string'
                    ? JSON.parse(album.smartRules || '[]')
                    : album?.smartRules || [];
                  setEditingSmartRules(parsedRules);
                } catch {
                  setEditingSmartRules([]);
                }
              }}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!albumId) return;
                setSaving(true);
                setRulesError(null);
                try {
                  await albumApi.updateAlbum(albumId, {
                    smartRules: editingSmartRules,
                  });
                  setShowRulesModal(false);
                  await loadAlbum();
                } catch (err: any) {
                  setRulesError(err.response?.data?.message || '保存规则失败');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || editingSmartRules.length === 0}
            >
              {saving ? '保存中...' : '保存规则'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            修改规则后，点击"刷新相册"按钮即可应用新规则
          </p>
          <SmartRuleBuilder
            initialRules={editingSmartRules}
            onRulesChange={setEditingSmartRules}
            error={rulesError || undefined}
          />
        </div>
      </Modal>
    </div>
  );
}
