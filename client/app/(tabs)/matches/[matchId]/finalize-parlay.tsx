import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { FakeCurrencyInput } from "react-native-currency-input";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import FlexPlayOutcomes from "~/components/parlays/FlexPlayOutcomes";
import { useParlayPicks } from "~/components/providers/ParlayProvider";
import { useSession } from "~/components/providers/SessionProvider";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import ModalContainer from "~/components/ui/modal-container";
import { Text } from "~/components/ui/text";
import { getMatch, postParlay } from "~/endpoints";
import { CircleMinus } from "~/lib/icons/CircleMinus";
import {
  cn,
  getFlexMultiplier,
  getPerfectPlayMultiplier,
  getStatName,
  invalidateQueries,
} from "~/lib/utils";
import { Prop } from "~/types/props";

export default function FinalizeParlay() {
  const { parlayPicks, clearParlay } = useParlayPicks();
  const searchParams = useLocalSearchParams<{ matchId: string }>();
  const matchId = parseInt(searchParams.matchId);

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => await getMatch(matchId),
  });

  const { session } = useSession();

  const userBalance = match?.matchUsers.find(
    (matchUser) => matchUser.user.id == session?.user.id
  )?.balance!;

  const [stake, setStake] = useState<number | null>(0);
  const [type, setType] = useState("perfect");
  const [formError, setFormError] = useState<null | string>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (formError) {
      if (stake) {
        if (stake <= userBalance && stake >= 10) {
          setFormError(null);
        }
      }
    } else {
      if (stake) {
        if (stake > userBalance) {
          const err = `Balance is not enough to place this stake. Maximum stake is ${userBalance}`;

          setFormError(err);
          return;
        }
        if (stake < 10) {
          const err = "Your stake must be at least $10";
          setFormError(err);
          return;
        }
      }
    }
  }, [formError, stake]);

  const { mutate: createParlay, isPending: isCreatingParlayPending } =
    useMutation({
      mutationFn: async () =>
        await postParlay(matchId, {
          type,
          stake: stake!,
          picks: parlayPicks,
        }),
      onError: (err) => {
        toast.error(err.message, {
          position: "bottom-center",
        });
      },
      onSuccess: () => {
        clearParlay();
        invalidateQueries(
          queryClient,
          ["match", matchId],
          ["parlays", matchId, session?.user.id!]
        );
        toast.success("Parlay Successfully created", {
          position: "bottom-center",
        });
        router.replace({
          pathname: "/matches/[matchId]",
          params: { matchId },
        });
      },
    });

  function handleSubmitParlay() {
    if (!stake) {
      toast.error("You must input a stake");
      return;
    }
    if (stake > userBalance) {
      const err = `Balance is not enough to place this stake. Maximum stake is ${userBalance}`;

      toast.error(err);
      setFormError(err);
      return;
    }
    if (stake < 10) {
      const err = "Your stake must be at least $10";
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
        <View className="flex flex-row items-center justify-between p-6">
          <View className="flex flex-row items-center gap-2">
            <Text className="font-bold text-lg">Current Parlay</Text>
            <Text className="font-semibold text-muted-foreground text-lg">
              {parlayPicks.length} prop{parlayPicks.length > 1 ? "s" : ""}{" "}
              selected
            </Text>
          </View>
          <Button
            onPress={() => clearParlay()}
            variant="foreground"
            className="rounded-full"
          >
            <Text>Clear all</Text>
          </Button>
        </View>
        <View className="flex flex-row w-full">
          <Pressable
            onPress={() => setType("perfect")}
            className={cn(
              "flex flex-1 flex-row items-center justify-center border-b border-border pb-4",
              type == "perfect" && "border-primary"
            )}
          >
            <Text className="font-bold text-lg">Perfect Play</Text>
          </Pressable>
          <Pressable
            onPress={() => setType("flex")}
            className={cn(
              "flex flex-1 flex-row items-center justify-center border-b border-border pb-4",
              type == "flex" && "border-primary"
            )}
          >
            <Text className="font-bold text-lg">Flex Play</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 24,
          }}
          className="flex flex-1 w-full px-4"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex flex-col gap-4">
            {parlayPicks.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  {parlayPicks.map((pick, index) => (
                    <PickCard
                      key={pick.prop.id}
                      pick={pick}
                      isLast={index === parlayPicks.length - 1}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
            {(
              type == "perfect"
                ? parlayPicks.length >= 2
                : parlayPicks.length >= 3
            ) ? (
              <>
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
                                      parlayPicks.length,
                                      parlayPicks.length
                                    )
                                  : getPerfectPlayMultiplier(
                                      parlayPicks.length
                                    )) * stake
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
                            {parlayPicks.length} out of {parlayPicks.length}{" "}
                            Correct
                          </Text>
                          <View className="bg-primary/10 py-1 px-2 rounded-lg">
                            <Text className="font-semibold text-primary">
                              {getPerfectPlayMultiplier(
                                parlayPicks.length
                              ).toFixed(2)}
                              x
                            </Text>
                          </View>
                        </View>
                        <Text className="font-semibold text-lg">
                          $
                          {stake
                            ? (
                                stake *
                                getPerfectPlayMultiplier(parlayPicks.length)
                              ).toFixed(2)
                            : "0.00"}
                        </Text>
                      </View>
                    ) : (
                      <FlexPlayOutcomes
                        length={parlayPicks.length}
                        stake={stake}
                      />
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <View className="flex flex-col items-center gap-4 p-6">
                <Text className="text-3xl font-bold text-center">
                  More picks needed
                </Text>
                <Text className="text-muted-foreground text-lg font-medium text-center">
                  {type == "perfect"
                    ? "You need at least 2 picks for a perfect play"
                    : "You need at least 3 picks for a flex play"}
                </Text>
                <Button
                  variant="foreground"
                  onPress={() =>
                    router.replace({
                      pathname: "/matches/[matchId]",
                      params: { matchId },
                    })
                  }
                >
                  <Text className="font-semibold">Add Pick</Text>
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
        {(type == "perfect"
          ? parlayPicks.length >= 2
          : parlayPicks.length >= 3) && (
          <View
            className="flex flex-col items-center gap-6 p-6 border-t border-border"
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
                  ${userBalance}
                </Text>
                <Text className="font-semibold text-lg">
                  {!formError && stake ? `$ ${userBalance - stake}` : ""}
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
              size="lg"
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

export function PickCard({
  pick,
  isLast,
}: {
  pick: { prop: Prop; pick: string };
  isLast?: boolean;
}) {
  const { isPropPicked, getPick, updatePick, addPick, removePick } =
    useParlayPicks();
  const { prop } = pick;

  return (
    <View
      className={cn(
        "flex flex-row items-center justify-between border-border py-4 mx-4",
        !isLast && "border-b"
      )}
    >
      <View className="flex flex-row items-center gap-6">
        <Pressable
          onPress={() => {
            removePick(prop.id);
          }}
        >
          <CircleMinus className="text-destructive" size={20} />
        </Pressable>
        <View className="flex flex-col gap-1">
          <View className="flex flex-row items-center gap-2">
            <Text className="font-bold">{prop.player.name}</Text>
            <Text className="font-semibold text-muted-foreground">
              {prop.player.position}
            </Text>
          </View>
          <Text className="font-semibold text-muted-foreground text-sm">
            {/* TODO */}
            vs ABRV • {moment(prop.gameStartTime).format("ddd h:mm A")}
          </Text>
          <Text className="font-semibold text-lg">
            {prop.line} {getStatName(prop.stat)}
          </Text>
        </View>
      </View>
      <View className="flex flex-col gap-2">
        {prop.pickOptions?.map((option, i) => (
          <Button
            onPress={() => {
              if (isPropPicked(prop.id)) {
                if (getPick(prop.id) == option) {
                  return;
                } else {
                  updatePick(prop.id, option);
                }
              } else {
                addPick({ prop, pick: option });
              }
            }}
            className={cn(
              "w-20 flex-row justify-center items-center bg-background border border-border",
              getPick(prop.id) == option && "border-primary bg-primary/20"
            )}
            key={`${prop.id}_option_${i}`}
            size="sm"
          >
            <Text className="capitalize font-semibold">{option}</Text>
          </Button>
        ))}
      </View>
    </View>
  );
}
