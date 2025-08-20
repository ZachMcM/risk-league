import { ExtendedMatch, ExtendedMatchUser } from "~/types/match";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { ChartColumnIncreasing } from "~/lib/icons/CharColumnIncreasing";
import { Text } from "../ui/text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { authClient } from "~/lib/auth-client";
import { View } from "react-native";
import ProfileImage from "../ui/profile-image";

export default function MatchStatsDialog({ match }: { match: ExtendedMatch }) {
  const { data } = authClient.useSession();

  const currentMatchUser = match.matchUsers.find(
    (mu: ExtendedMatchUser) => mu.userId === data?.user.id,
  )!;
  const otherMatchUser = match.matchUsers.find(
    (mu: ExtendedMatchUser) => mu.userId !== data?.user.id,
  )!;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 w-10" size="icon" variant="outline">
          <ChartColumnIncreasing size={16} className="text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw] p-4">
        <Text className="font-bold text-xl pt-2 px-2">Match Statistics</Text>
        <View className="">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">
                  <Text className="text-left">Statistic</Text>
                </TableHead>
                <TableHead className="w-1/3 flex flex-row items-center gap-2">
                  <ProfileImage
                    className="h-8 w-8"
                    image={currentMatchUser.user.image}
                    username={currentMatchUser.user.username}
                  />
                  <Text className="text-center">You</Text>
                </TableHead>
                <TableHead className="w-1/3 flex flex-row items-center gap-2">
                  <ProfileImage
                    className="h-8 w-8"
                    image={otherMatchUser.user.image}
                    username={otherMatchUser.user.username}
                  />
                  <Text className="text-center">Opponent</Text>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="flex-none">
              <TableRow className="bg-muted/40">
                <TableCell className="w-1/3">
                  <Text>Parlay Win %</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {currentMatchUser.totalParlays == 0
                      ? "0%"
                      : `${Math.round(
                          (currentMatchUser.parlaysWon /
                            currentMatchUser.totalParlays) *
                            100,
                        )}%`}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {otherMatchUser.totalParlays == 0
                      ? "0%"
                      : `${Math.round(
                          (otherMatchUser.parlaysWon /
                            otherMatchUser.totalParlays) *
                            100,
                        )}%`}
                  </Text>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-1/3">
                  <Text>Parlays Won</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {currentMatchUser.parlaysWon}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {otherMatchUser.parlaysWon}
                  </Text>
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/40">
                <TableCell className="w-1/3">
                  <Text>Parlays Lost</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {currentMatchUser.parlaysLost}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {otherMatchUser.parlaysLost}
                  </Text>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-1/3">
                  <Text>Parlays In Progress</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {currentMatchUser.parlaysInProgress}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    {otherMatchUser.parlaysInProgress}
                  </Text>
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/40">
                <TableCell className="w-1/3">
                  <Text>Payout Potential</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    ${currentMatchUser.payoutPotential.toFixed(2)}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    ${otherMatchUser.payoutPotential.toFixed(2)}
                  </Text>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-1/3">
                  <Text>Total Staked</Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    ${currentMatchUser.totalStaked.toFixed(2)}
                  </Text>
                </TableCell>
                <TableCell className="w-1/3">
                  <Text className="text-center">
                    ${otherMatchUser.totalStaked.toFixed(2)}
                  </Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </View>
        <Text className="text-sm text-muted-foreground text-center mt-4">
          Head-to-head comparison of key match stats
        </Text>
      </DialogContent>
    </Dialog>
  );
}
