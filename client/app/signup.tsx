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
import { Link } from "expo-router";
import { Container } from "~/components/ui/container";

const schema = z
  .object({
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
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm Password is required" }),
    name: z
      .string()
      .min(1, { message: "Name is required." })
      .max(50, { message: "Name must be less than 50 characters" }),
    username: z
      .string()
      .min(1, { message: "Username is required" })
      .max(16, { message: "Username can't be more than 16 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, { 
        message: "Username can only contain letters, numbers, and underscores" 
      }),
  })
  .refine(({ password, confirmPassword }) => confirmPassword === password, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUp() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      username: "",
    },
  });

  const { isPending } = authClient.useSession();

  async function onSubmit({ email, username, password, name }: FormValues) {
    await authClient.signUp.email(
      {
        email,
        username,
        password,
        name,
      },
      {
        onError: ({ error }) => {
          toast.error(error.message);
        },
      }
    );
  }

  return (
    <Container>
      <View className="flex flex-1 w-full justify-center items-center gap-4 p-6">
        <View className="flex flex-col items-center gap-1">
          <Text className="text-4xl font-bold">Sign Up</Text>
          <Text className="text-muted-foreground text-xl font-semibold">
            Create a Risk League account
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
            <Text className="font-bold">Sign Up</Text>
            {isPending && <ActivityIndicator className="text-foreground" />}
          </Button>
        </View>
        <Text className="text-center text-lg">
          Already have an account? Sign in{" "}
          <Link push className="underline" href="/signin">
            here.
          </Link>
        </Text>
      </View>
    </Container>
  );
}
