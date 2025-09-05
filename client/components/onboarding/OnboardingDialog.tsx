import { useState } from "react";
import { View } from "react-native";
import { ArrowRight } from "~/lib/icons/ArrowRight";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";
import HowToPlayStep from "./HowToPlayStep";
import WelcomeStep from "./WelcomeStep";

export default function OnboardingDialog({
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
    <WelcomeStep />,
    <HowToPlayStep close={close} />,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
          <View className="flex flex-row w-full gap-2">
            {step !== steps.length - 1 && (
              <Button
                onPress={() => setStep(step + 1)}
                size="lg"
                variant="default"
                className="flex flex-row items-center gap-2 flex-1"
              >
                <Text className="font-bold">Continue</Text>
                <ArrowRight className="text-foreground" size={18} />
              </Button>
            )}
            <Button onPress={close} size="lg" variant="outline">
              <Text className="font-bold">Skip</Text>
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}
