import { ranks } from "../types/ranks";

export function findNextRank(points: number) {
  for (let i = 0; i < ranks.length; i++) {
    if (points >= ranks[i].minPoints && points < ranks[i].maxPoints) {
      return i != ranks.length - 1 ? ranks[i + 1] : null;
    }
  }

  return null;
}
