import { Link, useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Container } from "~/components/ui/container";
import { LogoIcon } from "~/components/ui/logo-icon";
import { Text } from "~/components/ui/text";
import { TrendingUp } from "~/lib/icons/TrendingUp";
import { Users } from "~/lib/icons/Users";

export default function Index() {
  const router = useRouter();

  return (
    <Container>
      <View className="flex-col gap-8 flex-1 justify-end p-2">
        <View className="flex flex-col gap-6">
          <LogoIcon className="text-primary h-16 w-16" />
          <View className="flex flex-col gap-2">
            <View className="flex-col gap-1">
              <Text>
                <Text className="font-extrabold text-5xl">Play.</Text>
                <Text className="font-extrabold text-5xl text-primary">
                  {" "}
                  Risk.
                </Text>
                <Text className="font-extrabold text-5xl"> Win.</Text>
              </Text>
              <Text className="text-muted-foreground font-medium text-xl">
                The ultimate competitive fantasy sports betting game. Battle
                1v1, climb the ELO ladder, and prove you're the best.
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-col gap-4">
          <Card className="w-full p-6">
            <View className="flex-row gap-4 items-center">
              <View className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl text-card-foreground font-semibold leading-none tracking-tight">
                  1v1 Head To Head
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Face off against opponents in intense head-to-head fantasy
                  sports battles.
                </Text>
              </View>
            </View>
          </Card>
          <Card className="w-full p-6">
            <View className="flex-row gap-4 items-center">
              <View className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl text-card-foreground font-semibold leading-none tracking-tight">
                  ELO Ranking
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Climb the competitive ladder with our sophisticated ELO rating
                  system.
                </Text>
              </View>
            </View>
          </Card>
        </View>
        <View className="flex-col gap-4">
          <Button onPress={() => router.navigate("/signup")} size="lg">
            <Text>Sign Up</Text>
          </Button>
          <Button
            onPress={() => router.navigate("/signin")}
            variant="secondary"
            size="lg"
          >
            <Text className="  font">Sign In</Text>
          </Button>
          <Text className="text-muted-foreground text-xs text-center">
            Risk League is not real gambling. If you have a gambling problem
            please call{" "}
            <Link className=" underline" href="tel:+18005224700">
              1-800-522-4700
            </Link>
            .
          </Text>
        </View>
      </View>
    </Container>
  );
}
