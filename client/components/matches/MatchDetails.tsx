import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { toast } from "sonner-native";
import { authClient } from "~/lib/auth-client";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import { MessageCircle } from "~/lib/icons/MessageCircle";
import { ExtendedMatch, ExtendedMatchUser } from "~/types/match";
import { getBadgeText, getBadgeVariant } from "~/utils/badgeUtils";
import { Alert, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import MatchStatsDialog from "./MatchStatsDialog";
import { MIN_PARLAYS_REQUIRED, MIN_PCT_TOTAL_STAKED } from "~/lib/config";
import { Icon } from "../ui/icon";
import { X } from "lucide-react-native";

export default function MatchDetails({ match }: { match: ExtendedMatch }) {
  const { data: currentUserData } = authClient.useSession();
  const currentMatchUser = match.matchUsers.find(
    (mu: ExtendedMatchUser) => mu.userId === currentUserData?.user.id
  )!;
  const otherMatchUser = match.matchUsers.find(
    (mu: ExtendedMatchUser) => mu.userId !== currentUserData?.user.id
  )!;

  const minTotalStaked = Math.round(
    MIN_PCT_TOTAL_STAKED * currentMatchUser.startingBalance
  );

  const badgeVariant = getBadgeVariant(
    currentMatchUser.status,
    currentMatchUser.balance,
    otherMatchUser.balance
  );
  const badgeText = getBadgeText(
    currentMatchUser.status,
    currentMatchUser.balance,
    otherMatchUser.balance
  );

  const [minParlaysAlert, setMinParlaysAlert] = useState(
    currentMatchUser.totalParlays < MIN_PARLAYS_REQUIRED
  );
  const [minTotalStakedAlert, setMinTotalStakedAlert] = useState(
    currentMatchUser.totalStaked < minTotalStaked
  );

  useEffect(() => {
    setMinParlaysAlert(currentMatchUser.totalParlays < MIN_PARLAYS_REQUIRED);
    setMinTotalStakedAlert(currentMatchUser.totalStaked < minTotalStaked);

    return () => {
      setMinParlaysAlert(currentMatchUser.totalParlays < MIN_PARLAYS_REQUIRED);
      setMinTotalStakedAlert(currentMatchUser.totalStaked < minTotalStaked);
    };
  }, [match]);

  return (
    <View className="flex flex-col gap-8">
      <View className="flex flex-col gap-4">
        <View className="flex w-full flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2.5">
            <ProfileImage
              image={currentMatchUser.user.image}
              username={currentMatchUser.user.username}
              className="h-14 w-14"
            />
            <View className="flex flex-col">
              <Text className="font-bold text-2xl">
                ${currentMatchUser.balance.toFixed(2)}
              </Text>
              <Text className="font-semibold text-muted-foreground">You</Text>
            </View>
          </View>
          <View className="flex flex-row items-center gap-2.5">
            <View className="flex flex-col items-end">
              <Text className="font-bold text-2xl">
                ${otherMatchUser.balance.toFixed(2)}
              </Text>
              <Text className="font-semibold text-muted-foreground">
                {otherMatchUser.user.username}
              </Text>
            </View>
            <ProfileImage
              image={otherMatchUser.user.image}
              username={otherMatchUser.user.username}
              className="h-14 w-14"
            />
          </View>
        </View>
        <Badge className="self-start" variant={badgeVariant}>
          <Text className="capitalize text-sm">{badgeText}</Text>
        </Badge>
      </View>
      {(minTotalStakedAlert || minParlaysAlert) && (
        <View className="flex flex-col gap-2">
          {minTotalStakedAlert && (
            <Alert variant="destructive" className="items-center">
              <AlertTriangle className="text-destructive" size={20} />
              <AlertTitle className="text-foreground">
                You need to stake $
                {minTotalStaked - currentMatchUser.totalStaked} more!
              </AlertTitle>
              <Pressable onPress={() => setMinTotalStakedAlert(false)}>
                <Icon as={X} size={16} className="text-muted-foreground" />
              </Pressable>
            </Alert>
          )}
          {minParlaysAlert && (
            <Alert variant="destructive" className="items-center">
              <AlertTriangle className="text-destructive" size={20} />
              <AlertTitle className="text-foreground">
                You need to create{" "}
                {MIN_PARLAYS_REQUIRED - currentMatchUser.totalParlays} more
                parlay
                {MIN_PARLAYS_REQUIRED - currentMatchUser.totalParlays > 1 &&
                  "s"}
                !
              </AlertTitle>
              <Pressable onPress={() => setMinParlaysAlert(false)}>
                <Icon as={X} size={16} className="text-muted-foreground" />
              </Pressable>
            </Alert>
          )}
        </View>
      )}
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-2">
          <MatchStatsDialog match={match} />
          <Button
            className="flex h-9 flex-row items-center gap-2"
            size="sm"
            variant="outline"
            onPress={() =>
              router.navigate({
                pathname: "/match/[matchId]/messages",
                params: { matchId: match.id },
              })
            }
          >
            <Text className="text-sm">Messages</Text>
            <MessageCircle size={16} className="text-foreground" />
          </Button>
        </View>
      </View>
    </View>
  );
}
