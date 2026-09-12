"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, List, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Workout", href: "/workout", icon: Dumbbell },
  { name: "Exercises", href: "/exercises", icon: List },
  { name: "Progress", href: "/progress", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Tapping a tab should need no network, so these are fully prefetched, data
// included. Next keeps a full prefetch for five minutes, and any server action
// that changes data clears it. Exercises is left on the default: its favourite
// stars save straight to Supabase, which wouldn't clear the prefetched copy, so
// a star could come back stale. It still shows its skeleton at once.
const FULLY_PREFETCHED = new Set(["/", "/workout", "/progress", "/settings"]);

export function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login page
  if (pathname === "/login") return null;

  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      {/* The dock floats on a sky-blue wave, like a phone's home screen. */}
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] h-14 w-full"
      >
        <path d="M0 22C50 4 100 4 150 20S250 38 300 20S370 2 400 14V60H0Z" fill="var(--sky)" />
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[env(safe-area-inset-bottom)] bg-sky" />

      <nav
        aria-label="Main"
        className="tile pointer-events-auto relative mx-auto mb-[calc(0.625rem+env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-md p-1.5"
      >
        <ul className="relative grid grid-cols-5">
          <li
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 w-1/5 transition-[transform,opacity] duration-500 ease-spring",
              activeIndex < 0 && "opacity-0"
            )}
            style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
          >
            <span className="mx-0.5 block h-full rounded-[1.1rem] bg-primary shadow-[inset_0_-3px_0_0_rgb(200_51_111/0.3)]" />
          </li>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <li key={item.name} className="relative">
                <Link
                  href={item.href}
                  prefetch={FULLY_PREFETCHED.has(item.href) || null}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex h-14 flex-col items-center justify-center gap-1 rounded-[1.1rem] transition-[color,transform] duration-300 ease-spring active:scale-90 [-webkit-tap-highlight-color:transparent]",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-strawberry"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[22px] transition-transform duration-500 ease-spring group-hover:-rotate-8",
                      isActive && "-translate-y-0.5 scale-110"
                    )}
                  />
                  <span className="text-[0.6875rem] leading-none font-bold">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
