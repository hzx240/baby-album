import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { familyMembersApi, familyInvitationsApi } from '@/lib/family-api';
import type { FamilyMember, FamilyInvitation, FamilyRole } from '@/types';
import { Loading, ErrorAlert } from '@/components/ui';

const ROLE_LABELS: Record<FamilyRole, string> = {
  OWNER: '所有者',
  ADMIN: '管理员',
  MEMBER: '成员',
  VIEWER: '访客',
};

const ROLE_COLORS: Record<FamilyRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-700',
};

export default function MembersPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyRole>('MEMBER');
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const currentUserRole = members?.find((m) => m.userId === user?.id)?.role;
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.familyId) return;

    try {
      setIsLoading(true);
      setError(null);
      const [membersData, invitationsData] = await Promise.all([
        familyMembersApi.getMembers(user.familyId),
        familyInvitationsApi.getInvitations(user.familyId),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.familyId) return;

    // Email is optional, so only validate if provided
    if (inviteEmail.trim() && !inviteEmail.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      const invitation = await familyInvitationsApi.createInvitation(user.familyId, {
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
      });

      // Generate invite link
      const link = `${window.location.origin}/invite?token=${invitation.token}`;
      setInviteLink(link);

      // Reload invitations
      await loadData();

      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '创建邀请失败');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!user?.familyId) return;
    if (!confirm('确定要撤销此邀请吗？')) return;

    try {
      await familyInvitationsApi.revokeInvitation(user.familyId, invitationId);
      await loadData();
    } catch (err: any) {
      setError(err.message || '撤销邀请失败');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: FamilyRole) => {
    if (!user?.familyId) return;

    try {
      await familyMembersApi.updateMemberRole(user.familyId, memberId, { role: newRole });
      await loadData();
    } catch (err: any) {
      setError(err.message || '更新角色失败');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user?.familyId) return;
    if (!confirm(`确定要移除 ${memberName} 吗？`)) return;

    try {
      await familyMembersApi.removeMember(user.familyId, memberId);
      await loadData();
    } catch (err: any) {
      setError(err.message || '移除成员失败');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">家庭成员</h1>
          <p className="text-gray-500 mt-1">管理您的家庭成员和角色</p>
        </div>
        {canManage && (
          <button onClick={() => setShowInviteModal(true)} className="btn-primary">
            ➕ 邀请成员
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Members List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">成员 ({members.length})</h2>
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.userId === user?.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.displayName || member.user.email}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-lg font-bold">
                      {(member.user.displayName || member.user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user.displayName || member.user.email}
                      {isCurrentUser && <span className="ml-2 text-sm text-gray-500">(您)</span>}
                    </p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                    <p className="text-xs text-gray-400">
                      加入时间: {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  {canManage && !isCurrentUser && member.role !== 'OWNER' && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as FamilyRole)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="ADMIN">管理员</option>
                        <option value="MEMBER">成员</option>
                        <option value="VIEWER">访客</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id, member.user.displayName || member.user.email)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations?.filter((i) => !i.usedAt).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            待处理邀请 ({invitations?.filter((i) => !i.usedAt).length})
          </h2>
          <div className="space-y-3">
            {invitations
              ?.filter((i) => !i.usedAt)
              .map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {invitation.email || '未指定邮箱'}
                    </p>
                    <p className="text-sm text-gray-500">
                      角色: {ROLE_LABELS[invitation.role]} | 过期时间:{' '}
                      {new Date(invitation.expiresAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      创建者: {invitation.inviter.displayName || invitation.inviter.email}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      撤销
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">邀请新成员</h2>
            {inviteLink ? (
              <div>
                <p className="text-gray-600 mb-4">邀请链接已创建，您可以复制发送给被邀请人：</p>
                <div className="bg-gray-100 p-3 rounded-lg break-all text-sm mb-4">
                  {inviteLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert('链接已复制到剪贴板');
                  }}
                  className="w-full btn-primary"
                >
                  复制链接
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteLink(null);
                  }}
                  className="w-full mt-3 btn-secondary"
                >
                  关闭
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邀箱地址 (可选)
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                    placeholder="invited@example.com"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as FamilyRole)}
                    className="input"
                  >
                    <option value="MEMBER">成员</option>
                    <option value="ADMIN">管理员</option>
                    <option value="VIEWER">访客</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                    }}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    创建邀请
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
