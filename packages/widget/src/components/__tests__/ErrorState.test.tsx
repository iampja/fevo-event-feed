/** @jsxImportSource preact */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders the default error message when no message prop is provided', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(
      screen.getByText('Unable to load offers. Please try again.'),
    ).toBeInTheDocument();
  });

  it('renders a custom error message when the message prop is provided', () => {
    render(<ErrorState message="Something went wrong!" onRetry={() => {}} />);
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });

  it('renders a retry button with the text "Retry"', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(button);

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls onRetry each time the retry button is clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(onRetry).toHaveBeenCalledTimes(3);
  });
});
