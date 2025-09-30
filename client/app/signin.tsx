import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";
import { toast } from "sonner-native";
import { Link } from "expo-router";
import { Container } from "~/components/ui/container";
import { useState } from "react";

const schema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  password: z
    .string()
    .min(8, { message: "Password can't be less than 8 characters" })
    .max(50, { message: "Password can't be more than 50 characters" })
    .regex(/[a-z]/, { message: "Password must include a lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must include an uppercase letter" })
    .regex(/\d/, { message: "Password must include a number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must include a special character",
    }),
});

type FormValues = z.infer<typeof schema>;

export default function SignIn() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit({ username, password }: FormValues) {
    await authClient.signIn.username(
      {
        username,
        password,
      },
      {
        onError: ({ error, response, request }) => {
          toast.error(error.message ?? response.text);
          setIsLoading(false)
        },
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          toast.success("Successfully signed in");
          setIsLoading(false);
        },
      }
    );
  }

  const { isPending } = authClient.useSession();

  return (
    <Container>
      <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
        <View className="flex flex-col items-center gap-1">
          <Text className="text-4xl font-bold">Sign In</Text>
          <Text className="text-muted-foreground text-xl font-semibold">
            Sign in to your Risk League account
          </Text>
        </View>
        <View className="flex flex-col w-full gap-6">
          <Controller
            control={control}
            rules={{ required: true }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View className="flex flex-col gap-2">
                <Label>Username</Label>
                <Input
                  placeholder="Username"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  className={cn(error && "border-destructive")}
                  value={value}
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="username"
          />
          <Controller
            control={control}
            rules={{ required: true }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View className="flex flex-col gap-2">
                <Label>Password</Label>
                <Input
                  placeholder="Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  className={cn(error && "border-destructive")}
                  value={value}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="password"
          />
          <Button
            size="lg"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending || isLoading}
            className="flex-row gap-2 items-center"
          >
            <Text className="font-bold">Sign In</Text>
            {isPending ||
              (isLoading && <ActivityIndicator className="text-foreground" />)}
          </Button>
        </View>
        <View className="flex flex-col gap-2">
          <Text className="text-center text-lg">
            Don't have an account? Sign Up{" "}
            <Link push className="underline" href="/signup">
              here.
            </Link>
          </Text>
          <Link push className="underline" href="/forgot-password">
            <Text className="text-center text-lg text-muted-foreground">
              Forgot Password?
            </Text>
          </Link>
        </View>
      </View>
    </Container>
  );
}
