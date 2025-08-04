import { Fragment, ReactNode } from "react";
import { View } from "react-native";
import { Container } from "./container";

export default function ModalContainer({ children }: { children: ReactNode }) {
  return (
    <Fragment>
      <Container className="p-0 relative">
        <View className="flex flex-row justify-center items-center w-full absolute">
          <View className="rounded-2xl bg-secondary self-center mt-4 mb-2 h-2 w-24" />
        </View>
        {children}
      </Container>
    </Fragment>
  );
}
