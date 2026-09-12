import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ActiveWorkoutBanner } from "@/components/layout/active-workout-banner";
import { ServiceWorker } from "@/components/service-worker";

// Both faces are Japanese fonts from Google Fonts (SIL Open Font License 1.1).
// Loaded through next/font/google they came as 240 slices, and 121 of them,
// about 2 MB, were preloaded on every page. These are just their Latin slices,
// which cover every character the app shows: three files, about 40 KB.

// Titles, the clock and big numbers.
const mochiy = localFont({
  variable: "--font-mochiy",
  src: "./fonts/mochiy-pop-one-latin-400.woff2",
  weight: "400",
});

// Everything else.
const zenMaru = localFont({
  variable: "--font-zen-maru",
  src: [
    { path: "./fonts/zen-maru-gothic-latin-500.woff2", weight: "500" },
    { path: "./fonts/zen-maru-gothic-latin-700.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Mobile-first PWA workout tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Workout",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF4F7" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1219" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mochiy.variable} ${zenMaru.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <ActiveWorkoutBanner />
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  );
}
