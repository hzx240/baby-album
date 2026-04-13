import React, { useEffect, useState, useMemo, memo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChildStore } from '@/stores/child.store';
import { photoApi } from '@/api/photo';
import PhotoViewer from '@/components/PhotoViewer';
import VirtualPhotoGrid from '@/components/VirtualPhotoGrid';
import { Loading } from '@/components/ui';
import { ErrorAlert } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import type { Photo } from '@/types';

// Web Worker for checksum calculation
const createChecksumWorker = () => {
  return new Worker(
    new URL('../workers/checksum.worker.ts', import.meta.url),
    { type: 'module' }
  );
};

// Responsive column count
const getColumnCount = () => {
  if (typeof window === 'undefined') return 4;
  const width = window.innerWidth;
  if (width < 640) return 2; // sm
  if (width < 768) return 3; // md
  if (width < 1024) return 4; // lg
  return 5; // xl
};

// Memoized photo card component to prevent unnecessary re-renders
const PhotoCard = memo(({
  photo,
  photoUrl,
  onClick,
  onDelete,
}: {
  photo: Photo;
  photoUrl: string | undefined;
  onClick: () => void;
  onDelete: (id: string) => void;
}) => (
  <div
    className="group card p-3 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    onClick={onClick}
  >
    <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={photo.uploadedAt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
        <div className="text-white/90 text-sm mb-2">🔍 点击查看</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.id);
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200 flex items-center gap-2"
        >
          <span>🗑️</span>
          <span>删除</span>
        </button>
      </div>
    </div>
    <div className="mt-3 text-center">
      <p className="text-xs text-gray-500 font-medium">
        {new Date(photo.takenAt || photo.uploadedAt).toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  </div>
));

PhotoCard.displayName = 'PhotoCard';

export default function PhotosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');

  // Get store with safe defaults
  const childStore = useChildStore();
  const storeChildren = childStore?.children;

  // Ensure children is always an array - multiple layers of safety
  const children = React.useMemo(() => {
    if (!storeChildren) return [];
    if (!Array.isArray(storeChildren)) return [];
    return storeChildren;
  }, [storeChildren]);

  const fetchChildren = childStore?.fetchChildren || (() => Promise.resolve());

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<Array<{ id: string; url: string; uploadedAt: string; takenAt?: string | null }>>([]);
  const [uploadChildId, setUploadChildId] = useState<string | undefined>(childId || undefined);
  const [columnCount, setColumnCount] = useState(getColumnCount());

  // Safety wrapper to ensure photos is always an array
  const safePhotos = React.useMemo(() => {
    return Array.isArray(photos) ? photos : [];
  }, [photos]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    loadPhotos();
  }, [childId]);

  useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await photoApi.getPhotos({
        childId: childId || undefined,
        page: 1,
        limit: 100,
      });
      const photosData = Array.isArray(response.data) ? response.data : [];
      setPhotos(photosData);

      // Batch load photo URLs - optimized to reduce API calls
      const photoIds = photosData.map(p => p.id);
      const thumbUrls = await photoApi.getPhotoUrlsBatch(photoIds, 'thumb');
      const originalUrls = await photoApi.getPhotoUrlsBatch(photoIds, 'original');

      const viewerData = photosData.map(photo => ({
        id: photo.id,
        url: originalUrls.get(photo.id) || '',
        uploadedAt: photo.uploadedAt,
        takenAt: photo.takenAt,
      }));

      setPhotoUrls(thumbUrls);
      setViewerPhotos(viewerData);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载照片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const calculateChecksum = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const worker = createChecksumWorker();

      worker.onmessage = (e) => {
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.checksum);
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const checksum = await calculateChecksum(selectedFile);

      // Request upload URL
      const uploadResponse = await photoApi.requestUpload({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        fileSize: selectedFile.size,
        checksum,
      });

      // Check for duplicate
      if ('duplicate' in uploadResponse && uploadResponse.duplicate) {
        setError('该照片已存在，无需重复上传');
        setUploading(false);
        return;
      }

      // Upload to S3
      await photoApi.uploadToS3(uploadResponse.uploadUrl, selectedFile);

      // Complete upload with childId if selected
      await photoApi.completeUpload({
        key: uploadResponse.key,
        checksum,
        contentType: selectedFile.type,
        childId: uploadChildId,
      });

      // Reload photos
      await loadPhotos();
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      await photoApi.deletePhoto(photoId);
      setPhotos(safePhotos.filter((p) => p.id !== photoId));
      setPhotoUrls((prev) => {
        const newUrls = new Map(prev);
        newUrls.delete(photoId);
        return newUrls;
      });
      setViewerPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
    }
  };

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleViewerDelete = async (photoId: string) => {
    try {
      await photoApi.deletePhoto(photoId);
      setPhotos(prev => prev.filter((p) => p.id !== photoId));
      setPhotoUrls((prev) => {
        const newUrls = new Map(prev);
        newUrls.delete(photoId);
        return newUrls;
      });
      setViewerPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
    }
  };

  const handleViewerDownload = async (photoId: string, url: string) => {
    try {
      const urlResponse = await photoApi.getPhotoUrl(photoId, 'resized');
      const link = document.createElement('a');
      link.href = urlResponse.url;
      link.download = `photo-${photoId}.jpg`;
      link.click();
    } catch (err) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${photoId}.jpg`;
      link.click();
    }
  };

  // Group photos by year-month
  const groupPhotosByDate = (photos: Photo[] | undefined) => {
    const grouped: Record<string, Photo[]> = {};

    // Ensure photos is an array
    const photosArray = Array.isArray(photos) ? photos : [];

    photosArray.forEach((photo) => {
      const date = photo.takenAt ? new Date(photo.takenAt) : new Date(photo.uploadedAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(photo);
    });

    // Sort by date descending
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearB - yearA || monthB - monthA;
    });

    return sortedKeys.map((key) => {
      const [year, month] = key.split('-').map(Number);
      const groupPhotos = grouped[key] || [];
      return {
        key,
        year,
        month,
        monthName: new Date(year, month).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
        }),
        photos: groupPhotos.sort((a, b) => {
          const dateA = new Date(a.takenAt || a.uploadedAt);
          const dateB = new Date(b.takenAt || b.uploadedAt);
          return dateB.getTime() - dateA.getTime();
        }),
      };
    });
  };

  const selectedChild = children.find((c) => c.id === childId);

  // Memoize grouped photos to prevent unnecessary re-grouping
  const groupedPhotos = useMemo(() => groupPhotosByDate(safePhotos), [safePhotos]);

  if (loading) {
    return <Loading />;
  }

  // Safety check - ensure children is defined before rendering
  if (!children || !Array.isArray(children)) {
    return <Loading />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedChild ? `${selectedChild.name}的照片` : '所有照片'}
            </h1>
            <p className="text-gray-500 mt-1">
              {safePhotos.length > 0 ? `共 ${safePhotos.length} 张照片` : '还没有照片'}
            </p>
          </div>

          {/* Child Filter */}
          {children.length > 0 && (
            <select
              value={childId || ''}
              onChange={(e) => navigate(`/photos${e.target.value ? `?childId=${e.target.value}` : ''}`)}
              className="input"
            >
              <option value="">所有宝贝</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          )}

          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <span className="text-xl">📷</span>
            <span>上传照片</span>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Preview Card */}
      {selectedFile && (
        <div className="card-gradient mb-8 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-bounce-soft">📸</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">准备上传照片</h3>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="flex items-center gap-2 bg-primary-50 px-3 py-1 rounded-full">
                  <span>💾</span>
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              {/* Child Selection */}
              {children.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择宝贝（可选）
                  </label>
                  <select
                    value={uploadChildId || ''}
                    onChange={(e) => setUploadChildId(e.target.value || undefined)}
                    className="input"
                  >
                    <option value="">不选择</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>确认上传</span>
                </>
              )}
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="btn-outline flex-1"
              disabled={uploading}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Photos Grid with Virtual Scrolling */}
      {safePhotos.length === 0 ? (
        <EmptyState
          icon="📸"
          title="还没有照片"
          description={children.length === 0 ? '请先添加宝贝信息，然后上传照片' : '点击上方按钮上传第一张照片'}
        />
      ) : (
        <div className="animate-slide-up">
          <div className="mb-6 bg-white/90 backdrop-blur-sm py-3 rounded-xl">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedChild ? `${selectedChild.name}的照片` : '所有照片'}
            </h1>
            <p className="text-gray-500 mt-1">
              {safePhotos.length > 0 ? `共 ${safePhotos.length} 张照片` : '还没有照片'}
            </p>
          </div>

          <VirtualPhotoGrid
            photos={safePhotos}
            photoUrls={photoUrls}
            columnCount={columnCount}
            rowHeight={350} // card height + spacing
            onPhotoClick={handleOpenViewer}
            onPhotoDelete={handleDelete}
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
          onDownload={handleViewerDownload}
        />
      )}
    </div>
  );
}
