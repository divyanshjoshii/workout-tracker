import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

// The app's mascot, drawn inline so she costs a few kilobytes and no requests.
// An original character: a white kitty with a bow on her left ear (the
// viewer's left), a pink nose, a little ω mouth and blush. Colours come from
// the --kitty-* tokens in globals.css.
//
// Inside <Watchful> she follows the pointer: --look-x and --look-y move her
// eyes, --tilt tips her head, and data-relaxed on the wrapper switches her to
// happy eyes. Outside it those are unset and she simply looks ahead.

type Mood = "open" | "closed" | "happy"

const ink = { stroke: "var(--kitty-ink)", strokeLinecap: "round", strokeLinejoin: "round" } as const
const aroundItself: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" }

// The relaxed classes are spelled out in full each time: Tailwind only generates
// class names it can read whole in the source.

// Features shift by part of the look and the eyes by the rest, so her face
// seems to turn rather than slide.
const follow = (share: number): CSSProperties => ({
  transform: `translate(calc(var(--look-x, 0px) * ${share}), calc(var(--look-y, 0px) * ${share}))`,
  transition: "transform 200ms var(--ease-out-expo)",
})

// Tips her head toward the pointer, pivoting at the neck.
const tilt = (x: number, y: number): CSSProperties => ({
  transform: "rotate(var(--tilt, 0deg))",
  transformBox: "view-box",
  transformOrigin: `${x}px ${y}px`,
  transition: "transform 500ms var(--ease-spring)",
})

// The head in a 100 × 86 box. Every pose places it with a transform.
function Face({ mood = "open", blink = false }: { mood?: Mood; blink?: boolean }) {
  return (
    <g>
      <path
        d="M13 38C10 26 11 14 15 7C17 4 20 4 23 6C28 10 33 15 37 20C45 17.5 55 17.5 63 20C67 15 72 10 77 6C80 4 83 4 85 7C89 14 90 26 87 38C93 46 93 58 88 66C80 78 66 82 50 82C34 82 20 78 12 66C7 58 7 46 13 38Z"
        fill="var(--kitty-fur)"
        strokeWidth={3}
        {...ink}
      />
      <path d="M17 14C18 10 21 10 23 12L31 20C26 22 21 25 17.5 29C15.5 24 15.5 19 17 14Z" fill="var(--kitty-pink)" />
      <path d="M83 14C82 10 79 10 77 12L69 20C74 22 79 25 82.5 29C84.5 24 84.5 19 83 14Z" fill="var(--kitty-pink)" />

      <g style={follow(0.45)}>
        {[25, 75].map((cx) => (
          <ellipse
            key={cx}
            cx={cx}
            cy="62"
            rx="6.5"
            ry="3.6"
            fill="var(--kitty-blush)"
            className="opacity-80 transition-opacity duration-300 group-data-[relaxed=true]/kitty:opacity-100"
          />
        ))}

        {mood === "open" && (
          <>
            <g style={follow(0.55)} className="group-data-[relaxed=true]/kitty:hidden">
              {[35, 65].map((cx) => (
                <g key={cx} className={blink ? "animate-blink" : undefined} style={aroundItself}>
                  <ellipse cx={cx} cy="52" rx="3.4" ry="4.4" fill="var(--kitty-ink)" />
                  <circle cx={cx + 1.2} cy="50.4" r="1.1" fill="#fff" />
                </g>
              ))}
            </g>
            <path
              d="M30 54Q35 48.5 40 54M60 54Q65 48.5 70 54"
              fill="none"
              strokeWidth={2.4}
              className="hidden group-data-[relaxed=true]/kitty:inline"
              {...ink}
            />
          </>
        )}
        {mood === "closed" && (
          <path d="M30 52.5Q35 56.5 40 52.5M60 52.5Q65 56.5 70 52.5" fill="none" strokeWidth={2.4} {...ink} />
        )}
        {mood === "happy" && (
          <path d="M30 54Q35 48.5 40 54M60 54Q65 48.5 70 54" fill="none" strokeWidth={2.4} {...ink} />
        )}

        <ellipse cx="50" cy="59" rx="3.4" ry="2.5" fill="var(--kitty-pink)" strokeWidth={1.6} {...ink} />
        <path d="M44.5 62.5Q47.25 66.5 50 62.5Q52.75 66.5 55.5 62.5" fill="none" strokeWidth={2} {...ink} />
      </g>

      <path d="M3 53L16 55.5M4 62L16 60.5M97 53L84 55.5M96 62L84 60.5" fill="none" strokeWidth={2.2} {...ink} />

      <path d="M24 16C18 7 7 8 9 17C10 24 18 24 24 18Z" fill="var(--kitty-bow)" strokeWidth={2.2} {...ink} />
      <path d="M28 16C34 7 45 8 43 17C42 24 34 24 28 18Z" fill="var(--kitty-bow)" strokeWidth={2.2} {...ink} />
      <path
        d="M26 21.5C22 18.5 21.5 14 25 14.2C25.6 14.2 26 14.7 26 15.2C26 14.7 26.4 14.2 27 14.2C30.5 14 30 18.5 26 21.5Z"
        fill="var(--kitty-pink)"
        strokeWidth={1.8}
        {...ink}
      />
    </g>
  )
}

