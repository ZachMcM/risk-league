import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";
import { cn } from "~/lib/utils";
import { useSession } from "../providers/SessionProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email" }),
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
      email: "",
      password: "",
    },
  });

  const { signIn, isSignInPending } = useSession();

  function onSubmit(data: FieldValues) {
    signIn(data as FormValues);
  }

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
            <Label>Email</Label>
            <Input
              placeholder="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              className={cn(error && "border-destructive")}
              value={value}
            />
            {error && <Text className="text-destructive">{error.message}</Text>}
          </View>
        )}
        name="email"
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
        {isSignInPending && <ActivityIndicator className="text-foreground" />}
      </Button>
    </View>
  );
}
