import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Capacitor, registerPlugin } from "@capacitor/core"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const NativeHapticFeedback = registerPlugin("HapticFeedback")

const triggerHaptic = async () => {
  if (!Capacitor.isNativePlatform()) return

  try {
    await NativeHapticFeedback.impact()
  } catch {
    await Haptics.impact({ style: ImpactStyle.Medium })
  }
}

const buttonVariants = cva(
  "group/button relative isolate cursor-pointer inline-flex shrink-0 items-center justify-center rounded-full! border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[border-color,box-shadow,transform] duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "overflow-hidden border-[color-mix(in_oklch,var(--primary),black_22%)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary),white_10%)_0%,var(--primary)_52%,color-mix(in_oklch,var(--primary),black_12%)_100%)] text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.2),inset_0_-1px_0_rgb(0_0_0_/_0.2),0_1px_2px_rgb(15_23_42_/_0.16)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgb(255_255_255_/_0.1),rgb(255_255_255_/_0.025)_52%,rgb(255_255_255_/_0.04))] before:opacity-0 before:transition-opacity before:duration-200 before:ease-out hover:before:opacity-100 hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.26),inset_0_-1px_0_rgb(0_0_0_/_0.18),0_2px_3px_rgb(15_23_42_/_0.18)] active:shadow-[inset_0_1px_2px_rgb(0_0_0_/_0.2)]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "overflow-hidden border-[color-mix(in_oklch,var(--secondary),var(--foreground)_12%)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--secondary),white_7%)_0%,var(--secondary)_54%,color-mix(in_oklch,var(--secondary),var(--foreground)_5%)_100%)] text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.48),inset_0_-1px_0_rgb(15_23_42_/_0.08),0_1px_2px_rgb(15_23_42_/_0.08)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgb(255_255_255_/_0.1),transparent_48%,rgb(255_255_255_/_0.02))] before:opacity-50 before:transition-opacity before:duration-200 before:ease-out hover:before:opacity-100 hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.58),inset_0_-1px_0_rgb(15_23_42_/_0.07),0_2px_3px_rgb(15_23_42_/_0.1)] aria-expanded:text-secondary-foreground active:shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.1)]",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        negative:
          "overflow-hidden border-[color-mix(in_oklch,var(--destructive),#d94668_60%)] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--destructive),#ffa0b8_62%)_0%,color-mix(in_oklch,var(--destructive),#f45f82_70%)_52%,color-mix(in_oklch,var(--destructive),#dd4668_68%)_100%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.3),inset_0_-1px_0_rgb(120_20_48_/_0.14),0_1px_2px_rgb(15_23_42_/_0.14)] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgb(255_255_255_/_0.16),rgb(255_255_255_/_0.04)_52%,rgb(255_255_255_/_0.07))] before:opacity-0 before:transition-opacity before:duration-200 before:ease-out hover:before:opacity-100 hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.34),inset_0_-1px_0_rgb(120_20_48_/_0.12),0_2px_3px_rgb(15_23_42_/_0.16)] focus-visible:border-[#e75677] focus-visible:ring-[#f78da7]/35 active:shadow-[inset_0_1px_2px_rgb(120_20_48_/_0.16)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2.5 px-5 has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5",
        xs: "h-7 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-2 px-4 text-[0.8rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-3 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9",
        "icon-lg": "size-11",
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
  onClick,
  loading = false,
  disabled,
  children,
  ...props
}) {
  const handleClick = async (event) => {
    try {
      await triggerHaptic();
      console.log("Haptic feedback triggered successfully.");
    } catch {
      // Haptics are unavailable in a regular browser; keep the button usable.
    }

    await onClick?.(event);
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}>
      {loading ? <LoaderCircle className="animate-spin" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants }
