/** Formats a movie label as `Title (Year)`. */
export function formatMovieTitle(movie: { title: string; year: number }): string {
  return `${movie.title} (${movie.year})`;
}

/** Formats a number of seconds as `m:ss` (or `h:mm:ss` past an hour). */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  }
  return `${minutes}:${paddedSecs}`;
}

/** Renders a score with a single decimal, e.g. 8 → "8.0". */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
