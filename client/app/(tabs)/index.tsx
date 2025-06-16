import { View } from "react-native";
import SignOutButton from "~/components/auth/SignOutButton";
import { Container } from "~/components/ui/container";

export default function Home() {
  return (
    <Container>
      <SignOutButton/>
    </Container>
  )
}