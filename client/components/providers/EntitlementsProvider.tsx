import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";
import Purchases from "react-native-purchases";

type EntitlementsProviderValues = {
  adFreeEntitlement?: boolean;
  adFreeEntitlementPending: boolean;
  seasonZeroBattlePassEntitlement?: boolean;
  seasonZeroBattlePassEntitlementPending: boolean;
};

const EntitlementsContext = createContext<null | EntitlementsProviderValues>(
  null
);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { data: adFreeEntitlement, isPending: adFreeEntitlementPending } =
    useQuery({
      queryKey: ["entitlements", "No Ads"],
      queryFn: async () => {
        const customerInfo = await Purchases.getCustomerInfo();
        return (
          typeof customerInfo.entitlements.active["No Ads"] !== "undefined"
        );
      },
    });

  const {
    data: seasonZeroBattlePassEntitlement,
    isPending: seasonZeroBattlePassEntitlementPending,
  } = useQuery({
    queryKey: ["entitlements", "Season Zero Battle Pass"],
    queryFn: async () => {
      const customerInfo = await Purchases.getCustomerInfo();
      return (
        typeof customerInfo.entitlements.active["Season Zero Battle Pass"] !==
        "undefined"
      );
    },
  });

  return (
    <EntitlementsContext.Provider
      value={{
        adFreeEntitlement,
        adFreeEntitlementPending,
        seasonZeroBattlePassEntitlementPending,
        seasonZeroBattlePassEntitlement,
      }}
    >
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementsContext) as EntitlementsProviderValues
}
