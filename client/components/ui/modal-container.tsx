import { View } from "react-native";
import { Container } from "./container";
import { Fragment, ReactNode } from "react";
import { PortalHost } from "@rn-primitives/portal";

export default function ModalContainer({ children }: { children: ReactNode }) {
  return (
    <Fragment>
      <Container className="p-0">
        <View className="flex flex-row justify-center items-center">
          <View className="rounded-2xl bg-secondary self-center mt-4 mb-2 h-2 w-24" />
        </View>
        {children}
      </Container>
      <PortalHost name="modal-portal" />
    </Fragment>
  );
}
