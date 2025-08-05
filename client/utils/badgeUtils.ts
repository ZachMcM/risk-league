import { MatchStatus } from "~/types/match";

/** 
 * Gets the variant for a status badge
 */
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
      : "default"
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