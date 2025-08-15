import * as Slot from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";
import { TextClassContext } from "~/components/ui/text";

const badgeVariants = cva(
  "web:inline-flex items-center rounded-full border border-border px-2.5 py-0.5 web:transition-colors web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent/20 bg-primary/20 web:hover:opacity-80 active:opacity-80",
        secondary:
          "border-transparent bg-secondary web:hover:opacity-80 active:opacity-80",
        destructive:
          "border-transparent bg-destructive/20 web:hover:opacity-80 active:opacity-80",
        success:
          "border-transparent bg-success/20 web:hover:opacity-80 active:opacity-80",
        outline: "text-foreground",
        foreground:
          "border-transparent bg-foreground web:hover:opacity-80 active:opacity-80",
        active:
          "border-transparent bg-blue-600/20 web:hover:opacity-80 active:opacity-80",
        background:
          "border-transparent bg-background web:hover:opacity-80 active:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-semibold ", {
  variants: {
    variant: {
      default: "text-primary",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
      success: "text-success",
      outline: "text-foreground",
      foreground: "text-background",
      active: "text-blue-600",
      background: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeProps = ViewProps & {
  asChild?: boolean;
} & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
