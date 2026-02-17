import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from '@/components/ui/Switch';

describe('Switch', () => {
  it('renders in unchecked state', () => {
    render(<Switch checked={false} onChange={vi.fn()} label="Toggle" />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
  });

  it('renders in checked state', () => {
    render(<Switch checked={true} onChange={vi.fn()} label="Toggle" />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value when clicked', () => {
    const handleChange = vi.fn();
    render(<Switch checked={false} onChange={handleChange} label="Toggle" />);

    fireEvent.click(screen.getByRole('switch'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when toggling from checked', () => {
    const handleChange = vi.fn();
    render(<Switch checked={true} onChange={handleChange} label="Toggle" />);

    fireEvent.click(screen.getByRole('switch'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(
      <Switch checked={false} onChange={handleChange} disabled={true} label="Toggle" />
    );

    fireEvent.click(screen.getByRole('switch'));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(
      <Switch checked={false} onChange={vi.fn()} disabled={true} label="Toggle" />
    );

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();
  });

  it('renders the label text', () => {
    render(<Switch checked={false} onChange={vi.fn()} label="Dark mode" />);

    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('does not render a label element when no label prop is provided', () => {
    const { container } = render(
      <Switch checked={false} onChange={vi.fn()} />
    );

    const labels = container.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });

  it('has the switch role for accessibility', () => {
    render(<Switch checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('has aria-checked attribute matching the checked state', () => {
    const { rerender } = render(
      <Switch checked={false} onChange={vi.fn()} />
    );

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<Switch checked={true} onChange={vi.fn()} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('uses the provided id prop', () => {
    render(
      <Switch checked={false} onChange={vi.fn()} id="my-switch" label="My Switch" />
    );

    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('id', 'my-switch');
  });
});
