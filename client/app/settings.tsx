import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import { toast } from "sonner-native";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ModalContainer from "~/components/ui/modal-container";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { Check } from "~/lib/icons/Check";
import { LogOut } from "~/lib/icons/LogOut";
import { cn } from "~/utils/cn";

const schema = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .max(16, { message: "Username can't be more than 50 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name must be less than 50 characters" }),
});

type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const { data, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.user.name!,
      username: data?.user.username!,
    },
  });

  async function onSubmit({ username, name }: FormValues) {
    setIsSubmitting(true);
    try {
      await authClient.updateUser({
        username,
        name,
      });
      toast.success("Successfully updated settings");
      router.dismiss();
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    await authClient.signOut();
  }

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        <View className="flex flex-col w-full gap-6">
          <Text className="font-bold text-4xl">Settings</Text>
          <View className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input
              placeholder="Email"
              value={data?.user.email}
              onSubmitEditing={handleSubmit(onSubmit)}
              editable={false}
            />
          </View>
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
                <Label>Name</Label>
                <Input
                  placeholder="Name"
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
            name="name"
          />
          <Button
            size="lg"
            variant="foreground"
            onPress={handleSubmit(onSubmit)}
            className="flex-row gap-2 items-center"
            disabled={isSubmitting}
          >
            <Text>Save Settings</Text>
            {isSubmitting || isPending ? (
              <ActivityIndicator className="text-background" />
            ) : (
              <Check className="text-background" size={18} />
            )}
          </Button>
          <Button
            onPress={signOut}
            variant="destructive"
            size="lg"
            className="flex-row gap-2 items-center"
          >
            <Text>Sign Out</Text>
            {isPending ? (
              <ActivityIndicator className="text-foreground" />
            ) : (
              <LogOut className="text-destructive" size={18} />
            )}
          </Button>
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}
