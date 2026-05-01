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

export function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login page
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors",
                isActive && "text-primary"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
