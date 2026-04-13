/**
 * ImportantDateForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import ImportantDateForm from './ImportantDateForm';
import type { ImportantDate } from '@/types';
import userEvent from '@testing-library/user-event';

describe('ImportantDateForm', () => {
  const mockChildren = [
    { id: 'child1', name: 'Baby One' },
    { id: 'child2', name: 'Baby Two' },
  ];

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const mockEditingDate: ImportantDate = {
    id: '1',
    familyId: 'family1',
    childId: 'child1',
    child: mockChildren[0] as any,
    title: 'Test Date',
    date: '2024-01-01',
    dateType: 'birthday',
    isRecurring: true,
    reminderDays: 7,
    notes: 'Test notes',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields for new date', () => {
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    expect(screen.getByLabelText(/Title/)).toBeVisible();
    expect(screen.getByLabelText(/^Date$/)).toBeVisible();
    expect(screen.getByLabelText(/Date Type/)).toBeVisible();
  });

  it('should render child selector when children exist', () => {
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    expect(screen.getByLabelText(/Related Child/)).toBeVisible();
  });

  it('should pre-fill form when editing', () => {
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
        editingDate={mockEditingDate}
      />
    );

    expect(screen.getByLabelText(/Title/)).toHaveValue('Test Date');
    expect(screen.getByLabelText(/^Date$/)).toHaveValue('2024-01-01');
  });

  it('should show validation error for empty title', async () => {
    const user = userEvent.setup();
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Create/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a title/)).toBeVisible();
    });
  });

  it('should show validation error for empty date', async () => {
    const user = userEvent.setup();
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    const titleInput = screen.getByLabelText(/Title/);
    await user.type(titleInput, 'Test Title');

    const submitButton = screen.getByRole('button', { name: /Create/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select a date/)).toBeVisible();
    });
  });

  it('should call onSave with correct data', async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);

    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    await user.type(screen.getByLabelText(/Title/), 'New Date');
    await user.type(screen.getByLabelText(/^Date$/), '2024-12-25');
    await user.selectOptions(screen.getByLabelText(/Date Type/), 'holiday');

    const submitButton = screen.getByRole('button', { name: /Create/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Date',
          date: '2024-12-25',
          dateType: 'holiday',
        })
      );
    });
  });

  it('should show reminder settings when enabled', async () => {
    const user = userEvent.setup();
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    const reminderCheckbox = screen.getByLabelText(/Enable reminder/);
    expect(reminderCheckbox).toBeChecked();

    expect(screen.getByLabelText(/Reminder days before/)).toBeVisible();
  });

  it('should hide reminder days input when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    const reminderCheckbox = screen.getByLabelText(/Enable reminder/);
    await user.click(reminderCheckbox);

    await waitFor(() => {
      expect(screen.queryByLabelText(/Reminder days before/)).not.toBeInTheDocument();
    });
  });

  it('should call onClose when cancel clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update button text when editing', () => {
    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
        editingDate={mockEditingDate}
      />
    );

    expect(screen.getByRole('button', { name: 'Update' })).toBeVisible();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    const mockError = new Error('API Error');
    mockError.response = { data: { message: 'Failed to create' } };
    mockOnSave.mockRejectedValue(mockError);

    render(
      <ImportantDateForm
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        children={mockChildren}
      />
    );

    await user.type(screen.getByLabelText(/Title/), 'Test');
    await user.type(screen.getByLabelText(/^Date$/), '2024-12-25');

    const submitButton = screen.getByRole('button', { name: /Create/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create/)).toBeVisible();
    });
  });
});
