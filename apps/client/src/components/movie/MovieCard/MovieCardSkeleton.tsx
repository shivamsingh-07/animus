/** Shimmer placeholder matching the MovieCard footprint for loading grids. */
export function MovieCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card">
      <div className="aspect-[2/3] w-full bg-surface" />
      <div className="shimmer-overlay" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-content/10" />
        <div className="h-2.5 w-1/2 rounded bg-content/10" />
      </div>
    </div>
  );
}
