import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Puffy buttons: a soft lip along the bottom that flattens when pressed, and a
// lighter fill that slides in from the left on hover.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-transparent text-sm font-bold whitespace-nowrap select-none slide-fill press disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_0_rgb(200_51_111/0.3)] active:shadow-[inset_0_-1px_0_0_rgb(200_51_111/0.3)] [--slide:#FFB9D4]",
        outline:
          "border-border bg-card text-foreground shadow-[inset_0_-3px_0_0_var(--lip)] active:shadow-[inset_0_-1px_0_0_var(--lip)] aria-expanded:bg-muted [--slide:var(--muted)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_-3px_0_0_rgb(31_58_95/0.14)] active:shadow-none [--slide:color-mix(in_oklab,var(--sky),var(--foreground)_10%)]",
        ghost:
          "text-foreground aria-expanded:bg-accent [--slide:var(--accent)]",
        destructive:
          "bg-destructive-soft text-destructive [--slide:color-mix(in_oklab,var(--destructive-soft),var(--destructive)_16%)]",
        link: "text-strawberry underline-offset-4 hover:underline [--slide:transparent]",
      },
      size: {
        default:
          "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-xl px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-xl px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 rounded-[1.125rem] px-5 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs": "size-7 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
