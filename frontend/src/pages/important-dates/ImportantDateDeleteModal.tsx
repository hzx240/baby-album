import { Button } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import type { ImportantDate } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  importantDate: ImportantDate | null;
  deleting?: boolean;
}

const getDateTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    birthday: 'Birthday',
    holiday: 'Holiday',
    milestone: 'Milestone',
    other: 'Other',
  };
  return labels[type] || 'Other';
};

const getDateTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    birthday: '🎂',
    holiday: '🎉',
    milestone: '⭐',
    other: '📅',
  };
  return icons[type] || '📅';
};

export default function ImportantDateDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  importantDate,
  deleting = false,
}: Props) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  if (!importantDate) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete this important date? This action cannot be undone.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getDateTypeIcon(importantDate.dateType)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{importantDate.title}</h3>
              <p className="text-sm text-gray-500">{getDateTypeLabel(importantDate.dateType)}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Date: </span>
              {new Date(importantDate.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            {importantDate.child && (
              <p>
                <span className="font-medium">Child: </span>
                {importantDate.child.name}
              </p>
            )}

            {importantDate.notes && (
              <p className="text-gray-500">
                <span className="font-medium">Notes: </span>
                {importantDate.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
