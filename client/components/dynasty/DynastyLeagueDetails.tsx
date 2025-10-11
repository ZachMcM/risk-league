import { AlertTriangle, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import { toast } from "sonner-native";
import { interstitialAdUnitId } from "~/lib/ads";
import { authClient } from "~/lib/auth-client";
import { DynastyLeague, DynastyLeagueUser } from "~/types/dynastyLeague";
import { sqlToJsDate } from "~/utils/dateUtils";
import { Alert, AlertTitle } from "../ui/alert";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";
import { useEntitlements } from "../providers/EntitlementsProvider";

export default function DynastyLeagueDetails({
  dynastyLeagueUsers,
  dynastyLeague,
}: {
  dynastyLeagueUsers: DynastyLeagueUser[];
  dynastyLeague: DynastyLeague;
}) {
  const { data: currentUserData } = authClient.useSession();

  const currentUserIndex = dynastyLeagueUsers?.findIndex(
    (dynastyLeagueUser) => dynastyLeagueUser.userId == currentUserData?.user.id
  )!;
  const currentDynastyLeagueUser = dynastyLeagueUsers?.at(currentUserIndex!)!;

  const {
    isLoaded: isAdLoaded,
    load: loadAd,
    show: showAd,
  } = useInterstitialAd(interstitialAdUnitId);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const { adFreeEntitlementPending, adFreeEntitlement } = useEntitlements();

  useEffect(() => {
    const showAdIfAllowed = async () => {
      if (
        currentDynastyLeagueUser &&
        isAdLoaded &&
        !adFreeEntitlementPending &&
        !adFreeEntitlement &&
        new Date().getTime() -
          sqlToJsDate(currentDynastyLeagueUser.createdAt).getTime() <=
          20000
      ) {
        toast.dismiss();
        showAd();
      }
    };

    showAdIfAllowed();
  }, [
    isAdLoaded,
    currentDynastyLeagueUser,
    adFreeEntitlement,
    adFreeEntitlementPending,
  ]);

  const [minParlaysAlert, setMinParlaysAlert] = useState(
    currentDynastyLeagueUser.totalParlays < dynastyLeague.minParlays
  );
  const [minTotalStakedAlert, setMinTotalStakedAlert] = useState(
    currentDynastyLeagueUser.totalStaked < dynastyLeague.minTotalStaked
  );

  useEffect(() => {
    setMinParlaysAlert(
      currentDynastyLeagueUser.totalParlays < dynastyLeague.minParlays
    );
    setMinTotalStakedAlert(
      currentDynastyLeagueUser.totalStaked < dynastyLeague.minTotalStaked
    );

    return () => {
      setMinParlaysAlert(
        currentDynastyLeagueUser.totalParlays < dynastyLeague.minParlays
      );
      setMinTotalStakedAlert(
        currentDynastyLeagueUser.totalStaked < dynastyLeague.minTotalStaked
      );
    };
  }, [dynastyLeague]);

  return (
    <View className="flex flex-col gap-8">
      <View className="flex flex-row items-center gap-3">
        <View className="flex flex-row items-center gap-1">
          <Text className="text-xl font-semibold">Balance:</Text>
          <Text className="text-primary font-bold text-xl">
            ${currentDynastyLeagueUser.balance}
          </Text>
        </View>
        {currentDynastyLeagueUser.rank && (
          <View className="flex flex-row items-center gap-1">
            <Text className="text-xl font-semibold">Ranking:</Text>
            <Text className="text-primary font-bold text-xl">
              #{currentDynastyLeagueUser.rank}
            </Text>
          </View>
        )}
      </View>
      {(minTotalStakedAlert || minParlaysAlert) && (
        <View className="flex flex-col gap-2">
          {minTotalStakedAlert && (
            <Alert variant="destructive" className="items-center">
              <AlertTriangle className="text-destructive" size={20} />
              <AlertTitle className="text-foreground">
                You need to stake $
                {dynastyLeague.minTotalStaked -
                  currentDynastyLeagueUser.totalStaked}{" "}
                more!
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
                {dynastyLeague.minParlays -
                  currentDynastyLeagueUser.totalParlays}{" "}
                more parlay
                {dynastyLeague.minParlays -
                  currentDynastyLeagueUser.totalParlays >
                  1 && "s"}
                !
              </AlertTitle>
              <Pressable onPress={() => setMinParlaysAlert(false)}>
                <Icon as={X} size={16} className="text-muted-foreground" />
              </Pressable>
            </Alert>
          )}
        </View>
      )}
    </View>
  );
}
