import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { familyMembersApi, familyInvitationsApi } from '@/lib/family-api';
import type { FamilyMember, FamilyInvitation, FamilyRole } from '@/types';
import { Loading, Modal, Input, Select, Button } from '@/components/ui';

const ROLE_LABELS: Record<FamilyRole, string> = {
  OWNER: '创建者',
  ADMIN: '管理员',
  MEMBER: '贡献者',
  VIEWER: '查看者',
};

const ROLE_COLORS: Record<FamilyRole, string> = {
  OWNER: 'text-primary bg-primary-container/20',
  ADMIN: 'text-primary bg-primary-container/20',
  MEMBER: 'text-secondary bg-secondary-container/20',
  VIEWER: 'text-tertiary bg-tertiary-container/20',
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
    if (!user?.familyId) {
      setIsLoading(false);
      setError('未找到家庭信息。请创建或加入家庭。');
      return;
    }

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

    if (inviteEmail.trim() && !inviteEmail.includes('@')) {
      setError('请输入有效的电子邮箱地址');
      return;
    }

    try {
      const invitation = await familyInvitationsApi.createInvitation(user.familyId, {
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
      });

      const link = `${window.location.origin}/invite?token=${invitation.token}`;
      setInviteLink(link);
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

  const activeInvitations = invitations?.filter((i) => !i.usedAt) || [];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Hero Header Section */}
      <section className="mb-12 animate-slide-up">
        <h2 className="text-5xl font-headline font-semibold text-on-surface mb-2">家庭空间</h2>
        <p className="font-label text-on-surface-variant tracking-wide uppercase text-sm">管理您家庭的监护人圈子</p>
      </section>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-slide-up">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Member Management */}
        <div className="col-span-1 lg:col-span-8 space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          
          {/* Invite Action Card */}
          {canManage && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-outline-variant/10">
              <div className="flex gap-6 items-center">
                <div className="w-24 h-24 bg-surface-container-high rounded-lg flex items-center justify-center p-2 shrink-0">
                  <div className="w-full h-full bg-white rounded-sm flex items-center justify-center border border-outline-variant/10">
                    <span className="material-symbols-outlined text-4xl text-rose-900" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-1">邀请新成员</h3>
                  <p className="text-on-surface-variant text-sm font-label max-w-xs">通过唯一的二维码或邀请链接共享安全访问权限。代码在 24 小时后过期。</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="px-8 py-3 w-full md:w-auto bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-label text-xs font-bold uppercase tracking-widest shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  邀请
                </button>
              </div>
            </div>
          )}

          {/* Member List */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline text-2xl font-semibold">活跃监护人</h3>
              <span className="font-label text-xs uppercase font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                {members.length} 位成员
              </span>
            </div>
            
            <div className="space-y-4">
              {members.map((member) => {
                const isCurrentUser = member.userId === user?.id;
                return (
                  <div key={member.id} className="bg-surface-container-lowest p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md transition-shadow border border-outline-variant/5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-surface-container flex items-center justify-center text-xl font-bold text-stone-400">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (member.user.displayName || member.user.email)[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-label font-bold text-on-surface flex items-center gap-2">
                          {member.user.displayName || member.user.email}
                          {isCurrentUser && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">您</span>}
                        </h4>
                        <p className="text-xs text-on-surface-variant truncate max-w-[200px] sm:max-w-xs">{member.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pl-18 sm:pl-0 mt-2 sm:mt-0">
                      {canManage && !isCurrentUser && member.role !== 'OWNER' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value as FamilyRole)}
                          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${ROLE_COLORS[member.role]}`}
                        >
                          <option value="ADMIN">管理员</option>
                          <option value="MEMBER">贡献者</option>
                          <option value="VIEWER">查看者</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}
                      
                      {canManage && !isCurrentUser && member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user.displayName || member.user.email)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                          title="移除成员"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending Invitations */}
              {activeInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-surface-container-lowest p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group opacity-70 border border-outline-variant/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-outline">pending</span>
                    </div>
                    <div>
                      <h4 className="font-label font-bold text-on-surface italic">等待接受...</h4>
                      <p className="text-xs text-on-surface-variant truncate max-w-[200px] sm:max-w-xs">邀请已发送至 {invitation.email || 'link'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pl-18 sm:pl-0 mt-2 sm:mt-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${ROLE_COLORS[invitation.role]}`}>
                      {ROLE_LABELS[invitation.role]}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="text-rose-900 font-label text-[10px] uppercase font-bold hover:underline"
                      >
                        撤销
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed & Summary */}
        <div className="col-span-1 lg:col-span-4 space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {/* Permissions Summary Card */}
          <div className="bg-surface-container-highest rounded-xl p-8 border border-outline-variant/5">
            <span className="material-symbols-outlined text-rose-900 mb-4 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <h4 className="font-headline text-lg font-bold mb-2 text-on-surface">安全协作</h4>
            <p className="text-sm text-on-surface-variant font-body leading-relaxed">
              只有管理员可以邀请新成员或导出完整档案。贡献者不能永久删除原始生物特征成长数据。
            </p>
          </div>

          {/* Activity Feed Section */}
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
            <h3 className="font-headline text-xl font-bold mb-8">最近动态</h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-rose-200/50"></div>
              <div className="space-y-10 relative">
                <div className="flex gap-6 items-start">
                  <div className="z-10 w-6 h-6 rounded-full bg-white border-4 border-primary shadow-sm shrink-0"></div>
                  <div>
                    <p className="text-xs font-label uppercase font-bold tracking-widest text-rose-900 mb-1">今天</p>
                    <p className="text-sm font-label text-on-surface">
                      <span className="font-bold">您</span> 登录了相册管理。
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 items-start opacity-70">
                  <div className="z-10 w-6 h-6 rounded-full bg-white border-4 border-secondary shadow-sm shrink-0"></div>
                  <div>
                    <p className="text-xs font-label uppercase font-bold tracking-widest text-secondary mb-1">系统</p>
                    <p className="text-sm font-label text-on-surface">
                      隐私协议验证通过。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="邀请新成员"
        footer={
          !inviteLink ? (
            <>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors"
              >
                取消
              </button>
              <button onClick={handleCreateInvitation} className="btn-primary ml-2">
                生成邀请
              </button>
            </>
          ) : null
        }
      >
        {inviteLink ? (
          <div className="space-y-6">
            <p className="text-sm text-on-surface-variant font-label">
              邀请链接已创建。任何人都可以通过此链接加入您的家庭空间。
            </p>
            <div className="bg-surface-container p-4 rounded-xl break-all text-xs font-bold text-on-surface">
              {inviteLink}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('已复制链接到剪贴板！');
                }}
                className="flex-1 btn-primary flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span> 复制链接
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink(null);
                }}
                className="flex-1 btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateInvitation} className="space-y-6">
            <Input
              label="电子邮箱地址（可选）"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="例如：member@family.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as FamilyRole)}
                options={[
                  { value: 'MEMBER', label: '贡献者' },
                  { value: 'ADMIN', label: '管理员' },
                  { value: 'VIEWER', label: '查看者' },
                ]}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}