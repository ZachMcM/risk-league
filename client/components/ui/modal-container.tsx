import { Fragment, ReactNode } from "react";
import { View } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { Container } from "./container";

export default function ModalContainer({ children }: { children: ReactNode }) {
  return (
    <Fragment>
      <Container className="p-0 flex flex-col gap-2">
        <View className="flex flex-row justify-center items-center">
          <View className="rounded-2xl bg-secondary self-center mt-4 h-2 w-24" />
        </View>
        {children}
      </Container>
      <PortalHost name="modal" />
    </Fragment>
  );
}
