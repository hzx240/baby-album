import { memo, useState } from 'react';
import type { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  photoUrl: string | undefined;
  onClick: () => void;
  onDelete: (id: string) => void;
}

// Magnifying Glass Icon
const MagnifyingGlassIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Trash Icon
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Calendar Icon
const CalendarIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const PhotoCard = memo(({
  photo,
  photoUrl,
  onClick,
  onDelete,
}: PhotoCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format date with friendly display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="group relative p-2 cursor-pointer transition-all duration-300"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
        {photoUrl && !imageError ? (
          <>
            {/* Blur placeholder while loading */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            <img
              src={photoUrl}
              alt={photo.uploadedAt}
              className={`
                w-full h-full object-cover
                transition-all duration-500 ease-out
                group-hover:scale-110
                ${isLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              style={{ filter: isLoaded ? 'none' : 'blur(10px)' }}
              onLoad={() => setIsLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Overlay - appears on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="mb-3 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200 flex items-center gap-2 hover:bg-white/30"
          >
            <MagnifyingGlassIcon />
            <span>查看</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-200 flex items-center gap-2"
          >
            <TrashIcon />
            <span>删除</span>
          </button>
        </div>

        {/* Date Badge on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-xs font-medium">
            {formatDate(photo.takenAt || photo.uploadedAt)}
          </p>
        </div>
      </div>

      {/* Date info below image (always visible) */}
      <div className="mt-2 text-center px-1">
        <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
          <CalendarIcon />
          {formatDate(photo.takenAt || photo.uploadedAt)}
        </p>
      </div>
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';
