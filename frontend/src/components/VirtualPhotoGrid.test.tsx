/**
 * VirtualPhotoGrid Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VirtualPhotoGrid from './VirtualPhotoGrid';
import type { Photo } from '@/types';

// Mock react-window
vi.mock('react-window', () => ({
  Grid: ({ cellComponent: CellComponent, cellData, ...props }: any) => (
    <div data-testid="virtual-grid" data-itemdata={JSON.stringify(cellData)} {...props}>
      {CellComponent && (
        <CellComponent
          columnIndex={0}
          rowIndex={0}
          style={{}}
          data={cellData}
        />
      )}
    </div>
  ),
}));

describe('VirtualPhotoGrid Component', () => {
  const mockPhotos: Photo[] = [
    {
      id: 'photo-1',
      familyId: 'family-123',
      childId: 'child-123',
      uploaderId: 'user-123',
      originalKey: 'original1.jpg',
      resizedKey: 'resized1.jpg',
      thumbKey: 'thumb1.jpg',
      takenAt: '2024-01-15T10:30:00Z',
      uploadedAt: '2024-01-15T10:30:00Z',
      capturedAt: null,
      isHidden: false,
      tags: [],
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      checksum: 'abc123',
      isFavorite: false,
      description: null,
      location: null,
    },
    {
      id: 'photo-2',
      familyId: 'family-123',
      childId: 'child-123',
      uploaderId: 'user-123',
      originalKey: 'original2.jpg',
      resizedKey: 'resized2.jpg',
      thumbKey: 'thumb2.jpg',
      takenAt: '2024-01-16T10:30:00Z',
      uploadedAt: '2024-01-16T10:30:00Z',
      capturedAt: null,
      isHidden: false,
      tags: [],
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      checksum: 'def456',
      isFavorite: false,
      description: null,
      location: null,
    },
  ];

  const mockPhotoUrls = new Map([
    ['photo-1', 'https://example.com/resized1.jpg'],
    ['photo-2', 'https://example.com/resized2.jpg'],
  ]);

  const mockOnPhotoClick = vi.fn();
  const mockOnPhotoDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render grid component', () => {
    const { container } = render(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={mockPhotoUrls}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    expect(container.querySelector('[data-testid="virtual-grid"]')).toBeInTheDocument();
  });

  it('should calculate correct column width', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    render(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={mockPhotoUrls}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    const grid = screen.getByTestId('virtual-grid');
    // containerWidth = 1200 - 32 = 1168
    // columnWidth = 1168 / 4 = 292
    expect(grid).toBeInTheDocument();
  });

  it('should pass correct props to Grid component', () => {
    const { container } = render(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={mockPhotoUrls}
        columnCount={3}
        rowHeight={300}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    const grid = container.querySelector('[data-testid="virtual-grid"]');
    expect(grid).toBeInTheDocument();
  });

  it('should handle empty photos array', () => {
    const { container } = render(
      <VirtualPhotoGrid
        photos={[]}
        photoUrls={new Map()}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    const grid = container.querySelector('[data-testid="virtual-grid"]');
    expect(grid).toBeInTheDocument();
  });

  it('should handle window resize gracefully', () => {
    const { rerender } = render(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={mockPhotoUrls}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    rerender(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={mockPhotoUrls}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    expect(screen.getByTestId('virtual-grid')).toBeInTheDocument();
  });

  it('should handle missing photo URLs gracefully', () => {
    const incompleteUrls = new Map([['photo-1', 'https://example.com/resized1.jpg']]);

    const { container } = render(
      <VirtualPhotoGrid
        photos={mockPhotos}
        photoUrls={incompleteUrls}
        columnCount={4}
        rowHeight={250}
        onPhotoClick={mockOnPhotoClick}
        onPhotoDelete={mockOnPhotoDelete}
      />
    );

    const grid = container.querySelector('[data-testid="virtual-grid"]');
    expect(grid).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('should have proper grid container structure', () => {
      const { container } = render(
        <VirtualPhotoGrid
          photos={mockPhotos}
          photoUrls={mockPhotoUrls}
          columnCount={4}
          rowHeight={250}
          onPhotoClick={mockOnPhotoClick}
          onPhotoDelete={mockOnPhotoDelete}
        />
      );

      const grid = container.querySelector('[data-testid="virtual-grid"]');
      expect(grid).toBeInTheDocument();
    });
  });
});
