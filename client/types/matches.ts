export type MatchListEntity = {
    id: string;
    balance: number;
    status: MatchStatus;
    createdAt: Date;
    eloDelta: number;
    opponentUsername: string;
    opponentId: string;
    opponentImage: string | null;
    opponentBalance: number;
}

export type MatchStatus = "draw" | "in_progress" | "loss" | "win"