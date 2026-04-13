/**
 * 照片拼图创建器
 * Photo Collage Creator Component
 *
 * 用于创建照片拼图
 * For creating photo collages
 */

import { useState, useRef, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// SVG Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Template types
export type CollageLayout = '2x1-left-right' | '2x1-top-bottom' | '3x1-main' | '2x2-grid' | 'custom';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | 'free';

export interface CollageTemplate {
  id: string;
  name: string;
  layout: CollageLayout;
  preview: string;
  aspectRatio: AspectRatio;
  gridConfig: {
    rows: number;
    cols: number;
    areas: Array<{ id: string; row: number; col: number; rowSpan?: number; colSpan?: number }>;
  };
}

export interface CollagePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

// Predefined templates
export const collageTemplates: CollageTemplate[] = [
  {
    id: '2x1-left-right',
    name: '左右',
    layout: '2x1-left-right',
    preview: '▢▢',
    aspectRatio: '4:3',
    gridConfig: {
      rows: 1,
      cols: 2,
      areas: [
        { id: '1', row: 0, col: 0 },
        { id: '2', row: 0, col: 1 },
      ],
    },
  },
  {
    id: '2x1-top-bottom',
    name: '上下',
    layout: '2x1-top-bottom',
    preview: '▢\n▢',
    aspectRatio: '3:4',
    gridConfig: {
      rows: 2,
      cols: 1,
      areas: [
        { id: '1', row: 0, col: 0 },
        { id: '2', row: 1, col: 0 },
      ],
    },
  },
  {
    id: '3x1-main',
    name: '突出主图',
    layout: '3x1-main',
    preview: '▢\n▢▢',
    aspectRatio: '4:3',
    gridConfig: {
      rows: 2,
      cols: 2,
      areas: [
        { id: '1', row: 0, col: 0, rowSpan: 2, colSpan: 2 },
        { id: '2', row: 0, col: 2 },
        { id: '3', row: 1, col: 2 },
      ],
    },
  },
  {
    id: '2x2-grid',
    name: '四宫格',
    layout: '2x2-grid',
    preview: '▢▢\n▢▢',
    aspectRatio: '1:1',
    gridConfig: {
      rows: 2,
      cols: 2,
      areas: [
        { id: '1', row: 0, col: 0 },
        { id: '2', row: 0, col: 1 },
        { id: '3', row: 1, col: 0 },
        { id: '4', row: 1, col: 1 },
      ],
    },
  },
];

export interface CollageCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhotos?: CollagePhoto[];
  onCreate?: (config: CollageConfig) => void | Promise<void>;
}

export interface CollageConfig {
  templateId: string;
  photos: Array<{ photoId: string; areaId: string }>;
  settings: {
    gap: number;
    borderRadius: number;
    background: string;
  };
}

// Background options
const backgroundOptions = [
  { value: '#ffffff', label: '白色', preview: 'bg-white' },
  { value: '#f9fafb', label: '浅灰', preview: 'bg-gray-50' },
  { value: '#fef3c7', label: '暖黄', preview: 'bg-amber-100' },
  { value: '#dbeafe', label: '天蓝', preview: 'bg-blue-100' },
  { value: '#fce7f3', label: '粉彩', preview: 'bg-pink-100' },
  { value: '#f3e8ff', label: '薰紫', preview: 'bg-purple-100' },
];

