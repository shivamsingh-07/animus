import { FiCheck } from 'react-icons/fi';

export function TrackList({
  title,
  options,
  current,
  format,
  onSelect,
}: {
  title: string;
  options: readonly number[];
  current: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="min-w-[8rem]">
      <p className="px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/50">
        {title}
      </p>
      <div className="max-h-[11.25rem] overflow-y-auto">
        {options.map((option) => {
          const selected = option === current;
          return (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => onSelect(option)}
              className="menu-item"
            >
              <span className="truncate">{format(option)}</span>
              {selected && <FiCheck className="h-4 w-4 shrink-0 text-brand-400" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
