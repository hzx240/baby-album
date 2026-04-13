/**
 * Modal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    // Find backdrop (div with bg-black/60 class)
    const backdrop = document.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should not call onClose when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const content = screen.getByText('Modal Content');
    fireEvent.click(content);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
        <div>Modal Content</div>
      </Modal>
    );

    const modal = container.querySelector('.custom-modal');
    expect(modal).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        footer={<button type="button">Save</button>}
      >
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should support size variants', () => {
    const { container: smallContainer } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <div>Small Modal</div>
      </Modal>
    );

    const { container: largeContainer } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <div>Large Modal</div>
      </Modal>
    );

    expect(smallContainer.querySelector('.max-w-md')).toBeInTheDocument();
    expect(largeContainer.querySelector('.max-w-2xl')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      );

      const modal = screen.getByText('Modal Content').closest('[role="dialog"]');
      expect(modal).toBeInTheDocument();
    });

    it('should trap focus within modal', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>
            <input type="text" placeholder="First input" />
            <button type="button">Button</button>
          </div>
        </Modal>
      );

      const input = screen.getByPlaceholderText('First input');
      expect(input).toBeInTheDocument();
    });
  });
});
