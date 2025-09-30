import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { toast } from "sonner-native";
import { router, useLocalSearchParams } from "expo-router";
import { Container } from "~/components/ui/container";
import { useState } from "react";

const schema = z
  .object({
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
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm Password is required" }),
  })
  .refine(({ password, confirmPassword }) => confirmPassword === password, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const { token } = useLocalSearchParams() as { token: string | undefined };

  if (!token) {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/");
    }
  }

  console.log(token)

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false)

  const { isPending } = authClient.useSession();

  async function onSubmit({ password }: FormValues) {
    await authClient.resetPassword(
      {
        newPassword: password,
        token,
      },
      {
        onError: ({ error }) => {
          setIsLoading(false)
          toast.error(error.message);
        },
        onRequest: () => {
          setIsLoading(true)
        },
        onSuccess: () => {
          setIsLoading(false)
        }
      }
    );
  }

  if (!token) {
    return null;
  }

  return (
    <Container>
      <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
        <View className="flex flex-col items-center gap-1">
          <Text className="text-4xl font-bold text-center">Reset Password</Text>
          <Text className="text-muted-foreground text-xl text-center font-semibold">
            Reset your Risk League account password
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
                <Label>Password</Label>
                <Input
                  placeholder="Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  className={cn(error && "border-destructive")}
                  value={value}
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="password"
          />
          <Controller
            control={control}
            rules={{ required: true }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View className="flex flex-col gap-2">
                <Label>Confirm Password</Label>
                <Input
                  placeholder="Confirm Password"
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
            name="confirmPassword"
          />
          <Button
            size="lg"
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            className="flex-row gap-2 items-center"
          >
            <Text className="font-bold">Confirm</Text>
            {isPending || isLoading && <ActivityIndicator className="text-foreground" />}
          </Button>
        </View>
      </View>
    </Container>
  );
}
