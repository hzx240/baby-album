/**
 * CommentThread — 照片评论区组件
 * API 接口: GET/POST/DELETE /api/v1/photos/:id/comments
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { commentApi } from '@/api/comment';
import type { PhotoComment } from '@/types';

interface CommentThreadProps {
  photoId: string;
  /** 当前登录用户 ID */
  currentUserId?: string;
  /** 当前登录用户名 */
  currentUserName?: string;
}

const QUICK_EMOJIS = ['❤️', '😍', '😂', '😮', '🥰', '👏'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function Avatar({ name }: { name: string }) {
  const colors = [
    'bg-pink-400', 'bg-orange-400', 'bg-amber-400',
    'bg-teal-400', 'bg-violet-400', 'bg-rose-400',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', colors[colorIdx])}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  onDelete,
  onReply,
}: {
  comment: PhotoComment;
  currentUserId?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (userName: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const userName = comment.user?.name || '用户';

  const handleLike = () => {
    setLiked(!liked);
    onLike(comment.id);
  };

  return (
    <div className="flex gap-3">
      <Avatar name={userName} />
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white border border-pink-100" style={{ boxShadow: '0 1px 4px rgba(255,107,157,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{userName}</span>
            {comment.emojiReaction && <span className="text-base">{comment.emojiReaction}</span>}
          </div>
          <p className="text-sm text-gray-700 break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          <button
            onClick={handleLike}
            className={cn(
              'text-xs flex items-center gap-1 transition-all duration-200',
              liked ? 'text-pink-500 font-medium' : 'text-gray-400 hover:text-pink-400'
            )}
          >
            {liked ? '❤️' : '🤍'} {comment.likes + (liked ? 1 : 0)}
          </button>
          <button
            onClick={() => onReply(userName)}
            className="text-xs text-gray-400 hover:text-pink-400 transition-colors"
          >
            回复
          </button>
          {currentUserId === comment.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              删除
            </button>
          )}
        </div>
        {/* 回复列表 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 pl-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onLike={onLike}
                onDelete={onDelete}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread({ photoId, currentUserId, currentUserName = '我' }: CommentThreadProps) {
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) return;
    commentApi.getComments(photoId)
      .then(setComments)
      .catch(() => setLoadError('评论加载失败'));
  }, [photoId]);

  const handleSend = async () => {
    if (!inputValue.trim() || submitting) return;
    setSubmitting(true);
    try {
      const content = replyTo ? `回复 @${replyTo}：${inputValue}` : inputValue;
      const newComment = await commentApi.createComment(photoId, { content });
      setComments((prev) => [...prev, newComment]);
      setInputValue('');
      setReplyTo(null);
    } catch {
      // 发送失败静默处理，不打断用户
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmojiReact = async (emoji: string) => {
    if (!currentUserId) return;
    try {
      const newComment = await commentApi.createComment(photoId, {
        content: '',
        emojiReaction: emoji,
      });
      setComments((prev) => [...prev, newComment]);
    } catch {
      // 静默处理
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      await commentApi.likeComment(photoId, commentId);
    } catch {
      // 静默处理
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentApi.deleteComment(photoId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // 静默处理
    }
  };

  const handleReply = (userName: string) => {
    setReplyTo(userName);
    setInputValue('');
  };

  return (
    <div className="mt-6">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💬</span>
        <h3 className="font-semibold text-gray-800">评论</h3>
        {comments.length > 0 && (
          <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">{comments.length}</span>
        )}
      </div>

      {/* Emoji 快捷反应 */}
      <div className="flex gap-2 mb-4">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiReact(emoji)}
            className="text-xl hover:scale-125 transition-transform duration-150 p-1 rounded-lg hover:bg-pink-50"
            title={`快速反应 ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* 评论列表 */}
      {loadError ? (
        <div className="text-center py-4 text-sm text-gray-400">{loadError}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-2xl mb-2">🌸</p>
          <p className="text-sm">还没有评论，快来说点什么吧~</p>
        </div>
      ) : (
        <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onLike={handleLike}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border border-pink-100 bg-white"
        style={{ boxShadow: '0 2px 8px rgba(255,107,157,0.08)' }}
      >
        <Avatar name={currentUserName} />
        <div className="flex-1 relative">
          {replyTo && (
            <div className="flex items-center gap-1 mb-1 text-xs text-pink-500">
              <span>回复 @{replyTo}</span>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 ml-1">✕</button>
            </div>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={replyTo ? `回复 @${replyTo}…` : '写下你的评论…'}
            className="w-full text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            maxLength={500}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || submitting}
          className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #ff9f4a 100%)',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
