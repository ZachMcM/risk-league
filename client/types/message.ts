export type Message = {
  id: number;
  createdAt: string;
  userId: string;
  matchId: number | null;
  dynastyLeagueId: number | null
  content: string;
  user: {
    id: string;
    username: string;
    image: string;
  };
};