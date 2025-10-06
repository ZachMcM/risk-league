import { ranks } from "../types/ranks";

export function findRank(points: number) {
  for (let i = 0; i < ranks.length; i++) {
    if (points >= ranks[i].minPoints && points <= ranks[i].maxPoints) {
      return ranks[i];
    }
  }

  return null;
}
