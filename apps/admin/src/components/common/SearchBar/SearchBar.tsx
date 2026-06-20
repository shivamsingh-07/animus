import { useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { cn } from '@/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Glassmorphic search pill mirroring the client's SearchBar. */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search the catalog',
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className={cn(
        'glass-strong group flex h-10 items-center gap-2.5 rounded-xl px-3.5 backdrop-saturate-150 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.14] focus-within:border-white/25 focus-within:bg-white/[0.14]',
        className,
      )}
    >
      <FiSearch
        className="h-4 w-4 shrink-0 text-white/45 transition-colors group-focus-within:text-white/70"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search the catalog"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-400/80 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/20 hover:text-white/80"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
