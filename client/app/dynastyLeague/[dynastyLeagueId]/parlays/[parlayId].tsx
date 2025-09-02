import { useLocalSearchParams } from "expo-router";
import ParlayPage from "~/components/parlays/ParlayPage";

export default function Parlay() {
  const searchParams = useLocalSearchParams<{
    parlayId: string;
  }>();

  const parlayId = parseInt(searchParams.parlayId);

  return <ParlayPage parlayId={parlayId} />;
}
