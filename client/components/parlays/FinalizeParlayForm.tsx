import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import moment from "moment";
import { Fragment, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { FakeCurrencyInput } from "react-native-currency-input";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import FlexPlayOutcomes from "~/components/parlays/FlexPlayOutcomes";
import { useCreateParlay } from "~/components/providers/CreateParlayProvider";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import ModalContainer from "~/components/ui/modal-container";
import PlayerImage from "~/components/ui/player-image";
import { Text } from "~/components/ui/text";
import { postParlay } from "~/endpoints";
import { MIN_STAKE_PCT } from "~/lib/config";
import { CircleMinus } from "~/lib/icons/CircleMinus";
import { Prop } from "~/types/prop";
import { cn } from "~/utils/cn";
import {
  getFlexMultiplier,
  getPerfectPlayMultiplier,
} from "~/utils/multiplierUtils";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

export default function FinalizeParlayForm({
  balance,
  matchId,
  dynastyLeagueId,
}: {
  balance: number;
  matchId?: number;
  dynastyLeagueId?: number;
}) {
  const { picks, clearParlay } = useCreateParlay();

  const minStake = Math.round(balance * MIN_STAKE_PCT);

  const [stake, setStake] = useState<number | null>(minStake);
  const [type, setType] = useState("perfect");
  const [formError, setFormError] = useState<null | string>(null);

  useEffect(() => {
    if (formError) {
      if (stake) {
        if (stake <= balance && stake >= minStake) {
          setFormError(null);
        }
      }
    } else {
      if (stake) {
        if (stake > balance) {
          const err = `Balance is not enough to place this stake. Maximum stake is ${balance}`;

          setFormError(err);
          return;
        }
        if (stake < minStake) {
          const err = `Your stake must be at least $${minStake}`;
          setFormError(err);
          return;
        }
      }
    }
  }, [formError, stake]);

  const { mutate: createParlay, isPending: isCreatingParlayPending } =
    useMutation({
      mutationFn: async () => {
        const parlay = {
          type,
          stake: stake!,
          picks,
        };

        if (matchId) {
          return await postParlay({ parlay, matchId });
        } else {
          return await postParlay({ parlay, dynastyLeagueId });
        }
      },
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: ({ parlayId }) => {
        toast.success("Parlay Successfully created", {
          position: "top-center",
        });
        if (router.canDismiss()) {
          router.dismissAll();
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          if (matchId) {
            router.navigate({
              pathname: "/match/[matchId]/parlays/[parlayId]",
              params: { matchId: matchId, parlayId },
            });
          } else {
            router.navigate({
              pathname: "/dynastyLeague/[dynastyLeagueId]/parlays/[parlayId]",
              params: { dynastyLeagueId: dynastyLeagueId!, parlayId },
            });
          }
        }
      },
    });

  function handleSubmitParlay() {
    if (!stake) {
      toast.error("You must input a stake");
      return;
    }
    if (stake > balance) {
      const err = `Balance is not enough to place this stake. Maximum stake is ${balance}`;

      toast.error(err);
      setFormError(err);
      return;
    }
    if (stake < minStake) {
      const err = `Your stake must be at least $${minStake}`;
      toast.error(err);
      setFormError(err);
      return;
    }
    createParlay();
  }

  const insets = useSafeAreaInsets();

  return (
    <ModalContainer>
      <View className="flex flex-1 flex-col">
        <View className="flex flex-row items-center justify-between py-6 px-4">
          <View className="flex flex-row items-center gap-2">
            <Text className="font-bold text-lg">Current Parlay</Text>
            <Text className="font-semibold text-muted-foreground text-lg">
              {picks.length} prop{picks.length > 1 ? "s" : ""} selected
            </Text>
          </View>
          <Button
            onPress={() => clearParlay()}
            variant="foreground"
            size="sm"
            className="rounded-full h-10 px-4"
          >
            <Text>Clear all</Text>
          </Button>
        </View>
        <Tabs value={type} onValueChange={setType}>
          <TabsList>
            <TabsTrigger value="perfect">
              <Text>Perfect</Text>
            </TabsTrigger>
            <TabsTrigger value="flex">
              <Text>Flex</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollView
          contentContainerClassName="flex-grow py-6"
          className="flex flex-1 w-full px-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex flex-col gap-4">
            {picks.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  {picks.map((pick, index) => (
                    <PickEntryCard
                      pick={pick}
                      isLast={index == picks.length - 1}
                      key={pick.prop.id}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
            {(type == "perfect" ? picks.length >= 2 : picks.length >= 3) ? (
              <Fragment>
                <Card
                  className={cn("w-full", formError && "border-destructive")}
                >
                  <CardContent className="flex flex-col gap-4 p-4">
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-1 flex-col gap-1 items-start">
                        <Label>Stake</Label>
                        <FakeCurrencyInput
                          value={stake}
                          onChangeValue={setStake}
                          prefix="$"
                          placeholder="$20.00"
                          delimiter=","
                          separator="."
                          precision={2}
                          style={{
                            color: "hsl(223.8136 0.0004% 98.0256%)",
                            fontWeight: 500,
                          }}
                          caretColor="hsl(324.9505 80.8% 50.9804%)"
                          placeholderTextColor="hsl(223.8136 0% 63.0163%)"
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View className="flex flex-1 flex-col gap-1">
                        <Label>To Win</Label>
                        <Text className="text-xl font-medium">
                          $
                          {stake != null
                            ? (
                                (type == "flex"
                                  ? getFlexMultiplier(
                                      picks.length,
                                      picks.length
                                    )
                                  : getPerfectPlayMultiplier(picks.length)) *
                                stake
                              ).toFixed(2)
                            : "0.00"}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <Text className="font-bold text-lg">Payout breakdown</Text>
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-muted-foreground font-medium text-start">
                        Ways to win
                      </Text>
                      <Text className="text-muted-foreground font-medium text-start">
                        Payout
                      </Text>
                    </View>
                    {type == "perfect" ? (
                      <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row items-center gap-2">
                          <Text className="font-semibold text-lg">
                            {picks.length} out of {picks.length} Correct
                          </Text>
                          <View className="bg-primary/10 py-1 px-2 rounded-lg">
                            <Text className="font-semibold text-primary">
                              {getPerfectPlayMultiplier(picks.length).toFixed(
                                2
                              )}
                              x
                            </Text>
                          </View>
                        </View>
                        <Text className="font-semibold text-lg">
                          $
                          {stake
                            ? (
                                stake * getPerfectPlayMultiplier(picks.length)
                              ).toFixed(2)
                            : "0.00"}
                        </Text>
                      </View>
                    ) : (
                      <FlexPlayOutcomes length={picks.length} stake={stake} />
                    )}
                  </CardContent>
                </Card>
              </Fragment>
            ) : (
              <View className="flex flex-col gap-4 p-4 items-center">
                <View className="flex flex-col gap-4 items-center">
                  <View className="flex flex-col gap-1 items-center">
                    <Text className="font-bold text-2xl text-center">
                      Not enough picks
                    </Text>
                    <Text className="font-semibold text-muted-foreground text-center max-w-sm">
                      {type == "perfect"
                        ? "You need at least 2 picks for a perfect play"
                        : "You need at least 3 picks for a flex play"}
                    </Text>
                  </View>
                  <Button
                    size="sm"
                    onPress={() => {
                      if (matchId) {
                        router.navigate({
                          pathname: "/match/[matchId]",
                          params: { matchId: matchId },
                        });
                      } else {
                        router.navigate({
                          pathname: "/dynastyLeague/[dynastyLeagueId]",
                          params: { dynastyLeagueId: dynastyLeagueId! },
                        });
                      }
                    }}
                    variant="foreground"
                  >
                    <Text className="font-semibold">Add Picks</Text>
                  </Button>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        {(type == "perfect" ? picks.length >= 2 : picks.length >= 3) && (
          <View
            className="flex flex-col items-center gap-4 p-4 border-t border-border"
            style={{
              marginBottom: insets.bottom,
            }}
          >
            <View className="flex flex-col gap-1 items-center">
              <View className="flex flex-row items-center gap-2">
                <Text
                  className={cn(
                    "font-semibold text-lg",
                    formError && "text-destructive"
                  )}
                >
                  Balance:
                </Text>
                <Text
                  className={cn(
                    "font-semibold text-lg",
                    formError
                      ? "text-destructive"
                      : stake && stake != 0 && "line-through"
                  )}
                >
                  ${balance.toFixed(2)}
                </Text>
                <Text className="font-semibold text-lg">
                  {!formError && stake
                    ? `$ ${(balance - stake).toFixed(2)}`
                    : ""}
                </Text>
              </View>
              {formError && (
                <Text className="font-semibold text-sm text-destructive text-center">
                  {formError}
                </Text>
              )}
            </View>
            <Button
              onPress={handleSubmitParlay}
              disabled={isCreatingParlayPending}
              className="w-full flex flex-row items-center gap-2"
            >
              <Text className="font-bold">Submit Parlay</Text>
              {isCreatingParlayPending && (
                <ActivityIndicator className="text-foreground" />
              )}
            </Button>
          </View>
        )}
      </View>
    </ModalContainer>
  );
}

export function PickEntryCard({
  pick,
  isLast,
}: {
  pick: { prop: Prop; choice: string };
  isLast?: boolean;
}) {
  const { isPropPicked, getPickChoice, updatePick, addPick, removePick } =
    useCreateParlay();
  const { prop } = pick;

  return (
    <View
      className={cn(
        "flex flex-row items-center justify-between border-border py-4 mx-4",
        !isLast && "border-b"
      )}
    >
      <View className="flex flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            removePick(prop.id);
          }}
        >
          <CircleMinus className="text-destructive" size={20} />
        </Pressable>
        <PlayerImage image={pick.prop.player.image} />
        <View className="flex flex-col gap-1">
          <Text className="font-bold">{prop.player.name}</Text>
          <Text className="font-semibold text-muted-foreground text-sm">
            {prop.game.homeTeamId == prop.player.teamId
              ? `@ ${
                  prop.game.awayTeam.abbreviation ?? prop.game.awayTeam.fullName
                }`
              : `vs ${
                  prop.game.homeTeam.abbreviation ?? prop.game.homeTeam.fullName
                }`}{" "}
            • {moment(prop.game.startTime).format("ddd h:mm A")}
          </Text>
          <Text className="font-bold">
            {prop.line} {prop.statDisplayName}
          </Text>
        </View>
      </View>
      <View className="flex flex-col gap-2">
        {prop.choices.map((choice, i) => (
          <Button
            onPress={() => {
              if (isPropPicked(prop.id)) {
                if (getPickChoice(prop.id) == choice) {
                  return;
                } else {
                  updatePick(prop.id, choice);
                }
              } else {
                addPick({ prop, choice });
              }
            }}
            className={cn(
              "w-20 flex-row justify-center items-center bg-secondary border border-border",
              getPickChoice(prop.id) == choice && "border-primary bg-primary/20"
            )}
            key={`${prop.id}_option_${i}`}
            size="sm"
          >
            <Text className="capitalize font-semibold">{choice}</Text>
          </Button>
        ))}
      </View>
    </View>
  );
}
