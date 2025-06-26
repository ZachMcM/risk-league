import { Badge } from "../ui/badge";
import { Text } from "../ui/text";

export default function InProgressBadge({
  opponentBalance,
  balance,
}: {
  opponentBalance: number;
  balance: number;
}) {
  return (
    <Badge
      variant={
        opponentBalance > balance
          ? "destructive"
          : opponentBalance == balance
          ? "secondary"
          : "success"
      }
    >
      <Text className="text-base">
        {opponentBalance > balance
          ? "Losing"
          : opponentBalance == balance
          ? "Tied"
          : "Winning"}
      </Text>
    </Badge>
  );
}
