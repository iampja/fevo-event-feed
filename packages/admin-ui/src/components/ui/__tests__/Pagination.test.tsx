import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} onPageChange={vi.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders page numbers for a small total', () => {
    render(
      <Pagination page={1} totalPages={5} onPageChange={vi.fn()} />
    );

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByLabelText(`Go to page ${i}`)).toBeInTheDocument();
    }
  });

  it('disables the Previous button on the first page', () => {
    render(
      <Pagination page={1} totalPages={5} onPageChange={vi.fn()} />
    );

    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables the Next button on the last page', () => {
    render(
      <Pagination page={5} totalPages={5} onPageChange={vi.fn()} />
    );

    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with the correct page when a page number is clicked', () => {
    const handlePageChange = vi.fn();

    render(
      <Pagination page={2} totalPages={5} onPageChange={handlePageChange} />
    );

    fireEvent.click(screen.getByLabelText('Go to page 4'));
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with page - 1 when Previous is clicked', () => {
    const handlePageChange = vi.fn();

    render(
      <Pagination page={3} totalPages={5} onPageChange={handlePageChange} />
    );

    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with page + 1 when Next is clicked', () => {
    const handlePageChange = vi.fn();

    render(
      <Pagination page={3} totalPages={5} onPageChange={handlePageChange} />
    );

    fireEvent.click(screen.getByLabelText('Next page'));
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });

  it('marks the current page with aria-current', () => {
    render(
      <Pagination page={3} totalPages={5} onPageChange={vi.fn()} />
    );

    const currentPageButton = screen.getByLabelText('Go to page 3');
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');

    const otherPageButton = screen.getByLabelText('Go to page 1');
    expect(otherPageButton).not.toHaveAttribute('aria-current');
  });
});
