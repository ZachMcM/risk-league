import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { RankInfo, ranks, Tier } from "~/types/ranks";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? 
    new Date(date.replace(' ', 'T').replace(/(\+\d{2})$/, '$1:00')) : 
    date;
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
        pointsToNext: i != ranks.length - 1 ? ranks[i + 1].minElo - eloRating : 0,
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
};

export function rankForeground(tier: Tier) {
  return tier == "Bronze"
    ? "text-amber-600"
    : tier == "Silver"
    ? "text-gray-400"
    : tier == "Gold"
    ? "text-yellow-500"
    : tier == "Platinum"
    ? "text-blue-400"
    : tier == "Diamond"
    ? "text-sky-500"
    : tier == "Master"
    ? "text-purple-500"
    : tier == "Elite"
    ? "text-fuchsia-500"
    : "text-rose-500";
}
