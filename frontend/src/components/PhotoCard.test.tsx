/**
 * PhotoCard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '@/types';

describe('PhotoCard Component', () => {
  const mockPhoto: Photo = {
    id: 'photo-123',
    familyId: 'family-123',
    childId: 'child-123',
    uploaderId: 'user-123',
    originalKey: 'original.jpg',
    resizedKey: 'resized.jpg',
    thumbKey: 'thumb.jpg',
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
  };

  const mockPhotoUrl = 'https://example.com/resized.jpg';
  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render photo thumbnail', () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockPhotoUrl);
  });

  it('should render loading state when photoUrl is undefined', () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={undefined}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Should show placeholder icon instead of image
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // The SVG placeholder should be present
    const placeholder = document.querySelector('svg.w-12');
    expect(placeholder).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const card = document.querySelector('.group');
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Hover over the card to show the overlay (in test, we can directly click the button)
    const deleteButton = screen.getByText('删除');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockPhoto.id);
  });

  it('should stop propagation when delete button is clicked', async () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText('删除').closest('button');
    fireEvent.click(deleteButton!);

    expect(mockOnDelete).toHaveBeenCalled();
    // onClick should not be called due to stopPropagation
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should display photo date correctly', () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Should display the date (formatted in Chinese locale)
    // The date will be formatted as "1月15日" or similar
    const dateElements = screen.getAllByText(/月/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should use uploadedAt date when takenAt is not available', () => {
    const photoWithoutTakenAt: Photo = {
      ...mockPhoto,
      takenAt: undefined as any,
    };

    render(
      <PhotoCard
        photo={photoWithoutTakenAt}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    // Should still display a date using uploadedAt
    const dateElements = screen.getAllByText(/月/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should have lazy loading attribute on image', () => {
    render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should apply hover classes correctly', () => {
    const { container } = render(
      <PhotoCard
        photo={mockPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const card = container.querySelector('.group');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('group', 'relative', 'cursor-pointer');
  });

  it('should handle different image formats', () => {
    const pngPhoto: Photo = { ...mockPhoto, mimeType: 'image/png' };

    render(
      <PhotoCard
        photo={pngPhoto}
        photoUrl={mockPhotoUrl}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('should have proper alt text for image', () => {
      render(
        <PhotoCard
          photo={mockPhoto}
          photoUrl={mockPhotoUrl}
          onClick={mockOnClick}
          onDelete={mockOnDelete}
        />
      );

      const img = screen.getByRole('img');
      // alt text is the photo date/timestamp
      expect(img).toHaveAttribute('alt');
    });

    it('should have button role for delete action', () => {
      render(
        <PhotoCard
          photo={mockPhoto}
          photoUrl={mockPhotoUrl}
          onClick={mockOnClick}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByText('删除');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle photo with very long date', () => {
      const futurePhoto: Photo = {
        ...mockPhoto,
        takenAt: '2099-12-31T23:59:59Z',
      };

      render(
        <PhotoCard
          photo={futurePhoto}
          photoUrl={mockPhotoUrl}
          onClick={mockOnClick}
          onDelete={mockOnDelete}
        />
      );

      // Should render the component without errors
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });

    it('should handle photo with very old date', () => {
      const oldPhoto: Photo = {
        ...mockPhoto,
        takenAt: '2000-01-01T00:00:00Z',
      };

      render(
        <PhotoCard
          photo={oldPhoto}
          photoUrl={mockPhotoUrl}
          onClick={mockOnClick}
          onDelete={mockOnDelete}
        />
      );

      // Old dates will be formatted as short date (month/day)
      const dateElements = screen.getAllByText(/月/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});
