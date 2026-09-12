import type { ReactNode } from "react"

// The title block every tab opens with: a display-face heading, an optional
// line under it, and room on the right for an action or a kitty.
export function PageHeader({ title, description, aside }: { title: ReactNode; description?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pt-6">
      <div className="min-w-0">
        <h1 className="font-display text-title">{title}</h1>
        {description && <p className="mt-1.5 text-sm font-bold text-muted-foreground">{description}</p>}
      </div>
      {aside}
    </header>
  )
}
