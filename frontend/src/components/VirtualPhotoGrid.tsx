import { memo } from 'react';
import { Grid } from 'react-window';
import type { Photo } from '@/types';

interface VirtualPhotoGridProps {
  photos: Photo[];
  photoUrls: Map<string, string>;
  columnCount: number;
  rowHeight: number;
  onPhotoClick: (index: number) => void;
  onPhotoDelete: (id: string) => void;
}

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

export default function VirtualPhotoGrid({
  photos,
  photoUrls,
  columnCount,
  rowHeight,
  onPhotoClick,
  onPhotoDelete,
}: VirtualPhotoGridProps) {
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 32 : 1200;
  const columnWidth = containerWidth / columnCount;

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const photo = photos[index];

    if (!photo) return null;

    return (
      <div style={style}>
        <PhotoCard
          photo={photo}
          photoUrl={photoUrls.get(photo.id)}
          onClick={() => onPhotoClick(index)}
          onDelete={onPhotoDelete}
        />
      </div>
    );
  };

  return (
    <Grid
      className="w-full"
      columnCount={columnCount}
      columnWidth={columnWidth}
      defaultHeight={600}
      rowCount={Math.ceil(photos.length / columnCount)}
      rowHeight={rowHeight}
      defaultWidth={containerWidth}
      cellComponent={Cell}
      cellProps={{}}
    />
  );
}
