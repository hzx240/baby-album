import { useEffect, useState } from 'react';
import { useChildStore } from '@/stores/child.store';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui';
import { Loading } from '@/components/ui';
import { ErrorAlert } from '@/components/ui';

export default function ChildrenPage() {
  const { children, fetchChildren, isLoading, error, clearError } = useChildStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    try {
      await useChildStore.getState().createChild({ name: newChildName });
      setNewChildName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create child:', err);
    }
  };

  if (isLoading && children.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">宝贝管理</h1>
          <p className="text-gray-500 mt-1">管理您的宝贝信息</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          ➕ 添加宝贝
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={clearError} />}

      {/* Children List */}
      {children.length === 0 ? (
        <EmptyState
          icon="👶"
          title="还没有添加宝贝"
          description="点击上方按钮添加您的第一个宝贝"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Link
              key={child.id}
              to={`/photos?childId=${child.id}`}
              className="card p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                {child.avatar ? (
                  <img
                    src={child.avatar}
                    alt={child.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
                    {child.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {child.name}
                  </h3>
                  {child.birthDate && (
                    <p className="text-sm text-gray-500">
                      出生: {new Date(child.birthDate).toLocaleDateString()}
                    </p>
                  )}
                  {child.gender && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      {child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '其他'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Child Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">添加宝贝</h2>
            <form onSubmit={handleCreateChild}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="input"
                  placeholder="请输入宝贝姓名"
                  required
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewChildName('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
