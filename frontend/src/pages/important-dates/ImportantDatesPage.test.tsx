/**
 * ImportantDatesPage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import ImportantDatesPage from './ImportantDatesPage';
import type { ImportantDate } from '@/types';
import { useQuery } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock child store
const mockChildren = [
  { id: 'child1', name: 'Baby One', avatar: null, birthDate: '2023-01-01', gender: 'male', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'child2', name: 'Baby Two', avatar: null, birthDate: '2024-01-01', gender: 'female', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

vi.mock('@/stores/child.store', () => ({
  useChildStore: () => ({ children: mockChildren }),
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

const mockRefetch = vi.fn();

describe('ImportantDatesPage', () => {
  const mockImportantDates: ImportantDate[] = [
    {
      id: '1',
      familyId: 'family1',
      childId: 'child1',
      child: mockChildren[0],
      title: 'First Birthday',
      date: '2024-01-01',
      dateType: 'birthday',
      isRecurring: true,
      reminderDays: 7,
      notes: 'Plan a party!',
      nextDate: '2025-01-01',
      daysUntilNext: 30,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      familyId: 'family1',
      childId: 'child1',
      child: mockChildren[0],
      title: 'Vaccination',
      date: '2024-02-01',
      dateType: 'medical',
      isRecurring: false,
      reminderDays: 3,
      notes: '6-month vaccination',
      nextDate: '2024-02-01',
      daysUntilNext: -50,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockReturnValue({
      data: { data: mockImportantDates },
      isLoading: false,
      refetch: mockRefetch,
    } as any);
  });

  it('should render page header', () => {
    render(<ImportantDatesPage />);

    expect(screen.getByRole('heading', { name: 'Important Dates' })).toBeVisible();
    expect(screen.getByText('2 important dates')).toBeVisible();
  });

  it('should show add date button', () => {
    render(<ImportantDatesPage />);

    expect(screen.getByRole('button', { name: /Add Date/ })).toBeVisible();
  });

  it('should render child filter', () => {
    render(<ImportantDatesPage />);

    expect(screen.getByRole('combobox', { name: '' })).toBeVisible();
    expect(screen.getByText('All Children')).toBeVisible();
    expect(screen.getAllByText('Baby One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baby Two').length).toBeGreaterThan(0);
  });

  it('should render upcoming dates section', () => {
    render(<ImportantDatesPage />);

    expect(screen.getByText('Coming Up')).toBeVisible();
    expect(screen.getByText('First Birthday')).toBeVisible();
  });

  it('should render date cards with correct information', () => {
    render(<ImportantDatesPage />);

    // Check birthday date is displayed
    expect(screen.getByText('First Birthday')).toBeVisible();
    expect(screen.getByText('Birthday')).toBeVisible();
    expect(screen.getByText(/month left|days left/)).toBeVisible();
  });

  it('should show urgent alert for upcoming dates', async () => {
    const urgentDates: ImportantDate[] = [
      {
        ...mockImportantDates[0],
        daysUntilNext: 3,
        nextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    vi.mocked(useQuery).mockReturnValue({
      data: { data: urgentDates },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    render(<ImportantDatesPage />);

    await waitFor(() => {
      expect(screen.getByText(/upcoming date/)).toBeVisible();
    });
  });

  it('should show empty state when no dates', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      refetch: mockRefetch,
    } as any);

    render(<ImportantDatesPage />);

    expect(screen.getAllByText('No important dates yet').length).toBeGreaterThan(0);
    expect(screen.getByText(/Track birthdays, holidays, milestones and more/)).toBeVisible();
  });

  it('should show loading state', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetch,
    } as any);

    render(<ImportantDatesPage />);

    // Loading component should be shown
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeVisible();
  });

  it('should open create modal when add button clicked', async () => {
    const user = userEvent.setup();
    render(<ImportantDatesPage />);

    await user.click(screen.getByRole('button', { name: /Add Date/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Add Important Date' })).toBeVisible();
    });
  });

  it('should toggle between upcoming and all views', async () => {
    const user = userEvent.setup();
    render(<ImportantDatesPage />);

    // Click "All Dates" button
    const allDatesButton = screen.getByRole('button', { name: 'All Dates' });
    await user.click(allDatesButton);

    await waitFor(() => {
      expect(screen.getByText('All Dates')).toBeVisible();
    });
  });

  it('should filter dates by child', async () => {
    const user = userEvent.setup();
    render(<ImportantDatesPage />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'child1');

    await waitFor(() => {
      expect(select).toHaveValue('child1');
    });
  });
});
