/**
 * Input Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Input } from './Input';

describe('Input Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);

    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<Input error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should render with helper text', () => {
    render(<Input helperText="Enter at least 8 characters" />);

    expect(screen.getByText('Enter at least 8 characters')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should support different input types', () => {
    const { container } = render(
      <>
        <Input type="text" data-testid="text-input" />
        <Input type="email" data-testid="email-input" />
        <Input type="password" data-testid="password-input" />
        <Input type="number" data-testid="number-input" />
      </>
    );

    expect(screen.getByTestId('text-input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('number-input')).toHaveAttribute('type', 'number');
  });

  it('should apply custom className', () => {
    const { container } = render(<Input className="custom-input" />);

    const input = container.querySelector('.custom-input');
    expect(input).toBeInTheDocument();
  });

  it('should support focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(handleFocus).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalled();
  });

  it('should render with left icon', () => {
    render(
      <Input
        iconLeft={<span data-testid="left-icon">@</span>}
        placeholder="Email"
      />
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    render(
      <Input
        iconRight={<span data-testid="right-icon">search</span>}
        placeholder="Search"
      />
    );

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should support controlled input', () => {
    const TestComponent = () => {
      const [value, setValue] = useState('');
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled input"
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByPlaceholderText('Controlled input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(input).toHaveValue('test');
  });

  it('should mark required fields with HTML required attribute', () => {
    render(<Input label="Email" required />);

    expect(screen.getByText(/Email/)).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  describe('Accessibility', () => {
    it('should have proper id and htmlFor connection', () => {
      render(<Input label="Test Label" id="test-input" />);

      const input = screen.getByDisplayValue(''); // Get the input
      const label = screen.getByText('Test Label').closest('label');

      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('should have aria-describedby for helper text', () => {
      render(<Input helperText="Helper text" id="test-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('should have aria-invalid for error state', () => {
      render(<Input error="Error message" id="test-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should pass through required attribute', () => {
      render(<Input required id="test-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });
  });
});