function Svg({ viewBox, className, children }: { viewBox: string; className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox={viewBox} className={cn("overflow-visible", className)} aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

// Little curved lines beside her when she's content.
function Purr({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g
      transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}
      className="opacity-0 transition-opacity duration-300 group-data-[relaxed=true]/kitty:opacity-100"
    >
      <path d="M0 0Q-6 6 0 12M-7 -4Q-16 6 -7 16" fill="none" strokeWidth={2.2} {...ink} />
    </g>
  )
}

export function KittyFace({ mood = "open", blink = false, className }: { mood?: Mood; blink?: boolean; className?: string }) {
  return (
    <Svg viewBox="0 0 100 86" className={className}>
      <g style={tilt(50, 80)}>
        <Face mood={mood} blink={blink} />
      </g>
    </Svg>
  )
}

// Sitting on an edge with her paws over it and her tail hanging down the front.
// Her paws rest on y = 120 of the 110 × 150 box. Relaxed, she settles lower
// and wider without lifting her paws off the edge.
export function KittySit({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 110 150" className={className}>
      <g
        className="animate-sway group-data-[relaxed=true]/kitty:[animation-duration:1.2s]"
        style={{ transformBox: "view-box", transformOrigin: "84px 112px" }}
      >
        <path d="M84 112C98 114 102 126 98 138C96 144 99 148 104 146" fill="none" strokeWidth={9} {...ink} />
        <path d="M84 112C98 114 102 126 98 138C96 144 99 148 104 146" fill="none" stroke="var(--kitty-fur)" strokeWidth={5} strokeLinecap="round" />
        <path d="M98.6 141.5C98 145.5 100 148 104 146" fill="none" stroke="var(--kitty-bow)" strokeWidth={5} strokeLinecap="round" />
      </g>
      <g
        className="transition-transform duration-500 ease-spring group-data-[relaxed=true]/kitty:[transform:scale(1.06,0.93)]"
        style={{ transformBox: "view-box", transformOrigin: "55px 124px" }}
      >
        <path
          d="M35 72C27 88 27 110 39 118C49 122 71 122 81 118C93 110 93 88 85 72Z"
          fill="var(--kitty-fur)"
          strokeWidth={3}
          {...ink}
        />
        <path d="M52 96C49 92 49 88 52 88.5C53 88.6 53.5 89.3 53.5 90C53.5 89.3 54 88.6 55 88.5C58 88 58 92 55 96L53.5 97.5Z" fill="var(--kitty-pink)" />
        <g style={tilt(55, 80)}>
          <g transform="translate(5 0)">
            <Face blink />
          </g>
        </g>
        {[47, 73].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="118" rx="8.5" ry="5.8" fill="var(--kitty-fur)" strokeWidth={2.6} {...ink} />
            <path d={`M${cx - 2.5} 121V118M${cx + 2.5} 121V118`} fill="none" strokeWidth={1.6} {...ink} />
          </g>
        ))}
      </g>
      <Purr x={22} y={92} />
      <Purr x={96} y={78} flip />
    </Svg>
  )
}

