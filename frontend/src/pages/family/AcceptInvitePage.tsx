import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { familyInvitationsApi } from '@/lib/family-api';
import type { ValidateInvitationResponse } from '@/types';
import { Loading, ErrorAlert } from '@/components/ui';

const ROLE_LABELS: Record<string, string> = {
  OWNER: '所有者',
  ADMIN: '管理员',
  MEMBER: '成员',
  VIEWER: '访客',
};

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const [isValidating, setIsValidating] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<ValidateInvitationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('无效的邀请链接');
      setIsValidating(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);
      const data = await familyInvitationsApi.validateInvitation(token);
      setInvitation(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '邀请链接无效或已过期');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      setIsAccepting(true);
      setError(null);

      // 如果未登录，跳转到登录页面，登录后自动返回
      if (!isAuthenticated || !user) {
        sessionStorage.setItem('pendingInviteToken', token);
        navigate(`/login?redirect=${encodeURIComponent('/invite?token=' + token)}`);
        return;
      }

      await familyInvitationsApi.acceptInvitation({ token });

      // 刷新用户信息以获取新的 familyId
      await useAuthStore.getState().fetchUser();

      alert('您已成功加入家庭！');
      navigate('/members');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '接受邀请失败');
    } finally {
      setIsAccepting(false);
    }
  };

  // 登录后自动接受邀请
  useEffect(() => {
    if (isAuthenticated && user && token && invitation) {
      const pendingToken = sessionStorage.getItem('pendingInviteToken');
      if (pendingToken === token) {
        sessionStorage.removeItem('pendingInviteToken');
        handleAcceptInvitation();
      }
    }
  }, [isAuthenticated, user, token, invitation]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">邀请无效</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">家庭邀请</h1>
          <p className="text-gray-600">
            <strong>{invitation.inviter.displayName || invitation.inviter.email}</strong>
            邀请您加入家庭
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{invitation.family.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                您的角色: <span className="font-medium text-gray-700">{ROLE_LABELS[invitation.role]}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <span className="text-2xl mr-3">👥</span>
            <span>加入后可以与家庭成员共享照片和回忆</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="text-2xl mr-3">📸</span>
            <span>查看和上传家庭相册中的照片</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="text-2xl mr-3">👶</span>
            <span>记录宝贝的成长瞬间</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong>如果您已属于其他家庭，接受邀请后将自动切换到新家庭。
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 btn-secondary"
            disabled={isAccepting}
          >
            拒绝
          </button>
          <button
            onClick={handleAcceptInvitation}
            className="flex-1 btn-primary"
            disabled={isAccepting}
          >
            {isAccepting ? '接受中...' : '接受邀请'}
          </button>
        </div>

        {!isAuthenticated && (
          <p className="text-center text-sm text-gray-500 mt-4">
            您需要先登录才能接受邀请
          </p>
        )}
      </div>
    </div>
  );
}
