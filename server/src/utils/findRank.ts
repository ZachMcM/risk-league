import { ranks } from "../types/ranks";

export function findRank(eloRating: number) {
  for (let i = 0; i < ranks.length; i++) {
    if (eloRating >= ranks[i].minElo && eloRating < ranks[i].maxElo) {
      return ranks[i];
    }
  }

  return null;
}
