import * as ProgressPrimitive from "@rn-primitives/progress";
import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { cn } from "~/utils/cn";
import { Text } from "./text";

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-foreground/20",
        destructive: "bg-destructive/20",
        success: "bg-success/20",
        primary: "bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const progressIndicatorVariants = cva("h-full", {
  variants: {
    variant: {
      default: "bg-foreground",
      destructive: "bg-destructive",
      success: "bg-success",
      primary: "bg-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const progressTextVariants = cva("font-semibold text-sm text-start", {
  variants: {
    variant: {
      default: "text-foreground",
      destructive: "text-destructive",
      success: "text-success",
      primary: "text-primary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Progress({
  className,
  variant,
  value,
  indicatorClassName,
  showValueText = false,
  max = 100,
  ...props
}: ProgressPrimitive.RootProps & {
  ref?: React.RefObject<ProgressPrimitive.RootRef>;
  indicatorClassName?: string;
  showValueText?: boolean;
  max?: number;
} & VariantProps<typeof progressVariants>) {
  const percentage = ((value ?? 0) / max) * 100;

  return (
    <View className="flex flex-col items-start gap-1 self-stretch w-full">
      <ProgressPrimitive.Root
        className={cn(progressVariants({ variant }), className)}
        {...props}
      >
        <Indicator
          value={percentage}
          className={cn(
            progressIndicatorVariants({ variant }),
            indicatorClassName,
          )}
        />
      </ProgressPrimitive.Root>
      {showValueText && (
        <View className="relative flex w-full flex-row">
          <Text
            style={{
              left: `${Math.max(0, Math.min(percentage - 5, 95))}%`,
            }}
            className={cn(progressTextVariants({ variant }))}
          >
            {value?.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

export { Progress };

function Indicator({
  value,
  className,
}: {
  value: number | undefined | null;
  className?: string;
}) {
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(
          progress.value,
          [0, 100],
          [0, 100],
          Extrapolation.CLAMP,
        )}%`,
        { overshootClamping: true },
      ),
    };
  });

  if (Platform.OS === "web") {
    return (
      <View
        className={cn("h-full w-full flex-1 web:transition-all", className)}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full", className)}
        />
      </View>
    );
  }

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View
        style={indicator}
        className={cn("h-full bg-primary", className)}
      />
    </ProgressPrimitive.Indicator>
  );
}
