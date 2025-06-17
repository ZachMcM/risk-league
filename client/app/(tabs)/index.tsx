import SignOutButton from "~/components/auth/SignOutButton";
import { ScrollContainer } from "~/components/ui/scroll-container";

export default function Home() {
  return (
    <ScrollContainer>
      <SignOutButton />
    </ScrollContainer>
  );
}
