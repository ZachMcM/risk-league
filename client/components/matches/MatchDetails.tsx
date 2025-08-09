import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { authClient } from "~/lib/auth-client";
import { AlertTriangle } from "~/lib/icons/AlertTriangle";
import { ChartColumnIncreasing } from "~/lib/icons/CharColumnIncreasing";
import { MessageCircle } from "~/lib/icons/MessageCircle";
import { ExtendedMatch, ExtendedMatchUser } from "~/types/match";
import { getBadgeText, getBadgeVariant } from "~/utils/badgeUtils";
import { Alert, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import ProfileImage from "../ui/profile-image";
import { Text } from "../ui/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function MatchDetails({ match }: { match: ExtendedMatch }) {
  const { data } = authClient.useSession();
  const currentMatchUser = match.matchUsers.find((mu: ExtendedMatchUser) => mu.userId === data?.user.id)!;
  const otherMatchUser = match.matchUsers.find((mu: ExtendedMatchUser) => mu.userId !== data?.user.id)!;

  const minTotalStaked = Math.round(
    parseFloat(process.env.EXPO_PUBLIC_MIN_PCT_TOTAL_STAKED!) *
      currentMatchUser.startingBalance
  );
  const minParlaysReq = parseInt(process.env.EXPO_PUBLIC_MIN_PARLAYS_REQUIRED!);

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

  return (
    <View className="flex flex-col gap-6">
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
        <View className="flex flex-col gap-2 items-center">
          <View className="px-1.5 py-0.5 flex justify-center items-center rounded-full bg-primary">
            <Text className="font-semibold">vs</Text>
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
            <View className="flex flex-row items-center justify-between">
        <Badge className="px-3.5" variant={badgeVariant}>
          <Text className="text-base capitalize">{badgeText}</Text>
        </Badge>
        <View className="flex flex-row items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex flex-row items-center gap-2 rounded-lg"
          >
            <ChartColumnIncreasing size={14} className="text-foreground" />
            <Text className="!text-sm">Stats</Text>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex flex-row items-center gap-2 rounded-lg"
            onPress={() =>
              router.navigate({
                pathname: "/match/[matchId]/messages",
                params: { matchId: match.id },
              })
            }
          >
            <MessageCircle size={14} className="text-foreground" />
            <Text className="!text-sm">Messages</Text>
          </Button>
        </View>
      </View>
      {!match.resolved && (
        <View className="flex flex-col gap-3">
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
        </View>
      )}
    </View>
  );
}

// function MatchUserItem({
//   matchUser,
//   currentUser,
//   otherUserBalance,
// }: {
//   matchUser: ExtendedMatchUser;
//   currentUser: boolean;
//   otherUserBalance: number;
// }) {
//   const badgeVariant = getBadgeVariant(
//     matchUser.status,
//     matchUser.balance,
//     otherUserBalance
//   );
//   const badgeText = getBadgeText(
//     matchUser.status,
//     matchUser.balance,
//     otherUserBalance
//   );

//   return (
//     <View className="flex flex-col gap-6">
//       <View className="flex flex-row items-start justify-between">
//         <View className="flex flex-row items-center gap-4">
//           <ProfileImage
//             image={matchUser.user.image}
//             username={matchUser.user.username}
//           />
//           <View className="flex flex-col gap-1">
//             <Text className="font-semibold text-muted-foreground text-lg">
//               {currentUser ? "You" : "Opponent"}
//             </Text>
//             <View className="flex flex-row items-center gap-2">
//               <RankIcon
//                 tier={matchUser.rankSnapshot.tier}
//                 iconClassName="h-4 w-4"
//                 gradientStyle={{
//                   padding: 5,
//                 }}
//               />
//               <Text className="font-bold text-xl">
//                 {matchUser.user.username}
//               </Text>
//             </View>
//           </View>
//         </View>
//         <Badge className="px-3.5" variant={badgeVariant}>
//           <Text className="text-lg capitalize">{badgeText}</Text>
//         </Badge>
//       </View>
//       <View className="flex flex-row items-center justify-between">
//         <View className="flex flex-col items-center flex-1 w-full">
//           <Text className="font-bold text-2xl">
//             ${matchUser.balance.toFixed(2)}
//           </Text>
//           <Text className="font-medium text-muted-foreground text-sm">
//             Balance
//           </Text>
//         </View>
//         <View className="flex flex-col items-center flex-1 w-full">
//           <Text className="font-bold text-2xl">
//             ${matchUser.payoutPotential.toFixed(2)}
//           </Text>
//           <Text className="font-medium text-muted-foreground text-sm">
//             Payout Potential
//           </Text>
//         </View>
//         <View className="flex flex-col items-center flex-1 w-full">
//           <Text className="font-bold text-2xl">
//             {matchUser.totalParlays == 0
//               ? 0
//               : matchUser.parlaysWon / matchUser.totalParlays}
//             %
//           </Text>
//           <Text className="font-medium text-muted-foreground text-sm">
//             Parlay Win Rate
//           </Text>
//         </View>
//       </View>
//     </View>
//   );
// }
