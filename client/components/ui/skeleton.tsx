import * as React from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { cn } from "~/utils/cn";

const duration = 1000;

function Skeleton({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, "style">) {
  const sv = useSharedValue(1);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(0.5, { duration }), withTiming(1, { duration })),
      -1,
    );
  }, [sv]);

  const opacity = useDerivedValue(() => sv.value);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={style}
      className={cn("rounded-2xl bg-secondary dark:bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
