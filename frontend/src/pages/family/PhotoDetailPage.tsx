import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { photoApi } from '@/api/photo';
import PhotoViewer from '@/components/PhotoViewer';
import type { Photo } from '@/types';

export default function PhotoDetailPage() {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Array<{ id: string; url: string; uploadedAt: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!photoId) return;
    loadPhoto();
    loadAllPhotos();
  }, [photoId]);

  const loadPhoto = async () => {
    if (!photoId) return;

    setLoading(true);
    setError(null);
    try {
      const [photoData, urlData] = await Promise.all([
        photoApi.getPhoto(photoId),
        photoApi.getPhotoUrl(photoId, 'resized'),
      ]);
      setPhoto(photoData);
      setImageUrl(urlData.url);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载照片失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAllPhotos = async () => {
    try {
      const response = await photoApi.getPhotos({
        page: 1,
        limit: 100,
      });

      const photoList = await Promise.all(
        response.data.map(async (p) => {
          const urlData = await photoApi.getPhotoUrl(p.id, 'resized');
          return {
            id: p.id,
            url: urlData.url,
            uploadedAt: p.uploadedAt,
          };
        })
      );

      setAllPhotos(photoList);
      const index = photoList.findIndex((p) => p.id === photoId);
      setCurrentIndex(index >= 0 ? index : 0);
    } catch (err) {
      console.error('Failed to load all photos:', err);
    }
  };

  const handleDelete = async () => {
    if (!photoId || !confirm('确定要删除这张照片吗？')) return;

    try {
      await photoApi.deletePhoto(photoId);
      navigate('/photos');
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
    }
  };

  const handleViewerDelete = async (deletedPhotoId: string) => {
    await photoApi.deletePhoto(deletedPhotoId);
    const remainingPhotos = allPhotos.filter((p) => p.id !== deletedPhotoId);

    if (remainingPhotos.length === 0) {
      navigate('/photos');
      return;
    }

    // Navigate to next or previous photo
    const newIndex = Math.min(currentIndex, remainingPhotos.length - 1);
    const nextPhoto = remainingPhotos[newIndex];
    navigate(`/photos/${nextPhoto.id}`);

    setAllPhotos(remainingPhotos);
    setCurrentIndex(newIndex);
  };

  const handleViewerDownload = async (downloadPhotoId: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `photo-${downloadPhotoId}.jpg`;
    link.click();
  };

  const handleOpenViewer = () => {
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 animate-fade-in">
        <div className="card text-center py-12 max-w-md w-full">
          <div className="text-7xl mb-6 animate-bounce-soft">📷</div>
          <h2 className="text-xl font-semibold mb-3">加载照片中...</h2>
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 mt-4">请稍候，正在为您加载照片</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 animate-fade-in">
        <div className="card text-center py-12 max-w-md w-full">
          <div className="text-7xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">照片加载失败</h2>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error || '照片不存在'}</p>
          </div>
          <button
            onClick={() => familyId ? navigate(`/families/${familyId}/photos`) : navigate('/photos')}
            className="btn-primary"
          >
            返回照片列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <button
          onClick={() => navigate('/photos')}
          className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
        >
          <span>←</span>
          <span>返回照片列表</span>
        </button>
      </div>

      {/* Photo Card */}
      <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
        {/* Image Container */}
        <div
          onClick={handleOpenViewer}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner mb-6 cursor-pointer group"
        >
          <img
            src={imageUrl}
            alt={photo.uploadedAt}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg transform translate-y-4 group-hover:translate-y-0">
              <span className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <span>🔍</span>
                <span>点击全屏查看</span>
              </span>
            </div>
          </div>
        </div>

        {/* Photo Info */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Metadata */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <span>照片信息</span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span>📤</span>
                  <span>上传时间</span>
                </div>
                <p className="font-semibold text-gray-800">
                  {new Date(photo.uploadedAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {photo.takenAt && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span>📸</span>
                    <span>拍摄时间</span>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {new Date(photo.takenAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {photo.fileSize && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span>💾</span>
                    <span>文件大小</span>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {(photo.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span>🆔</span>
                  <span>照片 ID</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm break-all">
                  {photo.id}
                </p>
              </div>
            </div>

            {/* Tags */}
            {photo.tags.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  <span>标签</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <span>操作</span>
            </h3>

            <button
              onClick={handleDelete}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span className="text-xl">🗑️</span>
              <span>删除照片</span>
            </button>

            <button
              onClick={() => {
                if (imageUrl) {
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = `photo-${photo.id}.jpg`;
                  link.click();
                }
              }}
              className="w-full btn-outline flex items-center justify-center gap-2"
            >
              <span className="text-xl">⬇️</span>
              <span>下载照片</span>
            </button>

            <button
              onClick={handleOpenViewer}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔍</span>
              <span>全屏查看</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 card-gradient animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold mb-3">💡 小贴士</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>点击照片可进入全屏查看模式，支持缩放、旋转和切换</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>全屏模式下使用键盘方向键切换照片</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-500 mr-2">•</span>
            <span>删除照片后无法恢复，请谨慎操作</span>
          </li>
        </ul>
      </div>

      {/* Photo Viewer */}
      {viewerOpen && allPhotos.length > 0 && (
        <PhotoViewer
          photos={allPhotos}
          initialIndex={currentIndex}
          onClose={() => setViewerOpen(false)}
          onDelete={handleViewerDelete}
          onDownload={handleViewerDownload}
        />
      )}
    </div>
  );
}
