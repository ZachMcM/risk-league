import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import { adaptiveBannerUnitId } from "~/lib/ads";

export default function BannerAdWrapper() {
  const [canShowAd, setCanShowAd] = useState(false);

  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    Platform.OS === "ios" && bannerRef.current?.load();
  });

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const customerInfo = await Purchases.getCustomerInfo();
      if (
        typeof customerInfo.entitlements.active["No Ads"] === "undefined"
      ) {
        setCanShowAd(true);
      }
    };

    checkSubscriptionStatus()
  }, []);

  return (
    canShowAd && (
      <BannerAd
        ref={bannerRef}
        unitId={adaptiveBannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    )
  );
}
