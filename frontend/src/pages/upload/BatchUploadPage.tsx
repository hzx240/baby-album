import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChildStore } from '@/stores/child.store';
import { photoApi } from '@/api/photo';
import { BatchUpload } from '@/components/BatchUpload';
import type { UploadFile } from '@/components/BatchUpload';

const createChecksumWorker = () => {
  return new Worker(
    new URL('../workers/checksum.worker.ts', import.meta.url),
    { type: 'module' }
  );
};

export default function BatchUploadPage() {
  const navigate = useNavigate();
  const { children } = useChildStore();

  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(
    undefined
  );
  const [uploadStatus, setUploadStatus] = useState<{
    total: number;
    success: number;
    failed: number;
  }>({ total: 0, success: 0, failed: 0 });

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

  const handleUpload = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<void> => {
    try {
      const checksum = await calculateChecksum(file);
      const uploadResponse = await photoApi.requestUpload({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        checksum,
      });

      if ('duplicate' in uploadResponse && uploadResponse.duplicate) {
        throw new Error('该照片已存在，无需重复上传');
      }

      onProgress(30);
      await photoApi.uploadToS3(uploadResponse.uploadUrl, file);

      onProgress(70);
      await photoApi.completeUpload({
        key: uploadResponse.key,
        checksum,
        contentType: file.type,
        childId: selectedChildId,
      });

      onProgress(100);
    } catch (error) {
      throw error;
    }
  };

  const handleUploadComplete = (files: UploadFile[]) => {
    const success = files.filter((f) => f.status === 'success').length;
    const failed = files.filter((f) => f.status === 'error').length;

    setUploadStatus({
      total: files.length,
      success,
      failed,
    });
  };

  const handleNavigateToPhotos = () => {
    navigate('/photos');
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Hero Upload Section */}
      <section className="col-span-12 lg:col-span-8 space-y-8 animate-fade-in">
        <div>
          <h2 className="text-4xl font-headline font-light text-on-surface mb-2">保存美好瞬间</h2>
          <p className="font-body text-on-surface-variant max-w-xl">今天捕捉的每一个像素，都是明天的宝贵遗产。请将您的珍贵回忆拖入下方。</p>
        </div>

        {/* Upload Zone Component integrated within UI design */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-surface-container-lowest rounded-xl p-6 group-hover:border-primary/50 transition-all duration-500">
            {(children || []).length > 0 && (
              <div className="mb-4 text-right">
                <select
                  className="bg-surface-container-high border-none rounded-lg py-2 px-4 text-xs font-bold text-on-surface focus:ring-2 focus:ring-secondary/20"
                  value={selectedChildId || ''}
                  onChange={(e) => setSelectedChildId(e.target.value || undefined)}
                >
                  <option value="">未选择宝贝</option>
                  {(children || []).map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* The BatchUpload component handles the drag drop internal logic */}
            <BatchUpload
              onUpload={handleUpload}
              onComplete={handleUploadComplete}
              maxFiles={50}
              maxSize={10 * 1024 * 1024}
            />
          </div>
        </div>

        {/* Recently Uploaded List (Status) */}
        {uploadStatus.total > 0 && (
          <div className="bg-surface-container-low rounded-xl p-8 space-y-6 animate-slide-up">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-headline">最近上传</h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{uploadStatus.total} 项处理中</span>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-container-lowest p-6 rounded-lg text-center">
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div>
                    <div className="text-3xl font-bold text-on-surface">{uploadStatus.total}</div>
                    <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">总数</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-secondary">{uploadStatus.success}</div>
                    <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">成功</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-error">{uploadStatus.failed}</div>
                    <div className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">失败</div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button className="btn-primary" onClick={handleNavigateToPhotos}>
                    查看档案
                  </button>
                  <button className="btn-secondary" onClick={() => setUploadStatus({ total: 0, success: 0, failed: 0 })}>
                    继续上传
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sidebar Stats & Controls */}
      <section className="col-span-12 lg:col-span-4 space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
        {/* Storage Stats Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-8">存储空间使用情况</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-low" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="8"></circle>
                <circle className="text-tertiary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray="502.6" strokeDashoffset="470" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-headline text-on-surface">5.2%</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">共 50GB 容量</span>
              </div>
            </div>
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">照片 (1.8GB)</span>
                <span className="font-bold text-tertiary">72%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">视频 (0.7GB)</span>
                <span className="font-bold text-secondary">28%</span>
              </div>
              <button className="w-full mt-4 py-3 rounded-full border border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-low transition-colors">扩容空间</button>
            </div>
          </div>
        </div>

        {/* Privacy Toggles */}
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">安全与隐私</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">家庭共享</p>
                <p className="text-[10px] text-on-surface-variant">对已验证的亲属可见</p>
              </div>
              <div className="relative w-12 h-6 bg-secondary rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">仅监护人可见</p>
                <p className="text-[10px] text-on-surface-variant">对所有外部用户隐藏</p>
              </div>
              <div className="relative w-12 h-6 bg-surface-container-high rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">生物识别档案</p>
                <p className="text-[10px] text-on-surface-variant">使用 FaceID 加密</p>
              </div>
              <div className="relative w-12 h-6 bg-secondary rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-tertiary text-white rounded-xl p-8 overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <h3 className="font-headline italic text-lg mb-2">智能整理</h3>
          <p className="text-xs font-body opacity-80 leading-relaxed mb-4">我们的 AI 会自动过滤模糊照片，并按情感组织回忆。您只需专注上传。</p>
          <a className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" href="#">了解更多 <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
        </div>
      </section>
    </div>
  );
}