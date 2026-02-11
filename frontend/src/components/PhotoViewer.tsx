import { useState, useEffect, useRef, useCallback } from 'react';

interface PhotoViewerProps {
  photos: Array<{ id: string; url: string; uploadedAt: string }>;
  initialIndex?: number;
  onClose?: () => void;
  onDelete?: (photoId: string) => Promise<void>;
  onDownload?: (photoId: string, url: string) => void;
}

export default function PhotoViewer({
  photos,
  initialIndex = 0,
  onClose,
  onDelete,
  onDownload,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentPhoto = photos[currentIndex];

  // 重置缩放和位置
  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // 切换到下一张/上一张
  const goToNext = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length, resetTransform]);

  const goToPrev = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length, resetTransform]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if (e.key === 'i' || e.key === 'I') setShowInfo((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // 缩放处理
  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.5));
  const handleResetZoom = () => resetTransform();
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // 双击缩放
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      resetTransform();
    }
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  // 鼠标/触摸拖拽
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - position.x, y: clientY - position.y });
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging && scale > 1) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 删除照片
  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm('确定要删除这张照片吗？')) {
      await onDelete(currentPhoto.id);
      if (photos.length === 1 && onClose) {
        onClose();
      }
    }
  };

  // 下载照片
  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentPhoto.id, currentPhoto.url);
    }
  };

  // 切换照片（滑动）
  const handleSwipe = (direction: 'left' | 'right') => {
    if (scale === 1) {
      if (direction === 'left') goToNext();
      else goToPrev();
    }
  };

  // 触摸滑动检测
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale === 1) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart !== null && scale === 1) {
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;
      if (Math.abs(diff) > 50) {
        handleSwipe(diff > 0 ? 'left' : 'right');
      }
      setTouchStart(null);
    }
  };

  if (!currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      ref={containerRef}
    >
      {/* 顶部操作栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span className="text-xl">✕</span>
            <span>关闭</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>

          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className="text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span className="text-xl">ℹ️</span>
            <span>信息</span>
          </button>
        </div>
      </div>

      {/* 照片显示区域 */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 上一张按钮 */}
        {photos.length > 1 && scale === 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-4 z-10 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 照片 */}
        <div
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            ref={imageRef}
            src={currentPhoto.url}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-[calc(100vh-200px)] object-contain select-none"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            draggable={false}
          />
        </div>

        {/* 下一张按钮 */}
        {photos.length > 1 && scale === 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 z-10 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* 照片信息面板 */}
        {showInfo && (
          <div className="absolute bottom-32 left-4 right-4 bg-black/80 backdrop-blur-lg rounded-2xl p-6 text-white animate-slide-up">
            <h3 className="text-lg font-bold mb-4">照片信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60">上传时间</div>
                <div className="font-medium">
                  {new Date(currentPhoto.uploadedAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-white/60">照片序号</div>
                <div className="font-medium">{currentIndex + 1} / {photos.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-center gap-3">
          {/* 缩小 */}
          <button
            onClick={handleZoomOut}
            className="text-white/90 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
            title="缩小"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          {/* 缩放比例 */}
          <span className="text-white/80 text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* 放大 */}
          <button
            onClick={handleZoomIn}
            className="text-white/90 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
            title="放大"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <div className="w-px h-6 bg-white/30 mx-2" />

          {/* 旋转 */}
          <button
            onClick={handleRotate}
            className="text-white/90 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
            title="旋转"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 重置 */}
          <button
            onClick={handleResetZoom}
            className="text-white/90 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
            title="重置"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <div className="w-px h-6 bg-white/30 mx-2" />

          {/* 下载 */}
          <button
            onClick={handleDownload}
            className="text-white/90 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
            title="下载"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* 删除 */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-white/90 hover:text-red-400 p-3 rounded-full hover:bg-white/10 transition-all"
              title="删除"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="text-center mt-4 text-white/50 text-xs">
          双击缩放 · 滚轮缩放 · 拖拽平移 · 左右切换 · ESC关闭
        </div>
      </div>
    </div>
  );
}
