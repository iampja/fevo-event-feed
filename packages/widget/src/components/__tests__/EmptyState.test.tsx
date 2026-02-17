/** @jsxImportSource preact */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the empty state message', () => {
    render(<EmptyState />);
    expect(
      screen.getByText('No offers available right now. Check back soon.'),
    ).toBeInTheDocument();
  });

  it('renders within a container with the correct class', () => {
    const { container } = render(<EmptyState />);
    expect(
      container.querySelector('.fevo-ef-state-container'),
    ).toBeInTheDocument();
  });

  it('renders an SVG icon', () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render a retry button', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
