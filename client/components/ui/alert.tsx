import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";
import { cn } from "~/utils/cn";
import { Text, TextClassContext } from "~/components/ui/text";

const alertVariants = cva(
  "relative w-full bg-card border border-border rounded-2xl border px-4 py-2.5 flex-row items-start gap-3",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const alertTextVariants = cva("font-normal", {
  variants: {
    variant: {
      default: "text-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type AlertProps = React.ComponentProps<typeof View> &
  VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <TextClassContext.Provider
      value={alertTextVariants({
        variant,
        className: "web:pointer-events-none",
      })}
    >
      <View
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn("flex-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn(
        "flex-1 text-muted-foreground text-sm leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertDescription, AlertTitle };
