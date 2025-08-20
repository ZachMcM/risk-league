import { Tier } from "~/types/rank";
import { Text } from "./text";
import { cn } from "~/utils/cn";
import { ReactNode } from "react";

export function RankText({
  tier,
  className,
  children,
}: {
  tier: Tier;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Text
      className={cn(
        tier == "Rookie"
          ? "!text-amber-600"
          : tier == "Pro"
          ? "!text-gray-400"
          : tier == "All-Star"
          ? "!text-yellow-500"
          : tier == "Superstar"
          ? "!text-blue-400"
          : tier == "Elite"
          ? "!text-fuchsia-500"
          : "!text-rose-500",
        className
      )}
    >
      {children}
    </Text>
  );
}
