import { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type { ImportantDate, CreateImportantDateRequest, UpdateImportantDateRequest } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateImportantDateRequest | UpdateImportantDateRequest) => Promise<void>;
  editingDate?: ImportantDate | null;
  children: Array<{ id: string; name: string }>;
  saving?: boolean;
}

const dateTypeOptions = [
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'holiday', label: '🎉 Holiday' },
  { value: 'milestone', label: '⭐ Milestone' },
  { value: 'other', label: '📅 Other' },
];

export default function ImportantDateForm({
  isOpen,
  onClose,
  onSave,
  editingDate,
  children,
  saving = false,
}: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [dateType, setDateType] = useState('other');
  const [childId, setChildId] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingDate) {
        setTitle(editingDate.title);
        setDate(new Date(editingDate.date).toISOString().split('T')[0]);
        setDateType(editingDate.dateType);
        setChildId(editingDate.childId || '');
        setReminderEnabled(true);
        setReminderDaysBefore(editingDate.reminderDays || 7);
        setDescription(editingDate.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingDate]);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setDateType('other');
    setChildId('');
    setReminderEnabled(true);
    setReminderDaysBefore(7);
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }

    const data: CreateImportantDateRequest | UpdateImportantDateRequest = {
      title: title.trim(),
      date,
      dateType,
      childId: childId || undefined,
      isRecurring: reminderEnabled,
      reminderDays: reminderEnabled ? reminderDaysBefore : 0,
      notes: description.trim() || undefined,
    };

    try {
      await onSave(data);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Title"
        placeholder="e.g., Birthday, Vaccination"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        required
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Select
        label="Date Type"
        options={dateTypeOptions}
        value={dateType}
        onChange={(e) => setDateType(e.target.value)}
        required
      />

      {(children || []).length > 0 && (
        <Select
          label="Related Child (Optional)"
          options={[
            { value: '', label: 'No specific child' },
            ...(children || []).map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="reminder-enabled"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="reminder-enabled" className="text-sm font-medium text-gray-700">
            Enable reminder
          </label>
        </div>

        {reminderEnabled && (
          <Input
            label="Reminder days before"
            type="number"
            min={0}
            max={365}
            value={reminderDaysBefore}
            onChange={(e) => setReminderDaysBefore(parseInt(e.target.value) || 0)}
            helperText="Remind you this many days before the date"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          placeholder="Add a description for this important date..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editingDate ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