// Holding a little dumbbell under her chin.
export function KittyLift({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 120 104" className={className}>
      <g style={tilt(60, 82)}>
        <g transform="translate(10 0)">
          <Face blink />
        </g>
      </g>
      <rect x="20" y="83" width="80" height="7" rx="3.5" fill="var(--kitty-fur)" strokeWidth={2.4} {...ink} />
      <rect x="6" y="71" width="15" height="31" rx="6" fill="var(--butter)" strokeWidth={2.6} {...ink} />
      <rect x="99" y="71" width="15" height="31" rx="6" fill="var(--sky)" strokeWidth={2.6} {...ink} />
      <ellipse cx="44" cy="86.5" rx="9" ry="7" fill="var(--kitty-fur)" strokeWidth={2.6} {...ink} />
      <ellipse cx="76" cy="86.5" rx="9" ry="7" fill="var(--kitty-fur)" strokeWidth={2.6} {...ink} />
      <Purr x={4} y={34} />
      <Purr x={116} y={34} flip />
    </Svg>
  )
}

// Asleep in a loaf, for waiting and empty screens.
export function KittyLoaf({ className }: { className?: string }) {
  return (
    <Svg viewBox="0 0 150 100" className={className}>
      <path d="M22 92C12 64 42 46 84 48C122 50 146 66 138 92Z" fill="var(--kitty-fur)" strokeWidth={3} {...ink} />
      <path d="M134 90C144 74 128 62 116 74" fill="none" strokeWidth={9} {...ink} />
      <path d="M134 90C144 74 128 62 116 74" fill="none" stroke="var(--kitty-fur)" strokeWidth={5} strokeLinecap="round" />
      <g transform="translate(4 26) scale(0.74)">
        <Face mood="closed" />
      </g>
      <ellipse cx="60" cy="92" rx="9" ry="5.5" fill="var(--kitty-fur)" strokeWidth={2.6} {...ink} />
      <ellipse cx="80" cy="92" rx="9" ry="5.5" fill="var(--kitty-fur)" strokeWidth={2.6} {...ink} />
      {[
        { d: "M104 30h7l-7 8h7", delay: "0s" },
        { d: "M118 16h9l-9 10h9", delay: "0.7s" },
        { d: "M134 0h11l-11 12h11", delay: "1.4s" },
      ].map((z) => (
        <path key={z.d} d={z.d} fill="none" strokeWidth={2.4} className="animate-doze" style={{ animationDelay: z.delay }} {...ink} />
      ))}
    </Svg>
  )
}

export function Paw({ filled = false, className }: { filled?: boolean; className?: string }) {
  const paint = filled
    ? { fill: "currentColor" }
    : { fill: "none", stroke: "currentColor", strokeWidth: 1.6 }
  return (
    <Svg viewBox="0 0 24 24" className={className}>
      <path d="M12 13.5c-3.2 0-5.5 2.6-5.5 4.8 0 1.7 1.4 2.7 3 2.7 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.6 0 3-1 3-2.7 0-2.2-2.3-4.8-5.5-4.8z" {...paint} />
      <ellipse cx="5.9" cy="10.4" rx="1.9" ry="2.4" {...paint} />
      <ellipse cx="9.7" cy="6.4" rx="1.9" ry="2.5" {...paint} />
      <ellipse cx="14.3" cy="6.4" rx="1.9" ry="2.5" {...paint} />
      <ellipse cx="18.1" cy="10.4" rx="1.9" ry="2.4" {...paint} />
    </Svg>
  )
}

export function Bow({ color, className }: { color: string; className?: string }) {
  return (
    <Svg viewBox="0 0 36 24" className={className}>
      <path d="M16 11C10 2 1 4 3 12C4 19 11 19 16 14Z" fill={color} strokeWidth={1.8} {...ink} />
      <path d="M20 11C26 2 35 4 33 12C32 19 25 19 20 14Z" fill={color} strokeWidth={1.8} {...ink} />
      <rect x="14.5" y="8.5" width="7" height="7" rx="3.5" fill="var(--kitty-pink)" strokeWidth={1.8} {...ink} />
    </Svg>
  )
}
