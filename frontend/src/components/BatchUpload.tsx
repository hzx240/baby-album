import { useState, useCallback } from 'react';
import { UploadZone } from './UploadZone';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface BatchUploadProps {
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<void>;
  onComplete?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export function BatchUpload({
  onUpload,
  onComplete,
  maxFiles = 50,
  maxSize = 10 * 1024 * 1024,
}: BatchUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newFiles: UploadFile[] = files.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`,
      status: 'pending',
      progress: 0,
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleUpload = useCallback(async () => {
    setIsUploading(true);

    // Upload files sequentially or in parallel
    for (const uploadFile of uploadFiles) {
      if (uploadFile.status !== 'pending') continue;

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        )
      );

      try {
        await onUpload(uploadFile.file, (progress) => {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          );
        });

        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      } catch (error) {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : '上传失败' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    setUploadFiles((prev) => {
      onComplete?.(prev);
      return prev;
    });
  }, [uploadFiles, onUpload, onComplete]);

  const handleRemove = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setUploadFiles([]);
  }, []);

  const pendingCount = uploadFiles.filter((f) => f.status === 'pending').length;
  const successCount = uploadFiles.filter((f) => f.status === 'success').length;
  const errorCount = uploadFiles.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {uploadFiles.length === 0 && (
        <UploadZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          maxFiles={maxFiles}
          maxSize={maxSize}
        />
      )}

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                上传队列
              </h3>
              <p className="text-sm text-gray-500">
                共 {uploadFiles.length} 个文件 ·
                成功 {successCount} ·
                失败 {errorCount} ·
                待上传 {pendingCount}
              </p>
            </div>
            <div className="flex gap-2">
              {!isUploading && pendingCount > 0 && (
                <Button onClick={handleUpload} disabled={isUploading}>
                  开始上传
                </Button>
              )}
              {!isUploading && (
                <Button variant="outline" onClick={handleClear}>
                  清空队列
                </Button>
              )}
            </div>
          </div>

          {/* File List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={URL.createObjectURL(uploadFile.file)}
                    alt={uploadFile.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <Badge
                      variant={
                        uploadFile.status === 'success'
                          ? 'success'
                          : uploadFile.status === 'error'
                          ? 'danger'
                          : uploadFile.status === 'uploading'
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {uploadFile.status === 'success' && '成功'}
                      {uploadFile.status === 'error' && '失败'}
                      {uploadFile.status === 'uploading' && '上传中'}
                      {uploadFile.status === 'pending' && '等待中'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} size="sm" />
                  )}
                  {uploadFile.error && (
                    <p className="text-sm text-red-600 mt-1">{uploadFile.error}</p>
                  )}
                </div>

                {/* Actions */}
                {uploadFile.status === 'pending' && !isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(uploadFile.id)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {!isUploading && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <UploadZone
                onFilesSelected={handleFilesSelected}
                multiple={true}
                maxFiles={maxFiles - uploadFiles.length}
                maxSize={maxSize}
                className="p-6"
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
