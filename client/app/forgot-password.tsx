import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, View } from "react-native";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";
import { toast } from "sonner-native";
import { Link, router } from "expo-router";
import { Container } from "~/components/ui/container";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { useState } from "react";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email" }),
});

type FormValues = z.infer<typeof schema>;

export default function SignIn() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const [isPending, setIsPending] = useState(false);

  async function onSubmit({ email }: FormValues) {
    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: "riskleague://reset-password",
      },
      {
        onRequest: () => {
          setIsPending(true);
        },
        onError: ({ error }) => {
          setIsPending(false);
          toast.error(error.message);
        },
        onSuccess: () => {
          setIsPending(false);
          toast.success("Successfully sent reset password email");
        },
      }
    );
  }

  return (
    <Container>
      <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
        <View className="flex flex-col items-center gap-1">
          <Text className="text-4xl font-bold">Forgot Password</Text>
          <Text className="text-muted-foreground text-xl font-semibold text-center">
            Receive a password reset email
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
                <Label>Email</Label>
                <Input
                  placeholder="Email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  className={cn(error && "border-destructive")}
                  value={value}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="email"
          />
          <Button
            size="lg"
            onPress={handleSubmit(onSubmit)}
            className="flex-row gap-2 items-center"
          >
            <Text className="font-bold">Forgot Password</Text>
            {isPending && <ActivityIndicator className="text-foreground" />}
          </Button>
        </View>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate("/signin");
            }
          }}
          className="flex flex-row items-center gap-1 self-center"
        >
          <ChevronLeft className="text-foreground" size={18} />
          <Text className="text-lg">Back To Sign In</Text>
        </Pressable>
      </View>
    </Container>
  );
}
