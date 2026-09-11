// Shown the moment a link is tapped, while the next page renders on the server.
// Without it the old screen stayed frozen until the new one was ready, which is
// most of what made every tap feel slow. Next prefetches this shell, so it
// appears without waiting on the network.
export default function Loading() {
  return (
    <div role="status" className="flex flex-col p-4 space-y-6 max-w-lg mx-auto pb-24 animate-pulse">
      <span className="sr-only">Loading</span>
      <div className="mt-4 space-y-2">
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="h-4 w-56 rounded-md bg-muted/60" />
      </div>
      <div className="h-28 rounded-xl border border-border bg-card" />
      <div className="h-16 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 rounded-xl border border-border bg-card" />
        <div className="h-24 rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
