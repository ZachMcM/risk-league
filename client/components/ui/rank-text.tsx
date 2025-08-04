import { Tier } from "~/types/rank";
import { Text } from "./text";
import { cn } from "~/utils/cn";
import { ReactNode } from "react";

export function RankText({
  tier,
  className,
  children
}: {
  tier: Tier;
  className?: string;
  children: ReactNode
}) {
  return (
    <Text
      className={cn(
        tier == "Bronze"
          ? "!text-amber-600"
          : tier == "Silver"
          ? "!text-gray-400"
          : tier == "Gold"
          ? "!text-yellow-500"
          : tier == "Platinum"
          ? "!text-blue-400"
          : tier == "Diamond"
          ? "!text-sky-500"
          : tier == "Master"
          ? "!text-purple-500"
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
