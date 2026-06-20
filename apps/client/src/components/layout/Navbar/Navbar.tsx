import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiBookmark } from 'react-icons/fi';
import { spring, tap } from '@/animations';
import { SearchBar } from '@/components/layout/SearchBar';
import { cn } from '@/utils';

function Wordmark() {
  return (
    <span className="flex select-none items-center gap-2.5">
      <img
        src="/animus-logo.svg"
        alt=""
        aria-hidden
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
      />
      <span className="text-lg font-black leading-none tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
        Animus Play
      </span>
    </span>
  );
}

/**
 * Fixed nav with a top-down gradient scrim. Gradient and controls share one
 * header at z-[200] so page motion layers (Framer) cannot paint over the scrim.
 */
export function Navbar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listActive = location.pathname === '/' && params.get('list') === '1';

  const toggleList = () => {
    if (location.pathname !== '/') {
      navigate('/?list=1');
      return;
    }
    const updated = new URLSearchParams(params);
    if (listActive) updated.delete('list');
    else updated.set('list', '1');
    setParams(updated, { replace: false });
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[200]">
      <div aria-hidden className="nav-gradient absolute inset-x-0 top-0 h-44" />

      <nav className="pointer-events-auto relative z-10 grid h-16 w-full grid-cols-3 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="justify-self-start">
          <Wordmark />
        </div>

        <SearchBar className="w-full max-w-sm justify-self-center" />

        <div className="flex items-center justify-self-end">
          <motion.button
            type="button"
            onClick={toggleList}
            whileTap={tap}
            transition={spring}
            aria-pressed={listActive}
            aria-label="My List"
            className={cn(
              'nav-glass flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              listActive
                ? 'border-brand/25 bg-brand/15 text-content hover:border-brand/30 hover:bg-brand/20'
                : 'text-content/65 hover:border-white/25 hover:bg-white/[0.14] hover:text-content/90',
            )}
          >
            <FiBookmark
              className={cn('h-4 w-4 shrink-0', listActive && 'fill-current text-brand-400')}
              aria-hidden
            />
            <span className="hidden sm:inline">My List</span>
          </motion.button>
        </div>
      </nav>
    </header>
  );
}
