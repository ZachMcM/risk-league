import { Rank } from "./rank";

export type User = {
  id: string;
  username: string;
  image: string | null;
  header: string | null;
  rank: Rank
  nextRank: Rank;
  progressToNextRank: number
};
