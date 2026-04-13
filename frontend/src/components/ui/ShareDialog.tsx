/**
 * 照片/相册分享对话框组件
 * 功能：权限控制(查看/评论/下载)、暖色系UI、访问统计、撤销分享
 * 使用方式：通过 onGenerateShare/onRevokeShare props 注入业务逻辑
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// SVG Icons
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684m0-9.316a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photoCount?: number;
  onGenerateShare?: (options: ShareOptions) => Promise<ShareResult>;
  onRevokeShare?: () => Promise<void>;
  initiallyShared?: boolean;
  existingShareUrl?: string;
  viewCount?: number;
}

export interface ShareOptions {
  password?: string;
  expiresIn: '1day' | '7days' | '30days' | 'never';
  permission: 'view' | 'comment' | 'download';
}

export interface ShareResult {
  shareUrl: string;
  shareId: string;
  expiresAt?: Date;
}

const expiryOptions = [
  { value: '1day' as const, label: '1 天', description: '24小时后失效' },
  { value: '7days' as const, label: '7 天', description: '一周后失效' },
  { value: '30days' as const, label: '30 天', description: '一月后失效' },
  { value: 'never' as const, label: '永久', description: '永不失效' },
];

const permissionOptions = [
  { value: 'view' as const, icon: '👁️', label: '仅查看', desc: '访客只能浏览照片' },
  { value: 'comment' as const, icon: '💬', label: '可评论', desc: '允许访客留下评论' },
  { value: 'download' as const, icon: '⬇️', label: '可下载', desc: '允许访客保存照片' },
];

// 简单 QR 码占位（T8 实际使用时可接入 qrcode.react）
function QRCodePlaceholder({ url }: { url: string }) {
  // 用 url 生成一个伪随机格子，仅作视觉展示
  const seed = url.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 100 }, (_, i) => ((seed * (i + 1) * 13) % 7) > 2);
  return (
    <div className="inline-block p-3 bg-white rounded-xl shadow-sm border border-pink-100">
      <div className="grid grid-cols-10 gap-0.5">
        {cells.map((filled, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', filled ? 'bg-gray-800' : 'bg-white')} />
        ))}
      </div>
    </div>
  );
}

export function ShareDialog({
  isOpen,
  onClose,
  photoCount = 1,
  onGenerateShare,
  onRevokeShare,
  initiallyShared = false,
  existingShareUrl,
  viewCount = 0,
}: ShareDialogProps) {
  const [isShared, setIsShared] = useState(initiallyShared);
  const [shareUrl, setShareUrl] = useState(existingShareUrl || '');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState<ShareOptions['expiresIn']>('7days');
  const [permission, setPermission] = useState<ShareOptions['permission']>('view');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsShared(initiallyShared);
      setShareUrl(existingShareUrl || '');
      setEnablePassword(false);
      setPassword('');
      setExpiry('7days');
      setPermission('view');
      setCopied(false);
      setShowQRCode(false);
    }
  }, [isOpen, initiallyShared, existingShareUrl]);

  const handleGenerateShare = async () => {
    setIsGenerating(true);
    try {
      if (onGenerateShare) {
        const result = await onGenerateShare({
          password: enablePassword ? password : undefined,
          expiresIn: expiry,
          permission,
        });
        setShareUrl(result.shareUrl);
        setIsShared(true);
      }
    } catch (err) {
      console.error('Failed to generate share:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('确定要撤销分享吗？所有访问链接将立即失效。')) return;
    setIsRevoking(true);
    try {
      await onRevokeShare?.();
      setIsShared(false);
      setShareUrl('');
    } catch (err) {
      console.error('Failed to revoke share:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #ff9f4a 100%)' }}>
            <ShareIcon />
          </div>
          <span>分享相册</span>
          <Badge variant="secondary" className="ml-1 bg-pink-100 text-pink-700">
            {photoCount} 张
          </Badge>
        </div>
      }
      footer={
        <div className="flex justify-between items-center gap-3">
          {/* 撤销分享 */}
          {isShared && onRevokeShare && (
            <button
              onClick={handleRevoke}
              disabled={isRevoking}
              className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-40"
            >
              {isRevoking ? '撤销中…' : '🗑️ 撤销分享'}
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose}>取消</Button>
            {!isShared ? (
              <button
                onClick={handleGenerateShare}
                disabled={isGenerating}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #ff9f4a 100%)' }}
              >
                {isGenerating ? '生成中…' : '🔗 生成分享链接'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
              >
                <CheckIcon /> 完成
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {!isShared ? (
          <>
            {/* 封面说明 */}
            <div className="text-center py-3">
              <div className="text-5xl mb-3 animate-float">🔗</div>
              <p className="text-gray-700 text-sm">生成链接后，家人朋友无需登录即可查看</p>
            </div>

            {/* 权限选择 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">👁️ 访客权限</p>
              <div className="grid grid-cols-3 gap-2">
                {permissionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPermission(opt.value)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all duration-200',
                      permission === opt.value
                        ? 'border-pink-400 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-200 bg-white'
                    )}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 有效期 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">⏰ 有效期</p>
              <div className="grid grid-cols-4 gap-2">
                {expiryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={cn(
                      'p-2.5 rounded-xl border-2 text-center transition-all duration-200',
                      expiry === opt.value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200 bg-white'
                    )}
                  >
                    <div className="text-sm font-bold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 密码保护 */}
            <div className="rounded-xl p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <LockIcon /> 密码保护
                </span>
              </label>
              {enablePassword && (
                <Input
                  type="password"
                  placeholder="设置访问密码（4-16位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={16}
                  helperText="留空则自动生成4位数字密码"
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* 分享成功后展示 */}
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔗</span>
                <h3 className="font-semibold text-gray-800">分享链接</h3>
              </div>

              {/* URL 展示 */}
              <div className="bg-white rounded-xl p-3 flex items-center gap-2 border border-pink-100 mb-3">
                <p className="flex-1 text-sm text-gray-600 truncate font-mono">
                  {shareUrl || 'https://share.baby-album.app/p/xxxxx'}
                </p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                  )}
                >
                  {copied ? <><CheckIcon /> 已复制</> : <><CopyIcon /> 复制</>}
                </button>
              </div>

              {/* 二维码切换 */}
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="w-full text-center text-sm text-pink-500 hover:text-pink-600 py-1.5 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>📱</span>
                {showQRCode ? '收起二维码' : '展开二维码'}
              </button>

              {showQRCode && (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <QRCodePlaceholder url={shareUrl || 'https://share.baby-album.app'} />
                  <p className="text-xs text-gray-400">手机扫码即可访问</p>
                </div>
              )}
            </div>

            {/* 访问统计 */}
            {viewCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl text-sm text-teal-700">
                <span>📊</span>
                <span>已被浏览 <b>{viewCount}</b> 次</span>
              </div>
            )}

            {/* 分享设置摘要 */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex-wrap">
              <span>📋 {permissionOptions.find(p => p.value === permission)?.label}</span>
              <span>·</span>
              <span>⏰ {expiryOptions.find(o => o.value === expiry)?.label}有效</span>
              {enablePassword && <><span>·</span><span>🔒 有密码保护</span></>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
