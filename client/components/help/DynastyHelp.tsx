import { Pressable, View } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Blocks } from "~/lib/icons/Blocks";
import { Clock } from "~/lib/icons/Clock";
import { Gavel } from "~/lib/icons/Gavel";
import { Play } from "~/lib/icons/Play";

import { Banknote, ShieldHalf, Users } from "lucide-react-native";
import { Separator } from "~/components/ui/separator";
import { LEAGUES, MIN_STAKE_PCT } from "~/lib/config";
import { Icon } from "../ui/icon";

export default function DynastyHelp({
  scrollToSection,
  handleSectionLayout,
}: {
  scrollToSection: (sectionKey: string) => void;
  handleSectionLayout: (sectionKey: string, y: number) => void;
}) {
  return (
    <View className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Text className="font-bold text-2xl">Table of Contents</Text>
          <View className="flex flex-col gap-2">
            <Pressable
              onPress={() => scrollToSection("overview")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Icon as={ShieldHalf} className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                Dynasty Overview
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("types")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Play className="text-primary" size={20} />
              <Text className="font-semibold text-primary">League Types</Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("guidelines")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Gavel className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                League Guidelines
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("roles")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Icon as={Users} className="text-primary" size={20} />
              <Text className="font-semibold text-primary">User Roles</Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("parlays")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Blocks className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                Building Parlays
              </Text>
            </Pressable>
            <Separator />
            <Pressable
              onPress={() => scrollToSection("timeline")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Clock className="text-primary" size={20} />
              <Text className="font-semibold text-primary">
                League Timeline
              </Text>
            </Pressable>
            <Pressable
              onPress={() => scrollToSection("admin-cups")}
              className="flex flex-row items-center gap-2 p-2 rounded-lg active:bg-muted"
            >
              <Icon as={Banknote} className="text-primary" size={20} />
              <Text className="font-semibold text-primary">Admin Cups</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("overview", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Icon size={20} as={ShieldHalf} className="text-primary" />
              <Text className="font-bold text-2xl">Dynasty Overview</Text>
            </View>
            <Text className="text-lg text-muted-foreground font-semibold">
              In Dynasty Mode, users can create Leagues invite their friends,
              and whoever ends with the most money wins!
            </Text>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("types", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Play className="text-primary" />
              <Text className="font-bold text-2xl">League Types</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Leagues</Text>
              <Text className="text-muted-foreground font-semibold">
                You can start a match for the following sports leagues;{" "}
                {LEAGUES.slice(0, -1).join(", ") +
                  ", or " +
                  LEAGUES[LEAGUES.length - 1]}
                .
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("guidelines", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Gavel className="text-primary" />
              <Text className="font-bold text-2xl">League Guidelines</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Max Users</Text>
              <Text className="text-muted-foreground font-semibold">
                User created Dynasty Leagues have a max of 50 users.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Invite Only</Text>
              <Text className="text-muted-foreground font-semibold">
                Owners can choose to set a league to invite only at creation, to
                only allow users with an invite link.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Total Staked</Text>
              <Text className="text-muted-foreground font-semibold">
                Users must stake at least this much in total. Set by the owner
                at creation.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Parlays</Text>
              <Text className="text-muted-foreground font-semibold">
                Users must create at least this many parlays. Set by the owner
                at creation.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("roles", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Icon as={Users} size={20} className="text-primary" />
              <Text className="font-bold text-2xl">User Roles</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Owner</Text>
              <Text className="text-muted-foreground font-semibold">
                The owner is the user who created the league. They can invite,
                kick, promote, and demote anyone.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Manager</Text>
              <Text className="text-muted-foreground font-semibold">
                Managers must be promoted by the owner. They have the ability to
                invite users and kick members.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Member</Text>
              <Text className="text-muted-foreground font-semibold">
                Members are users with no permissions. They can be kicked and
                promoted by owners and managers.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("parlays", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Blocks className="text-primary" />
              <Text className="font-bold text-2xl">Building Parlays</Text>
            </View>
            <Text className="text-lg text-muted-foreground font-semibold">
              Parlays also have some guidelines to ensure fairness.
            </Text>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Max Parlay Picks</Text>
              <Text className="text-muted-foreground font-semibold">
                An individual parlay can have at most 6 picks.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Flex Plays</Text>
              <Text className="text-muted-foreground font-semibold">
                Flex plays have lower multipliers but don't require you to hit
                on every pick of the parlay. You must have at least 3 picks in a
                parlay to chosoe the Flex Play option. The multipliers scale
                with pick count.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Perfect Plays</Text>
              <Text className="text-muted-foreground font-semibold">
                Perfect plays have higher multipliers but require you to hit on
                every pick of the parlay. You must have at least 2 picks in a
                parlay to choose the Flex Play option. The multipliers scale
                with pick count.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">Minimum Stake</Text>
              <Text className="text-muted-foreground font-semibold">
                Users must stake {MIN_STAKE_PCT * 100}% of their current balance
                for an individual parlay.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("timeline", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Clock className="text-primary" />
              <Text className="font-bold text-2xl">League Timeline</Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">League Start Date</Text>
              <Text className="text-muted-foreground font-semibold">
                Users cannot place parlays in a league until the start date.
                This is set by the owner at creation.
              </Text>
            </View>
            <View className="flex flex-col gap-1">
              <Text className="font-bold text-xl">League End Date</Text>
              <Text className="text-muted-foreground font-semibold">
                This is when the league officially ends, the leaderboard is
                finalized, and parlays can no longer be made. This is set by the
                owner at creation.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
      <View
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          handleSectionLayout("admin-cups", y);
        }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <View className="flex flex-row items-center gap-2">
              <Icon as={Banknote} size={20} className="text-primary" />
              <Text className="font-bold text-2xl">Admin Cups</Text>
            </View>
            <Text className="text-lg text-muted-foreground font-semibold">
              Admin Cups are Dynasty Leagues created and managed by the Risk
              League team.
            </Text>
            <Text className="text-lg text-muted-foreground font-semibold">
              For any given sports league with games going on there will be an
              Admin League. Admin Leagues have no user limit so anyone can join.
              The winners of an Admin Cup will win a cash prize. More TBD.
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
