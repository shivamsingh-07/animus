/** Shimmer skeleton matching the movie details hero layout. */
export function MovieDetailsSkeleton() {
  return (
    <section className="relative isolate min-h-dvh">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface2 via-surface to-background" aria-hidden>
        <div className="shimmer-overlay" aria-hidden />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col justify-end px-4 pb-12 pt-24 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(200px,280px)] lg:items-end lg:gap-10 xl:gap-12">
          <div className="mx-auto aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl bg-content/10 sm:w-48 md:w-52 lg:mx-0 lg:w-56" />

          <div className="min-w-0 space-y-4">
            <div className="h-10 w-4/5 max-w-lg rounded-lg bg-content/10 sm:h-12" />
            <div className="h-5 w-2/5 max-w-xs rounded bg-content/10" />
            <div className="flex gap-3">
              <div className="h-4 w-16 rounded bg-content/10" />
              <div className="h-4 w-12 rounded bg-content/10" />
              <div className="h-4 w-14 rounded bg-content/10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-7 w-20 rounded-full bg-content/10" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full max-w-3xl rounded bg-content/10" />
              <div className="h-3 w-full max-w-2xl rounded bg-content/10" />
              <div className="h-3 w-3/4 max-w-xl rounded bg-content/10" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-12 w-36 rounded-md bg-content/15" />
              <div className="h-12 w-44 rounded-md bg-content/10" />
            </div>
          </div>

          <div className="hidden space-y-5 lg:block">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-16 rounded bg-content/10" />
                <div className="h-3 w-full rounded bg-content/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
