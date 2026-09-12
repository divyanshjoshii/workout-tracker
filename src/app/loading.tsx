import { KittyLoaf } from "@/components/kitty/kitty"

// Shown the moment a link is tapped, while the next page renders on the server.
// Without it the old screen stayed frozen until the new one was ready, which is
// most of what made every tap feel slow. Next prefetches this shell, so it
// appears without waiting on the network.
export default function Loading() {
  return (
    <div role="status" className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4 pb-6">
      <span className="sr-only">Loading</span>
      <div className="flex h-24 items-end justify-between pb-4">
        <div className="h-8 w-44 animate-pulse rounded-full bg-muted" />
        <KittyLoaf className="w-24" />
      </div>
      <div className="tile h-44 animate-pulse" />
      <div className="tile h-36 animate-pulse bg-primary/40" />
      <div className="grid grid-cols-2 gap-4">
        <div className="tile h-32 animate-pulse bg-butter/60" />
        <div className="tile h-32 animate-pulse bg-sky/60" />
      </div>
    </div>
  )
}
