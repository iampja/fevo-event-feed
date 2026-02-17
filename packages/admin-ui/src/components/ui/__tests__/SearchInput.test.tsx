import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchInput } from '@/components/ui/SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <SearchInput value="" onChange={vi.fn()} placeholder="Find events..." />
    );

    expect(screen.getByPlaceholderText('Find events...')).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(<SearchInput value="test query" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('debounces the onChange callback', async () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'hello' } });

    // onChange should NOT have been called yet (debounce pending)
    expect(handleChange).not.toHaveBeenCalled();

    // Advance timers past the debounce period
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('hello');
  });

  it('does not call onChange before debounce period elapses', () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} debounceMs={500} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    // Advance partially - should not have fired yet
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(handleChange).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should only be called once with the final value
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('abc');
  });

  it('shows the clear button when there is a value', () => {
    render(<SearchInput value="something" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('does not show the clear button when value is empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('calls onChange immediately with empty string when clear is clicked', () => {
    const handleChange = vi.fn();
    render(<SearchInput value="test" onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('Clear search'));

    // handleClear calls onChange('') directly, no debounce
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('has the correct aria-label matching the placeholder', () => {
    render(
      <SearchInput value="" onChange={vi.fn()} placeholder="Search events" />
    );

    const input = screen.getByLabelText('Search events');
    expect(input).toBeInTheDocument();
  });
});
