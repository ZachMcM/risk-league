import { findNextRank } from "./findNextRank";
import { findRank } from "./findRank";

export function calculateProgression(points: number) {
  const currentRank = findRank(points);
  const nextRank = findNextRank(points);

  if (!currentRank || !nextRank) {
    return null;
  }

  return Math.round(
    ((points - currentRank.minPoints) /
      (nextRank.minPoints - currentRank.minPoints)) *
      100,
  );
}
