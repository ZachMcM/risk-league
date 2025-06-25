import { ranks } from "../types/ranks";

export function findRank(eloRating: number) {
  for (let i = 0; i < ranks.length; i++) {
    if (eloRating >= ranks[i].minElo && eloRating <= ranks[i].maxElo) {
      return {
        eloRating,
        currentRank: ranks[i],
        nextRank: i != ranks.length - 1 ? ranks[i + 1] : null,
        progressToNext:
          (eloRating - ranks[i].minElo) / (ranks[i].maxElo - ranks[i].minElo),
      };
    }
  }

  return {
    eloRating,
    currentRank: ranks[0],
    nextRank: ranks[1],
    progressToNext: 0,
  };
};
