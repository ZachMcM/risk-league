import { Pressable, View } from "react-native";
import { authClient } from "~/lib/auth-client";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import { Match, MatchUser } from "~/types/match";
import { Alert, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import ProfileImage from "../ui/profile-image";
import RankIcon from "../ui/RankIcon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { getBadgeText, getBadgeVariant } from "~/utils/badgeUtils";
import { Fragment } from "react";

export default function MatchDetails({ match }: { match: Match }) {
  const { data } = authClient.useSession();
  const currentMatchUserIndex =
    data?.user.id == match.matchUsers[0].user.id ? 0 : 1;
  const currentMatchUser = match.matchUsers[currentMatchUserIndex];
  const otherMatchUser = match.matchUsers[currentMatchUserIndex == 0 ? 1 : 0];

  const minTotalStaked = Math.round(
    parseFloat(process.env.EXPO_PUBLIC_MIN_PCT_TOTAL_STAKED!) *
      currentMatchUser.startingBalance
  );
  const minParlaysReq = parseInt(process.env.EXPO_PUBLIC_MIN_PARLAYS_REQUIRED!);

  return (
    <View className="flex flex-col gap-4">
      <Card>
        <CardContent className="px-4 py-6 flex flex-col gap-6">
          <MatchUserItem
            matchUser={currentMatchUser}
            currentUser={true}
            otherUserBalance={otherMatchUser.balance}
          />
          <Separator />
          <MatchUserItem
            matchUser={otherMatchUser}
            currentUser={false}
            otherUserBalance={currentMatchUser.balance}
          />
        </CardContent>
      </Card>
      {!match.resolved && (
        <Fragment>
          {currentMatchUser.totalStaked < minTotalStaked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Pressable>
                  <Alert variant="destructive">
                    <AlertTriangle className="text-destructive" size={20} />
                    <AlertTitle>{`You need to stake $${
                      minTotalStaked - currentMatchUser.totalStaked
                    } more`}</AlertTitle>
                  </Alert>
                </Pressable>
              </TooltipTrigger>
              <TooltipContent>
                <Text>
                  Must have at least ${minTotalStaked} in total staked
                </Text>
              </TooltipContent>
            </Tooltip>
          )}
          {currentMatchUser.totalParlays < minParlaysReq && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Pressable>
                  <Alert variant="destructive">
                    <AlertTriangle className="text-destructive" size={20} />
                    <AlertTitle>
                      You need to create{" "}
                      {minParlaysReq - currentMatchUser.totalParlays} more
                      parlay
                      {minParlaysReq - currentMatchUser.totalParlays > 1 && "s"}
                    </AlertTitle>
                  </Alert>
                </Pressable>
              </TooltipTrigger>
              <TooltipContent>
                <Text>Must have at least {minParlaysReq} parlays</Text>
              </TooltipContent>
            </Tooltip>
          )}
        </Fragment>
      )}
    </View>
  );
}

function MatchUserItem({
  matchUser,
  currentUser,
  otherUserBalance,
}: {
  matchUser: MatchUser;
  currentUser: boolean;
  otherUserBalance: number;
}) {
  const badgeVariant = getBadgeVariant(
    matchUser.status,
    matchUser.balance,
    otherUserBalance
  );
  const badgeText = getBadgeText(
    matchUser.status,
    matchUser.balance,
    otherUserBalance
  );

  return (
    <View className="flex flex-col gap-6">
      <View className="flex flex-row items-start justify-between">
        <View className="flex flex-row items-center gap-4">
          <ProfileImage
            image={matchUser.user.image}
            username={matchUser.user.username}
          />
          <View className="flex flex-col gap-1">
            <Text className="font-semibold text-muted-foreground text-lg">
              {currentUser ? "You" : "Opponent"}
            </Text>
            <View className="flex flex-row items-center gap-2">
              <RankIcon
                tier={matchUser.rankSnapshot.tier}
                iconClassName="h-4 w-4"
                gradientStyle={{
                  padding: 5,
                }}
              />
              <Text className="font-bold text-xl">
                {matchUser.user.username}
              </Text>
            </View>
          </View>
        </View>
        <Badge className="px-3.5" variant={badgeVariant}>
          <Text className="text-lg capitalize">{badgeText}</Text>
        </Badge>
      </View>
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            ${matchUser.balance.toFixed(2)}
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Balance
          </Text>
        </View>
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            ${matchUser.payoutPotential.toFixed(2)}
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Payout Potential
          </Text>
        </View>
        <View className="flex flex-col items-center flex-1 w-full">
          <Text className="font-bold text-2xl">
            {matchUser.totalParlays == 0
              ? 0
              : matchUser.parlaysWon / matchUser.totalParlays}
            %
          </Text>
          <Text className="font-medium text-muted-foreground text-sm">
            Parlay Win Rate
          </Text>
        </View>
      </View>
    </View>
  );
}
