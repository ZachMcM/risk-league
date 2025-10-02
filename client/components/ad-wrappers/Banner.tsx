import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import { adaptiveBannerUnitId } from "~/lib/ads";
import { useEntitlements } from "../providers/EntitlementsProvider";

export default function BannerAdWrapper() {
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    Platform.OS === "ios" && bannerRef.current?.load();
  });

  const { adFreeEntitlementPending, adFreeEntitlement } = useEntitlements()

  return (
    !adFreeEntitlementPending && !adFreeEntitlement && (
      <BannerAd
        ref={bannerRef}
        unitId={adaptiveBannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    )
  );
}
