import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '@/api/timeline';
import { useChildStore } from '@/stores/child.store';
import { Button, Card, Badge, Modal, Loading, EmptyState } from '@/components/ui';
import ImportantDateForm from './ImportantDateForm';
import ImportantDateDeleteModal from './ImportantDateDeleteModal';
import type { ImportantDate } from '@/types';
import { cn } from '@/lib/utils';

export default function ImportantDatesPage() {
  const { children } = useChildStore();

  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [deletingDate, setDeletingDate] = useState<ImportantDate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');

  // Fetch important dates using TanStack Query
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['importantDates', selectedChildId],
    queryFn: () => timelineApi.getImportantDates({ childId: selectedChildId }),
  });

  const importantDates = response?.data || [];

  // Sort dates by nextDate and categorize
  const { sortedDates, upcomingDates, pastDates, urgentDates } = useMemo(() => {
    const sorted = [...importantDates].sort((a, b) => {
      // Always sort by nextDate for upcoming dates
      if (a.nextDate && b.nextDate) {
        return new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime();
      }
      // If no nextDate, sort by original date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const upcoming = sorted.filter(
      (d) => d.daysUntilNext !== undefined && d.daysUntilNext >= 0
    );
    const past = sorted.filter(
      (d) => !d.nextDate || (d.daysUntilNext !== undefined && d.daysUntilNext < 0)
    );
    const urgent = upcoming.filter(
      (d) => d.daysUntilNext !== undefined && d.daysUntilNext <= 7
    );

    return { sortedDates: sorted, upcomingDates: upcoming, pastDates: past, urgentDates: urgent };
  }, [importantDates]);

  const handleCreate = async (data: any) => {
    setSaving(true);
    setError(null);
    try {
      await timelineApi.createImportantDate(data);
      setShowCreateModal(false);
      await refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingDate) return;
    setSaving(true);
    setError(null);
    try {
      await timelineApi.updateImportantDate(editingDate.id, data);
      setShowEditModal(false);
      setEditingDate(null);
      await refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDate) return;
    setDeleting(true);
    setError(null);
    try {
      await timelineApi.deleteImportantDate(deletingDate.id);
      setShowDeleteModal(false);
      setDeletingDate(null);
      await refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (date: ImportantDate) => {
    setEditingDate(date);
    setShowEditModal(true);
  };

  const openDeleteModal = (date: ImportantDate) => {
    setDeletingDate(date);
    setShowDeleteModal(true);
  };

  // Date type configuration with design token colors
  const getDateTypeInfo = (type: string) => {
    const types: Record<string, { icon: string; label: string; color: string; bgGradient: string }> = {
      birthday: {
        icon: '🎂',
        label: 'Birthday',
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        bgGradient: 'from-pink-50 to-rose-50'
      },
      holiday: {
        icon: '🎉',
        label: 'Holiday',
        color: 'bg-red-100 text-red-700 border-red-200',
        bgGradient: 'from-red-50 to-orange-50'
      },
      milestone: {
        icon: '⭐',
        label: 'Milestone',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        bgGradient: 'from-yellow-50 to-amber-50'
      },
      medical: {
        icon: '💊',
        label: 'Medical',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        bgGradient: 'from-blue-50 to-cyan-50'
      },
      school: {
        icon: '📚',
        label: 'School',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        bgGradient: 'from-purple-50 to-violet-50'
      },
      other: {
        icon: '📅',
        label: 'Other',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        bgGradient: 'from-gray-50 to-slate-50'
      },
    };
    return types[type] || types.other;
  };

  const formatDaysUntil = (days: number): string => {
    if (days < 0) return 'Past due';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days left`;
    if (days < 30) return `${Math.floor(days / 7)} week${days > 14 ? 's' : ''} left`;
    return `${Math.floor(days / 30)} month${days > 60 ? 's' : ''} left`;
  };

  const getChildName = (childId: string | undefined, child: any): string | null => {
    if (!childId || !child) return null;
    return child.name;
  };

  const getUrgencyLevel = (daysUntil: number | undefined): { level: string; color: string } => {
    if (daysUntil === undefined) return { level: '', color: '' };
    if (daysUntil === 0) return { level: 'Today', color: 'bg-red-500 text-white' };
    if (daysUntil <= 3) return { level: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' };
    if (daysUntil <= 7) return { level: 'Soon', color: 'bg-orange-100 text-orange-700 border-orange-300' };
    if (daysUntil <= 14) return { level: 'Upcoming', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    return { level: '', color: '' };
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Important Dates</h1>
            <p className="text-gray-500 mt-1">
              {sortedDates.length > 0
                ? `${sortedDates.length} important date${sortedDates.length > 1 ? 's' : ''}`
                : 'No important dates yet'}
            </p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('upcoming')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'upcoming'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Upcoming
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                All Dates
              </button>
            </div>

            {/* Child Filter */}
            {(children || []).length > 0 && (
              <select
                value={selectedChildId || ''}
                onChange={(e) => setSelectedChildId(e.target.value || undefined)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-base"
              >
                <option value="">All Children</option>
                {(children || []).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            )}

            <Button onClick={() => setShowCreateModal(true)}>
              <span className="mr-2">📅</span>
              Add Date
            </Button>
          </div>
        </div>

        {/* Urgent Alerts */}
        {urgentDates.length > 0 && viewMode === 'upcoming' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-900">
                  {urgentDates.length} upcoming date{urgentDates.length > 1 ? 's' : ''} this week
                </p>
                <p className="text-sm text-red-700">
                  {urgentDates.filter(d => d.daysUntilNext === 0).length > 0 && 'Some dates are today! '}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-slide-up">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {sortedDates.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No important dates yet"
          description="Track birthdays, holidays, milestones and more. We'll remind you when dates are coming up."
          action={{
            label: 'Add first date',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="space-y-8 animate-slide-up">
          {/* Upcoming Dates */}
          {upcomingDates.length > 0 && viewMode !== 'all' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>Coming Up</span>
                <Badge variant="secondary">{upcomingDates.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDates.map((date, index) => {
                  const typeInfo = getDateTypeInfo(date.dateType);
                  const childName = getChildName(date.childId || undefined, date.child);
                  const isUrgent = date.daysUntilNext !== undefined && date.daysUntilNext <= 7;
                  const urgency = getUrgencyLevel(date.daysUntilNext);

                  return (
                    <Card
                      key={date.id}
                      className={cn(
                        'cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border-2',
                        isUrgent ? 'border-red-300 bg-gradient-to-br from-red-50/50 to-orange-50/30' : 'border-transparent'
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('text-3xl px-3 py-1 rounded-lg border', typeInfo.color)}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex gap-2">
                          {urgency.level && (
                            <Badge variant={urgency.level === 'Today' ? 'danger' : 'warning'} className="text-xs">
                              {urgency.level}
                            </Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(date);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                            aria-label="Delete date"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <h3
                        className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 cursor-pointer hover:text-primary-600"
                        onClick={() => openEditModal(date)}
                      >
                        {date.title}
                      </h3>

                      {childName && (
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                          <span>👶</span>
                          {childName}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">{typeInfo.label}</span>
                          {date.isRecurring && (
                            <Badge variant="secondary" className="text-xs">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recurring
                            </Badge>
                          )}
                        </div>

                        {date.nextDate && (
                          <div
                            className={cn(
                              'text-sm font-medium',
                              date.daysUntilNext === 0 ? 'text-red-600' :
                              date.daysUntilNext !== undefined && date.daysUntilNext <= 7
                                ? 'text-orange-600'
                                : 'text-gray-700'
                            )}
                          >
                            {formatDaysUntil(date.daysUntilNext || 0)}
                            <span className="text-gray-400 font-normal ml-1">
                              ({new Date(date.nextDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                              })}
                              )
                            </span>
                          </div>
                        )}

                        {date.reminderDays > 0 && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {date.reminderDays}d reminder
                          </p>
                        )}

                        {date.notes && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {date.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <span className="text-xs text-gray-400">
                          Original: {new Date(date.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Dates - only show in All view */}
          {(pastDates.length > 0 || viewMode === 'all') && viewMode === 'all' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>All Dates</span>
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                  {sortedDates.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDates.map((date, index) => {
                  const typeInfo = getDateTypeInfo(date.dateType);
                  const childName = getChildName(date.childId || undefined, date.child);
                  const isPast = !date.nextDate || (date.daysUntilNext !== undefined && date.daysUntilNext < 0);

                  return (
                    <Card
                      key={date.id}
                      className={cn(
                        'cursor-pointer transition-all duration-300 hover:shadow-lg group',
                        isPast ? 'opacity-75 hover:opacity-100' : ''
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('text-3xl px-3 py-1 rounded-lg border', typeInfo.color)}>
                          {typeInfo.icon}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(date);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                          aria-label="Delete date"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <h3
                        className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 cursor-pointer hover:text-primary-600"
                        onClick={() => openEditModal(date)}
                      >
                        {date.title}
                      </h3>

                      {childName && (
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                          <span>👶</span>
                          {childName}
                        </p>
                      )}

                      <p className="text-sm text-gray-600">
                        {date.nextDate
                          ? new Date(date.nextDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : new Date(date.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                      </p>

                      {date.isRecurring && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Recurring
                          </Badge>
                        </div>
                      )}

                      {date.notes && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                          {date.notes}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Important Date"
        size="md"
      >
        <ImportantDateForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
          children={children}
          saving={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDate(null);
        }}
        title="Edit Important Date"
        size="md"
      >
        <ImportantDateForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDate(null);
          }}
          onSave={handleUpdate}
          editingDate={editingDate}
          children={children}
          saving={saving}
        />
      </Modal>

      {/* Delete Modal */}
      <ImportantDateDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDate(null);
        }}
        onConfirm={handleDelete}
        importantDate={deletingDate}
        deleting={deleting}
      />
    </div>
  );
}
