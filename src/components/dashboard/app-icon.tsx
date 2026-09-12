import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// A shortcut drawn like an app on a phone's home screen: a squircle with the
// icon, and its name underneath.
export function AppIconFace({ icon: Icon, tone }: { icon: LucideIcon; tone: string }) {
  return (
    <span
      className={cn(
        "press grid aspect-square w-full max-w-[4.25rem] place-items-center rounded-[1.35rem] border-2 border-[rgb(67_34_47/0.06)] shadow-[inset_0_-4px_0_0_rgb(67_34_47/0.08),0_8px_18px_-12px_var(--shadow)] group-active:scale-95",
        tone
      )}
    >
      <Icon className="size-7 transition-transform duration-500 ease-spring group-hover:-rotate-8 group-hover:scale-110" />
    </span>
  )
}

export const appIconClass =
  "group flex flex-col items-center gap-1.5 text-xs font-bold [-webkit-tap-highlight-color:transparent]"

export function AppIcon({ href, label, icon, tone }: { href: string; label: string; icon: LucideIcon; tone: string }) {
  return (
    <Link href={href} className={appIconClass}>
      <AppIconFace icon={icon} tone={tone} />
      {label}
    </Link>
  )
}
