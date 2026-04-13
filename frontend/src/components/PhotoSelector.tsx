import { useState, useEffect, useMemo } from 'react';
import { photoApi } from '@/api/photo';
import { Button, Card, Input } from '@/components/ui';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types';

interface PhotoSelectorProps {
  albumId: string;
  onClose: () => void;
  onAdd: (photoIds: string[]) => Promise<void>;
  excludePhotoIds?: string[];
}

export function PhotoSelector({
  albumId,
  onClose,
  onAdd,
  excludePhotoIds = [],
}: PhotoSelectorProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
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
    loadPhotos();
  }, [excludePhotoIds]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const response = await photoApi.getPhotos({
        page: 1,
        limit: 100,
      });

      // Filter out photos already in album
      const filteredPhotos = response.data.filter(
        (photo) => !excludePhotoIds.includes(photo.id)
      );

      setPhotos(filteredPhotos);

      // Batch load photo URLs
      const photoIds = filteredPhotos.map((p) => p.id);
      const thumbUrls = await photoApi.getPhotoUrlsBatch(photoIds, 'thumb');
      setPhotoUrls(thumbUrls);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleAddPhotos = async () => {
    if (selectedIds.size === 0) return;

    setAdding(true);
    try {
      await onAdd(Array.from(selectedIds));
      onClose();
    } catch (err) {
      console.error('Failed to add photos:', err);
    } finally {
      setAdding(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    if (!search) return photos;

    const searchLower = search.toLowerCase();
    return photos.filter((photo) => {
      const date = new Date(photo.takenAt || photo.uploadedAt);
      return (
        date.toLocaleDateString('zh-CN').includes(searchLower) ||
        photo.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    });
  }, [photos, search]);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">选择照片</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedIds.size > 0
              ? `已选择 ${selectedIds.size} 张照片`
              : '点击照片选择'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={adding}>
            取消
          </Button>
          <Button
            onClick={handleAddPhotos}
            disabled={selectedIds.size === 0 || adding}
          >
            {adding ? '添加中...' : `添加 (${selectedIds.size})`}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="搜索照片（日期、标签）..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600">
            {search ? '没有找到匹配的照片' : '没有可添加的照片'}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="relative">
              <PhotoCard
                photo={photo}
                photoUrl={photoUrls.get(photo.id)}
                onClick={() => handleToggleSelect(photo.id)}
                onDelete={() => {}} // Hide delete button
              />
              {/* Selection Indicator */}
              {selectedIds.has(photo.id) && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