export function CollageCreator({
  isOpen,
  onClose,
  initialPhotos = [],
  onCreate,
}: CollageCreatorProps) {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate>(collageTemplates[0]);
  const [photoAssignments, setPhotoAssignments] = useState<Map<string, CollagePhoto>>(new Map());
  const [settings, setSettings] = useState({
    gap: 8,
    borderRadius: 16,
    background: '#ffffff',
  });

  // Initialize photos
  useState(() => {
    const assignments = new Map<string, CollagePhoto>();
    initialPhotos.forEach((photo, index) => {
      const area = selectedTemplate.gridConfig.areas[index];
      if (area) {
        assignments.set(area.id, photo);
      }
    });
    setPhotoAssignments(assignments);
  });

  // Update assignments when template changes
  const handleTemplateChange = useCallback((template: CollageTemplate) => {
    setSelectedTemplate(template);

    // Preserve existing assignments where possible
    const newAssignments = new Map<string, CollagePhoto>();
    template.gridConfig.areas.forEach((area, index) => {
      // Try to find existing assignment
      const existing = Array.from(photoAssignments.values())[index];
      if (existing) {
        newAssignments.set(area.id, existing);
      }
    });
    setPhotoAssignments(newAssignments);
  }, [photoAssignments]);

  // Assign photo to area
  const handleAssignPhoto = (areaId: string, photo: CollagePhoto) => {
    setPhotoAssignments((prev) => new Map(prev).set(areaId, photo));
  };

  // Remove photo from area
  const handleRemovePhoto = (areaId: string) => {
    setPhotoAssignments((prev) => {
      const next = new Map(prev);
      next.delete(areaId);
      return next;
    });
  };

  // Handle file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (areaId: string) => {
    fileInputRef.current?.click();
    // Store the areaId for the file input change handler
    (fileInputRef.current as any)._targetAreaId = areaId;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      const photo: CollagePhoto = {
        id: `upload-${Date.now()}`,
        url,
        thumbnailUrl: url,
      };
      const areaId = (event.target as any)._targetAreaId;
      if (areaId) {
        handleAssignPhoto(areaId, photo);
      }
    }
  };

  // Check if all areas have photos
  const filledAreas = selectedTemplate.gridConfig.areas.filter(
    (area) => photoAssignments.has(area.id)
  ).length;
  const totalAreas = selectedTemplate.gridConfig.areas.length;
  const canCreate = filledAreas === totalAreas;

  // Handle create
  const handleCreate = () => {
    const config: CollageConfig = {
      templateId: selectedTemplate.id,
      photos: selectedTemplate.gridConfig.areas
        .map((area) => ({
          photoId: photoAssignments.get(area.id)?.id || '',
          areaId: area.id,
        }))
        .filter((p) => p.photoId),
      settings,
    };
    onCreate?.(config);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="创建照片拼图"
      size="xl"
      footer={
        <div className="flex justify-between">
          <button
            onClick={() => setPhotoAssignments(new Map())}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            清空所有照片
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!canCreate}
              className="gap-2"
            >
              <DownloadIcon />
              创建拼图
            </Button>
          </div>
        </div>
      }
    >
      {/* Template Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">选择模板</h3>
        <div className="grid grid-cols-4 gap-3">
          {collageTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200',
                selectedTemplate.id === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="text-xs text-gray-600 mb-2 whitespace-pre">
                {template.preview}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {template.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Preview */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">拼图预览</h3>
        <div
          className="mx-auto relative overflow-hidden"
          style={{
            maxWidth: '500px',
            aspectRatio: selectedTemplate.aspectRatio === '1:1' ? '1/1' :
                       selectedTemplate.aspectRatio === '4:3' ? '4/3' :
                       selectedTemplate.aspectRatio === '16:9' ? '16/9' : 'auto',
            backgroundColor: settings.background,
            borderRadius: `${settings.borderRadius}px`,
            gap: `${settings.gap}px`,
            display: 'grid',
            gridTemplateRows: `repeat(${selectedTemplate.gridConfig.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${selectedTemplate.gridConfig.cols}, 1fr)`,
          }}
        >
          {selectedTemplate.gridConfig.areas.map((area) => {
            const photo = photoAssignments.get(area.id);
            return (
              <div
                key={area.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-200',
                  photo ? 'cursor-move hover:opacity-90' : 'bg-gray-100'
                )}
                style={{
                  gridRow: `${area.row + 1} / ${area.row + (area.rowSpan || 1) + 1}`,
                  gridColumn: `${area.col + 1} / ${area.col + (area.colSpan || 1) + 1}`,
                  borderRadius: `${Math.max(0, settings.borderRadius - settings.gap / 2)}px`,
                }}
                onClick={() => !photo && handleFileSelect(area.id)}
              >
                {photo ? (
                  <>
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(area.id);
                      }}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon />
                      <span className="sr-only">移除照片</span>
                    </button>
                  </>
                ) : (
                  <button className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-500 transition-colors">
                    <PlusIcon />
                    <span className="sr-only">添加照片</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state hint */}
        {filledAreas < totalAreas && (
          <p className="text-center text-sm text-gray-500 mt-3">
            已添加 {filledAreas} / {totalAreas} 张照片
          </p>
        )}
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            间距: {settings.gap}px
          </label>
          <input
            type="range"
            min="0"
            max="32"
            value={settings.gap}
            onChange={(e) => setSettings({ ...settings, gap: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Border Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            圆角: {settings.borderRadius}px
          </label>
          <input
            type="range"
            min="0"
            max="32"
            value={settings.borderRadius}
            onChange={(e) => setSettings({ ...settings, borderRadius: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Background */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">背景颜色</label>
        <div className="flex gap-2">
          {backgroundOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSettings({ ...settings, background: option.value })}
              className={cn(
                'w-12 h-12 rounded-xl border-2 transition-all',
                settings.background === option.value
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              style={{ backgroundColor: option.value }}
              title={option.label}
            >
              <span className="sr-only">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </Modal>
  );
}
