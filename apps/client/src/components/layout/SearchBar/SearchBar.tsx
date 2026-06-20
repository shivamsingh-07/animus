import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils';

interface SearchBarProps {
  className?: string;
}

/**
 * Floating, glassmorphic search pill bound to the URL `?q=` param
 * (shareable / deep-linkable). Typing off the home route navigates home.
 */
export function SearchBar({ className }: SearchBarProps) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => params.get('q') ?? '');

  useEffect(() => {
    const q = params.get('q') ?? '';
    setValue((current) => (current === q ? current : q));
  }, [params]);

  const apply = (next: string) => {
    setValue(next);
    if (location.pathname === '/') {
      const updated = new URLSearchParams(params);
      if (next) updated.set('q', next);
      else updated.delete('q');
      setParams(updated, { replace: true });
    } else {
      navigate(next ? `/?q=${encodeURIComponent(next)}` : '/');
    }
  };

  const clear = () => {
    apply('');
    inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className={cn(
        'nav-glass group flex h-10 items-center gap-2.5 rounded-xl px-3.5 hover:border-white/25 hover:bg-white/[0.14] focus-within:border-white/25 focus-within:bg-white/[0.14]',
        className,
      )}
    >
      <FiSearch
        className="h-4 w-4 shrink-0 text-content/45 transition-colors group-focus-within:text-content/70"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => apply(event.target.value)}
        placeholder="Search films, people, genres"
        aria-label="Search movies"
        className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-muted/80 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-content/45 transition-colors hover:bg-white/25 hover:text-content/80"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
