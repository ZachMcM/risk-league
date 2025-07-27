import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { RankInfo, ranks, Tier } from "~/types/ranks";
import { propStats } from "~/types/props";
import { QueryClient, QueryKey } from "@tanstack/react-query";
import { MatchStatus } from "~/types/matches";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string): string {
  const parsedDate =
    typeof date === "string"
      ? new Date(date.replace(" ", "T").replace(/(\+\d{2})$/, "$1:00"))
      : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function getRank(eloRating: number): RankInfo {
  for (let i = 0; i < ranks.length; i++) {
    if (eloRating >= ranks[i].minElo && eloRating < ranks[i].maxElo) {
      return {
        eloRating,
        currentRank: ranks[i],
        nextRank: i != ranks.length - 1 ? ranks[i + 1] : null,
        progressToNext:
          (eloRating - ranks[i].minElo) / (ranks[i].maxElo - ranks[i].minElo),
        pointsToNext:
          i != ranks.length - 1 ? ranks[i + 1].minElo - eloRating : 0,
      };
    }
  }

  return {
    eloRating,
    currentRank: ranks[0],
    nextRank: ranks[1],
    progressToNext: 0,
    pointsToNext: ranks[1].minElo - eloRating,
  };
}

export const getStatName = (statId: string) =>
  propStats.find((stat) => stat.id == statId)?.name!;

export function formatCompactNumber(num: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Gets the multiplier for a perfect play parlay given the number of picks
 */
export function getPerfectPlayMultiplier(pickCount: number): number {
  const multipliers: Record<number, number> = {
    2: 3.0,
    3: 5.0,
    4: 10.0,
    5: 20.0,
    6: 37.5,
  };

  return multipliers[pickCount] || 0;
}

/**
 * Gets the multiplier for a flex play given the number of picks and hits
 */
export function getFlexMultiplier(pickCount: number, hitCount: number): number {
  const flexPayouts: Record<string, number> = {
    // 3-pick flex
    "3-3": 2.25,
    "3-2": 1.25,

    // 4-pick flex
    "4-4": 5,
    "4-3": 1.5,

    // 5-pick flex
    "5-5": 10.0,
    "5-4": 2.0,
    "5-3": 0.4,

    // 6-pick flex
    "6-6": 25.0,
    "6-5": 2.0,
    "6-4": 0.4,
  };

  const key = `${pickCount}-${hitCount}`;
  return flexPayouts[key] || 0;
}

/**
 * Gets all possible multipliers for a flex play given the number of picks
 * Useful for displaying all possible outcomes to users
 */
export function getFlexMultiplierTable(
  pickCount: number
): { hits: number; multiplier: number }[] {
  const results: Array<{ hits: number; multiplier: number }> = [];

  // Calculate minimum hits needed (more than half)
  const minHits = Math.floor(pickCount / 2) + 1;

  for (let hits = minHits; hits <= pickCount; hits++) {
    const multiplier = getFlexMultiplier(pickCount, hits);
    if (multiplier > 0) {
      results.push({ hits, multiplier });
    }
  }

  return results.reverse(); // Show perfect score first
}

export function getLeagueEmoji(league: string) {
  if (league == "mlb") {
    return "⚾";
  }
  if (league == "nba" || "mcbb") {
    return "🏀";
  }
  if (league == "nfl" || "cfb") {
    return "🏈";
  }
}

export function getBadgeVariant(
  status: MatchStatus,
  balance: number,
  oppBalance: number
) {
  return status == "not_resolved"
    ? balance > oppBalance
      ? "success"
      : balance < oppBalance
      ? "destructive"
      : "active"
    : status == "win"
    ? "success"
    : status == "loss" || status == "disqualified"
    ? "destructive"
    : "secondary";
}

export function getBadgeText(
  status: MatchStatus,
  balance: number,
  oppBalance: number
) {
  return status == "not_resolved"
    ? balance > oppBalance
      ? "Winning"
      : balance < oppBalance
      ? "Losing"
      : "Tied"
    : status == "win"
    ? "Win"
    : status == "loss"
    ? "Loss"
    : status == "disqualified"
    ? "Disqualified"
    : "Tied";
}

export function invalidateQueries(
  queryClient: QueryClient,
  ...keys: QueryKey[]
) {
  for (const key of keys) {
    queryClient.invalidateQueries({
      queryKey: key,
    });
  }
}
