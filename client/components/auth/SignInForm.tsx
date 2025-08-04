import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/utils/cn";

const schema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
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

export default function SignInForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit({ username, password }: FormValues) {
    await authClient.signIn.username({
      username,
      password,
    });
  }

  const { isPending } = authClient.useSession();

  return (
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
            {error && <Text className="text-destructive">{error.message}</Text>}
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
            {error && <Text className="text-destructive">{error.message}</Text>}
          </View>
        )}
        name="password"
      />
      <Button
        size="lg"
        onPress={handleSubmit(onSubmit)}
        className="flex-row gap-2 items-center"
      >
        <Text>Sign In</Text>
        {isPending && <ActivityIndicator className="text-foreground" />}
      </Button>
    </View>
  );
}
