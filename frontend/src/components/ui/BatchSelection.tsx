/**
 * 批量选择模式组件
 * Batch Selection Mode Component
 *
 * 用于照片页面的批量操作
 * For batch operations on photo pages
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4V4" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

export interface BatchSelectionProps {
  totalCount: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDownload?: (ids: string[]) => void;
  onShare?: (ids: string[]) => void;
  onMoveToAlbum?: (ids: string[], albumId: string) => void;
  onDelete?: (ids: string[]) => void;
  onAddTags?: (ids: string[]) => void;
  onToggleFavorite?: (ids: string[]) => void;
  albums?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string; color?: string }>;
  disabled?: boolean;
}

export function BatchSelection({
  totalCount,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  onDeselectAll,
  onDownload,
  onShare,
  onMoveToAlbum,
  onDelete,
  onAddTags,
  onToggleFavorite,
  albums = [],
  tags = [],
  disabled = false,
}: BatchSelectionProps) {
  const [showAlbumSelector, setShowAlbumSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const isAllSelected = selectedIds.size === totalCount && totalCount > 0;
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  const handleToggleAll = () => {
    if (isAllSelected) {
      onDeselectAll?.();
    } else {
      onSelectAll?.();
    }
  };

  const handleAction = (action: () => void, closeDropdown = true) => {
    if (disabled) return;
    action();
    if (closeDropdown) {
      setShowAlbumSelector(false);
      setShowTagSelector(false);
    }
  };

  const selectedIdsArray = Array.from(selectedIds);

  return (
    <>
      {/* Top Bar - Selection Mode Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Select All + Count */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleAll}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isAllSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
                aria-label={isAllSelected ? "取消全选" : "全选"}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isAllSelected
                      ? "border-white bg-white"
                      : "border-gray-400"
                  )}
                >
                  {isAllSelected && (
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {isAllSelected ? "已全选" : isSomeSelected ? "已选部分" : "全选"}
                </span>
              </button>

              <div className="h-6 w-px bg-gray-300" />

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {selectedIds.size}
                </span>
                <span className="text-sm text-gray-500">
                  / {totalCount}
                </span>
              </div>
            </div>

            {/* Right: Done Button */}
            <button
              onClick={() => onDeselectAll?.()}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <XIcon />
              完成
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Action Panel */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Info */}
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckIcon />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  已选择 {selectedIds.size} 张照片
                </span>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Favorite */}
                {onToggleFavorite && (
                  <button
                    onClick={() => handleAction(() => onToggleFavorite(selectedIdsArray))}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    title="添加到收藏"
                  >
                    <HeartIcon />
                    <span className="hidden sm:inline">收藏</span>
                  </button>
                )}

                {/* Add Tags */}
                {onAddTags && (
                  <div className="relative">
                    <button
                      onClick={() => handleAction(() => setShowTagSelector(!showTagSelector), false)}
                      disabled={disabled}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <TagIcon />
                      <span className="hidden sm:inline">加标签</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Tag Dropdown */}
                    {showTagSelector && (
                      <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">选择标签</div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {tags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => {
                                setSelectedTags((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(tag.id)) {
                                    newSet.delete(tag.id);
                                  } else {
                                    newSet.add(tag.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
                                selectedTags.has(tag.id)
                                  ? "bg-blue-50 text-blue-700"
                                  : "hover:bg-gray-50 text-gray-700"
                              )}
                            >
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tag.color || '#3b82f6' }}
                              />
                              <span>{tag.name}</span>
                              {selectedTags.has(tag.id) && (
                                <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
                          <button
                            onClick={() => handleAction(() => {
                              onAddTags(selectedIdsArray);
                              setSelectedTags(new Set());
                            })}
                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            确定
                          </button>
                          <button
                            onClick={() => {
                              setShowTagSelector(false);
                              setSelectedTags(new Set());
                            }}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Move to Album */}
                {onMoveToAlbum && albums.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => handleAction(() => setShowAlbumSelector(!showAlbumSelector), false)}
                      disabled={disabled}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      <FolderIcon />
                      <span className="hidden sm:inline">移动到</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Album Dropdown */}
                    {showAlbumSelector && (
                      <div className="absolute bottom-full mb-2 left-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2">
                        <div className="text-xs font-medium text-gray-500 px-2 py-1">选择相册</div>
                        <div className="max-h-48 overflow-y-auto">
                          {albums.map((album) => (
                            <button
                              key={album.id}
                              onClick={() => {
                                handleAction(() => {
                                  onMoveToAlbum(selectedIdsArray, album.id);
                                  setSelectedAlbumId(album.id);
                                });
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              <span className="truncate">{album.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Share */}
                {onShare && (
                  <button
                    onClick={() => handleAction(() => onShare(selectedIdsArray))}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <ShareIcon />
                    <span className="hidden sm:inline">分享</span>
                  </button>
                )}

                {/* Download */}
                {onDownload && (
                  <button
                    onClick={() => handleAction(() => onDownload(selectedIdsArray))}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <DownloadIcon />
                    <span className="hidden sm:inline">下载</span>
                  </button>
                )}

                {/* Delete */}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除选中的 ${selectedIds.size} 张照片吗？`)) {
                        handleAction(() => onDelete(selectedIdsArray));
                      }
                    }}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <TrashIcon />
                    <span className="hidden sm:inline">删除</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
