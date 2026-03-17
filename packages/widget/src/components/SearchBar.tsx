/** @jsxImportSource preact */

import { useState, useCallback, useRef, useEffect } from 'preact/hooks';

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

export function SearchBar({ onSearch, placeholder = 'Search events, venues, or organizations...' }: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback((e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    setValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(val), 300);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div class="fevo-ef-search-bar">
      <svg class="fevo-ef-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        class="fevo-ef-search-input"
        placeholder={placeholder}
        value={value}
        onInput={handleInput}
      />
      {value && (
        <button class="fevo-ef-search-clear" onClick={handleClear} aria-label="Clear search">
          &#x2715;
        </button>
      )}
    </div>
  );
}
