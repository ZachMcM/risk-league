import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { FakeCurrencyInput } from "react-native-currency-input";
import DateTimePicker, {
  useDefaultClassNames,
} from "react-native-ui-datepicker";
import { toast } from "sonner-native";
import z from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import LeagueLogo from "~/components/ui/league-logos/LeagueLogo";
import ModalContainer from "~/components/ui/modal-container";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollContainer } from "~/components/ui/scroll-container";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";
import { postDynastyLeague } from "~/endpoints";
import { LEAGUES } from "~/lib/config";
import { ChevronDown } from "~/lib/icons/ChevronDown";
import { CircleX } from "~/lib/icons/CircleX";
import { DynastyLeague } from "~/types/dynastyLeague";
import { cn } from "~/utils/cn";

const dynastyLeagueSchema = z.object({
  dates: z
    .object({
      startDate: z
        .date()
        .min(new Date(), { message: "Start date cannot be in the past" }),
      endDate: z.date(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: "End date must be after start date",
      path: ["endDate"],
    }),
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(16, { message: "Title cannot be more than 16 characters" }),
  tags: z.array(z.string()),
  inviteOnly: z.boolean(),
  league: z.enum(LEAGUES),
  startingBalance: z
    .number()
    .min(100, { message: "Starting balance must be at least $100" }),
});

type FormValues = z.infer<typeof dynastyLeagueSchema>;

export default function CreateDynastyLeague() {
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(dynastyLeagueSchema),
    defaultValues: {
      tags: [],
      startingBalance: 100,
      inviteOnly: false,
    },
  });

  const [tagInput, setTagInput] = useState("");
  const formValues = watch();

  const addTag = () => {
    if (tagInput.trim() && !formValues.tags?.includes(tagInput.trim())) {
      const newTags = [...(formValues.tags || []), tagInput.trim()];
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = formValues.tags?.filter((tag) => tag !== tagToRemove) || [];
    setValue("tags", newTags);
  };

  const titleRef = useRef<TextInput | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const defaultClassNames = useDefaultClassNames();

  const { mutate: createLeague, isPending: isCreatingLeaguePending } =
    useMutation({
      mutationFn: async (
        league: Omit<
          DynastyLeague,
          "id" | "createdAt" | "resolved" | "userCount"
        >
      ) => await postDynastyLeague(league),
      onSuccess: () => {
        toast.success("Successfully created league");
        router.dismissAll();
        router.navigate("/(tabs)/dynasty");
      },
    });

  function onSubmit({
    dates,
    startingBalance,
    title,
    tags,
    inviteOnly,
    league,
  }: FormValues) {
    createLeague({
      startingBalance,
      title,
      tags,
      inviteOnly,
      league,
      startDate: dates.startDate.toISOString(),
      endDate: dates.endDate.toISOString(),
    });
  }

  return (
    <ModalContainer>
      <ScrollContainer className="pt-10">
        <View className="flex flex-col gap-6">
          <Controller
            control={control}
            rules={{ required: true }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View className="flex flex-col gap-2">
                <TextInput
                  ref={titleRef}
                  placeholder="Title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  className={cn(
                    "text-4xl text-foreground font-bold",
                    error && "border-destructive"
                  )}
                  cursorColor="hsl(324.9505 80.8% 50.9804%)"
                  selectionColor="hsl(324.9505 80.8% 50.9804%)"
                  placeholderClassName="text-muted-foreground"
                  value={value}
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="title"
          />
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="flex flex-col items-start gap-2">
                <Label>Starting Balance</Label>
                <FakeCurrencyInput
                  value={value}
                  onChangeValue={onChange}
                  prefix="$"
                  placeholder="$100.00"
                  delimiter=","
                  separator="."
                  precision={2}
                  style={{
                    color: "hsl(223.8136 0.0004% 98.0256%)",
                    fontWeight: 500,
                  }}
                  caretColor="hsl(324.9505 80.8% 50.9804%)"
                  placeholderTextColor="hsl(223.8136 0% 63.0163%)"
                  keyboardType="decimal-pad"
                />
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="startingBalance"
          />
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="flex flex-col gap-2">
                <Label>Start & End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Pressable
                      className={cn(
                        "web:w-full rounded-xl border border-input bg-input/30 p-3 flex-row items-center justify-between",
                        error && "border-destructive"
                      )}
                    >
                      <Text
                        className={
                          value?.startDate && value?.endDate
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {value?.startDate && value?.endDate
                          ? `${value.startDate.toLocaleDateString()} - ${value.endDate.toLocaleDateString()}`
                          : "Select date range"}
                      </Text>
                      <ChevronDown size={18} className="text-foreground" />
                    </Pressable>
                  </PopoverTrigger>
                  <PopoverContent
                    portalHost="inside-modal-page"
                    className="w-96 p-4"
                    sideOffset={8}
                    align="start"
                  >
                    <DateTimePicker
                      classNames={{
                        ...defaultClassNames,
                        day_cell: "p-1",
                        day: cn(defaultClassNames.day, "rounded-lg"),
                        outside_label: "opacity-50",
                        month_selector_label: cn(
                          defaultClassNames.month_selector_label,
                          "text-base font-medium"
                        ),
                        year_selector_label: cn(
                          defaultClassNames.year_selector_label,
                          "text-base font-medium"
                        ),
                        time_selector_label: cn(
                          defaultClassNames.time_selector_label,
                          "text-base font-medium"
                        ),
                        range_end_label: cn(
                          defaultClassNames.range_end_label,
                          "text-primary-foreground opacity-100"
                        ),
                        range_start_label: cn(
                          defaultClassNames.range_start_label,
                          "text-primary-foreground opacity-100"
                        ),
                        range_fill: "bg-accent my-1",
                        range_fill_weekstart: "rounded-s-md",
                        range_fill_weekend: "rounded-e-md",
                        range_middle_label: "text-accent-foreground",
                        time_label: "text-2xl font-medium text-foreground",
                        month: cn(defaultClassNames.month, "rounded-lg"),
                        year: cn(defaultClassNames.year, "rounded-lg"),
                      }}
                      onChange={({ startDate, endDate }) => {
                        onChange({
                          startDate,
                          endDate,
                        });
                      }}
                      startDate={value?.startDate}
                      endDate={value?.endDate}
                      mode="range"
                      minDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="dates"
          />
          <View className="flex flex-col gap-2">
            <Label>League</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                display: "flex",
                gap: 8,
                paddingRight: 16,
              }}
            >
              {LEAGUES.map((league) => (
                <Pressable
                  onPress={() => setValue("league", league)}
                  key={league}
                  className={cn(
                    "flex flex-row items-center gap-2 border-2 border-border/80 shadow-sm bg-secondary py-1.5 px-4 rounded-xl",
                    formValues.league == league &&
                      "bg-primary/20 border-primary"
                  )}
                >
                  <LeagueLogo size={22} league={league} />
                  <Text className="font-bold uppercase">{league}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ fieldState: { error } }) => (
              <View className="flex flex-col gap-2">
                <Label>Tags</Label>
                <View className="flex flex-row items-center gap-2">
                  <View className="flex-1">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                      className={cn(error && "border-destructive")}
                    />
                  </View>
                  <Button size="sm" onPress={addTag}>
                    <Text>Add Tag</Text>
                  </Button>
                </View>
                {formValues.tags && formValues.tags.length > 0 && (
                  <View className="flex flex-row flex-wrap gap-2 mt-2">
                    {formValues.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="foreground"
                        className="flex flex-row items-center gap-1.5"
                        onTouchEnd={() => removeTag(tag)}
                      >
                        <CircleX className="text-background" size={14} />
                        <Text className="text-sm">{tag}</Text>
                      </Badge>
                    ))}
                  </View>
                )}
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="tags"
          />
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className="flex flex-col gap-2">
                <View className="flex-row items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <Label>Invite Only</Label>
                </View>
                {error && (
                  <Text className="text-destructive">{error.message}</Text>
                )}
              </View>
            )}
            name="inviteOnly"
          />
          <Button
            disabled={isCreatingLeaguePending}
            variant="foreground"
            className="flex flex-row items-center gap-2"
            onPress={handleSubmit(onSubmit)}
          >
            <Text>Submit</Text>
            {isCreatingLeaguePending && (
              <ActivityIndicator className="text-background" />
            )}
          </Button>
        </View>
      </ScrollContainer>
    </ModalContainer>
  );
}
