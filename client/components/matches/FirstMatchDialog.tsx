import { useState } from "react";
import { View } from "react-native";
import { ArrowRight } from "~/lib/icons/ArrowRight";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";

function WelcomeScreen() {
  return (
    <View className="flex flex-col gap-4">
      <Text className="font-bold text-2xl">Welcome to Your First Match!</Text>
      <Text className="text-base text-muted-foreground leading-relaxed">
        You're about to embark on an exciting journey in Risk League! Before you
        start, there are a few important things you should know to ensure a fair
        and competitive experience.
      </Text>
      <Text className="text-base text-muted-foreground leading-relaxed">
        Let's walk through the essentials together.
      </Text>
    </View>
  );
}

function RequirementsScreen() {
  return (
    <View className="flex flex-col gap-4">
      <Text className="font-bold text-2xl">Match Requirements</Text>
      <Text className="text-base text-muted-foreground leading-relaxed">
        Every match has <Text className="font-bold text-foreground">minimum parlay requirements</Text> and{" "}
        <Text className="font-bold text-foreground">minimum stake requirements</Text> that you must meet. The minimum parlays is the total number of parlays you need to create. The minimum stake is the total amount you must stake to avoid disqualification - each parlay has a stake, which is the amount you bet on that parlay.
      </Text>
      <Text className="text-base text-muted-foreground leading-relaxed">
        These requirements ensure fairness between all players. Risk League is
        about making the most money while strategically managing your payroll -
        but everyone needs to play by the same rules.
      </Text>
      <Text className="text-base text-muted-foreground leading-relaxed">
        Think of it as a level playing field where your skill in selecting
        props and managing stakes matters most!
      </Text>
    </View>
  );
}

function ReadyScreen({ close }: { close: () => void }) {
  return (
    <View className="flex flex-col gap-6">
      <Text className="font-bold text-2xl text-center">Ready to Play!</Text>
      <Text className="text-base text-muted-foreground leading-relaxed text-center">
        You're all set! Remember to meet your minimum requirements and have fun
        competing. May the best strategist win!
      </Text>
      <Button
        onPress={close}
        size="sm"
        variant="default"
        className="flex flex-row items-center justify-center gap-2 w-full"
      >
        <Text className="font-bold">Let's Go!</Text>
        <ArrowRight className="text-foreground" size={18} />
      </Button>
    </View>
  );
}

export default function FirstMatchDialog({
  isOpen,
  onOpenChange,
  close,
}: {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  close: () => void;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    <WelcomeScreen key="welcome" />,
    <RequirementsScreen key="requirements" />,
    <ReadyScreen key="ready" close={close} />,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw]">
        <View className="flex flex-col gap-6 py-4">
          <View className="flex flex-col gap-2 w-full mt-4">
            <View className="flex flex-row items-center justify-between w-full">
              <Text className="text-muted-foreground">
                Step {step + 1} of {steps.length}
              </Text>
              <Text className="text-muted-foreground">
                {Math.round(((step + 1) / steps.length) * 100)}%
              </Text>
            </View>
            <Progress
              className="h-2 w-full"
              variant="primary"
              value={step + 1}
              max={steps.length}
            />
          </View>
          {steps[step]}
          {step !== steps.length - 1 && (
            <Button
              onPress={() => setStep(step + 1)}
              size="lg"
              variant="default"
              className="flex flex-row items-center justify-center gap-2 w-full"
            >
              <Text className="font-bold">Next</Text>
              <ArrowRight className="text-foreground" size={18} />
            </Button>
          )}
        </View>
      </DialogContent>
    </Dialog>
  );
}
