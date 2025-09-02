import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Card, CardContent } from "../ui/card";

interface DynastyLeagueCountdownProps {
  startDate: string;
  endDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function DynastyLeagueCountdown({
  startDate,
  endDate,
}: DynastyLeagueCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [status, setStatus] = useState<"upcoming" | "active" | "ended">(
    "upcoming"
  );

  // Helper function to parse date strings that might have incomplete timezone format
  const parseDate = (dateString: string) => {
    // Fix timezone format if needed: "+00" -> "+00:00"
    let fixedDateString = dateString;
    if (dateString.endsWith("+00")) {
      fixedDateString = dateString.replace("+00", "+00:00");
    } else if (dateString.endsWith("-00")) {
      fixedDateString = dateString.replace("-00", "-00:00");
    }

    return new Date(fixedDateString);
  };

  const calculateTimeLeft = () => {
    // Add validation for date props
    if (!startDate || !endDate) {
      console.log("Missing date props:", { startDate, endDate });
      return;
    }

    const now = new Date().getTime();
    const start = parseDate(startDate).getTime();
    const end = parseDate(endDate).getTime();

    // Check if dates are valid
    if (isNaN(start) || isNaN(end)) {
      console.log("Invalid dates:", { startDate, endDate, start, end });
      return;
    }

    let difference = 0;
    let newStatus: "upcoming" | "active" | "ended" = "upcoming";

    if (now < start) {
      // League hasn't started yet
      difference = start - now;
      newStatus = "upcoming";
    } else if (now < end) {
      // League is active
      difference = end - now;
      newStatus = "active";
    } else {
      // League has ended
      difference = now - end;
      newStatus = "ended";
    }

    setStatus(newStatus);

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  };

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  const formatNumber = (value: number) => {
    return value.toString().padStart(2, "0");
  };

  const getStatusText = () => {
    switch (status) {
      case "upcoming":
        return "League starts in";
      case "active":
        return "League ends in";
      case "ended":
        return "League ended";
    }
  };

  // Don't render if we don't have valid dates
  if (
    !startDate ||
    !endDate ||
    isNaN(parseDate(startDate).getTime()) ||
    isNaN(parseDate(endDate).getTime())
  ) {
    return null;
  }

  return (
    <View className="flex flex-col gap-4 items-center">
      <Text className="text-sm font-medium">{getStatusText()}</Text>
      <View className="flex flex-row items-center gap-3">
        <View className="flex flex-col items-center">
          <View className="bg-muted border border-border rounded-lg px-3 py-2">
            <Text className="text-xl font-semibold text-center">
              {formatNumber(timeLeft.days)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-1">Days</Text>
        </View>
        <Text className="text-xl font-semibold pb-4">:</Text>
        <View className="flex flex-col items-center">
          <View className="bg-muted border border-border rounded-lg px-3 py-2">
            <Text className="text-xl font-semibold text-center">
              {formatNumber(timeLeft.hours)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-1">Hrs</Text>
        </View>
        <Text className="text-xl font-semibold pb-4">:</Text>
        <View className="flex flex-col items-center">
          <View className="bg-muted border border-border rounded-lg px-3 py-2">
            <Text className="text-xl font-semibold text-center">
              {formatNumber(timeLeft.minutes)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-1">Mins</Text>
        </View>
        <Text className="text-xl font-semibold pb-4">:</Text>
        <View className="flex flex-col items-center">
          <View className="bg-muted border border-border rounded-lg px-3 py-2">
            <Text className="text-xl font-semibold text-center">
              {formatNumber(timeLeft.seconds)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-1">Secs</Text>
        </View>
      </View>
    </View>
  );
}
