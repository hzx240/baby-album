/**
 * Skeleton 骨架屏组件
 * Skeleton Loading Component
 *
 * 用于加载状态显示
 * Loading placeholder components
 */

import { cn } from '@/lib/utils';

// Types
export type SkeletonVariant = 'circle' | 'rect' | 'text' | 'card' | 'photo';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animate?: boolean;
}

// Base shimmer animation
const shimmerClass = 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

// Skeleton Component
export function Skeleton({
  variant = 'rect',
  width,
  height,
  count = 1,
  className,
  animate = true,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  const baseClassName = cn(
    'rounded-md',
    animate && shimmerClass,
    !animate && 'bg-gray-200',
    className
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return (
          <div
            className={cn(baseClassName, 'rounded-full')}
            style={{ width: width || '40px', height: height || '40px' }}
          />
        );

      case 'rect':
        return (
          <div
            className={baseClassName}
            style={{ width, height }}
          />
        );

      case 'text':
        return (
          <div
            className={cn(baseClassName, 'h-4')}
            style={{ width: width || '100%' }}
          />
        );

      case 'card':
        return (
          <div className="p-4 space-y-3" style={{ width }}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className={cn(baseClassName, 'rounded-full')}
                style={{ width: '48px', height: '48px' }}
              />
              <div className="flex-1 space-y-2">
                <div className={cn(baseClassName, 'h-4 w-3/4')} />
                <div className={cn(baseClassName, 'h-3 w-1/2')} />
              </div>
            </div>
            {/* Body */}
            <div className={cn(baseClassName, 'h-32 w-full rounded-xl')} />
            {/* Footer */}
            <div className="flex gap-2">
              <div className={cn(baseClassName, 'h-8 flex-1 rounded-lg')} />
              <div className={cn(baseClassName, 'h-8 w-20 rounded-lg')} />
            </div>
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-2" style={{ width, height }}>
            {/* Photo placeholder */}
            <div
              className={cn(baseClassName, 'aspect-[4/3] rounded-xl w-full')}
            />
            {/* Meta */}
            <div className="flex justify-between">
              <div className={cn(baseClassName, 'h-3 w-1/3')} />
              <div className={cn(baseClassName, 'h-3 w-1/4')} />
            </div>
          </div>
        );

      default:
        return <div className={baseClassName} style={{ width, height }} />;
    }
  };

  return (
    <>
      {items.map((_, index) => (
        <span key={index} className="inline-block">
          {renderSkeleton()}
        </span>
      ))}
    </>
  );
}

// Preset Skeleton Components

// Avatar Skeleton
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };
  return <Skeleton variant="circle" width={sizes[size]} height={sizes[size]} />;
}

// Text Line Skeleton
export function TextSkeleton({ lines = 3, width }: { lines?: number; width?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && width !== undefined ? width : undefined}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

// Photo Card Skeleton (for photo grid)
export function PhotoCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton variant="photo" />
    </div>
  );
}

// Photo Grid Skeleton
export function PhotoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PhotoCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Card List Skeleton
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}

// Album Card Skeleton
export function AlbumCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[4/3]">
        <Skeleton variant="rect" width="100%" height="100%" className="rounded-xl" />
        {/* Badge placeholders */}
        <div className="absolute top-3 right-3 flex gap-2">
          <Skeleton variant="rect" width="60px" height="24px" className="rounded-full" />
        </div>
      </div>
      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" width="32px" height="32px" />
          <Skeleton variant="rect" width="60%" height="20px" />
        </div>
        <Skeleton variant="rect" width="40%" height="16px" />
      </div>
    </div>
  );
}

// Album Grid Skeleton
export function AlbumGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Header Skeleton
export function HeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton variant="rect" width="200px" height="32px" />
          <Skeleton variant="rect" width="300px" height="20px" />
        </div>
        <Skeleton variant="rect" width="120px" height="40px" className="rounded-lg" />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} variant="rect" width={`${100 / columns}%`} height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`r-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`c-${colIndex}`} variant="rect" width={`${100 / columns}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading Page Skeleton
export function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <HeaderSkeleton />
      <Skeleton variant="rect" width="100%" height="200px" className="rounded-xl" />
      <CardListSkeleton count={3} />
    </div>
  );
}

// Export all
export const SkeletonComponents = {
  Avatar: AvatarSkeleton,
  Text: TextSkeleton,
  PhotoCard: PhotoCardSkeleton,
  PhotoGrid: PhotoGridSkeleton,
  CardList: CardListSkeleton,
  AlbumCard: AlbumCardSkeleton,
  AlbumGrid: AlbumGridSkeleton,
  Header: HeaderSkeleton,
  Table: TableSkeleton,
  Page: PageSkeleton,
};
