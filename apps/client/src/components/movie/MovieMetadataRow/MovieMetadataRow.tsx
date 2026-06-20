import { FiStar } from 'react-icons/fi';
import { formatRating } from '@/utils';

export interface MovieMetadataRowProps {
  rating: number;
  year: number;
  duration?: string;
  maturityRating: string;
  showHd?: boolean;
  variant: 'card' | 'details' | 'overlay';
}

const variantStyles = {
  card: {
    row: 'mt-1.5 flex items-center gap-2 text-xs text-content/75',
    rating: 'flex items-center gap-1 font-semibold text-amber-300',
    icon: 'h-3.5 w-3.5',
    separator: 'text-content/30',
    maturity: 'rounded border border-line/25 px-1.5 py-px text-[0.65rem] font-medium text-content/70',
  },
  details: {
    row: 'mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-content/85',
    rating: 'flex items-center gap-1 font-semibold text-amber-300',
    icon: 'h-4 w-4',
    separator: 'text-content/30',
    maturity: 'rounded border border-content/30 px-1.5 py-px text-xs font-medium',
  },
  overlay: {
    row: 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85',
    rating: 'flex items-center gap-1 font-semibold text-amber-300',
    icon: 'h-4 w-4',
    separator: 'text-white/30',
    maturity: 'rounded border border-white/30 px-1.5 py-px text-xs font-medium',
  },
} as const;

export function MovieMetadataRow({
  rating,
  year,
  duration,
  maturityRating,
  showHd,
  variant,
}: MovieMetadataRowProps) {
  const styles = variantStyles[variant];

  return (
    <div className={styles.row}>
      <span className={styles.rating}>
        <FiStar className={styles.icon} aria-hidden />
        {formatRating(rating)}
      </span>
      <span aria-hidden className={styles.separator}>
        •
      </span>
      <span>{year}</span>
      {duration && (
        <>
          <span aria-hidden className={styles.separator}>
            •
          </span>
          <span>{duration}</span>
        </>
      )}
      <span aria-hidden className={styles.separator}>
        •
      </span>
      <span className={styles.maturity}>{maturityRating}</span>
      {showHd && (
        <>
          <span aria-hidden className={styles.separator}>
            •
          </span>
          <span className={styles.maturity}>HD</span>
        </>
      )}
    </div>
  );
}
