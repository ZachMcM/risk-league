import { BanknoteArrowUp } from "lucide-react-native";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";
import { FakeCurrencyInput } from "react-native-currency-input";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { patchDynastyLeagueUsersBonus } from "~/endpoints";
import { toast } from "sonner-native";
import { ActivityIndicator } from "react-native";

export default function BonusUsersDialog({
  dynastyLeagueId,
}: {
  dynastyLeagueId: number;
}) {
  const [value, setValue] = useState<number | null>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: bonusUsers, isPending: isBonusPending } = useMutation({
    mutationFn: async () =>
      patchDynastyLeagueUsersBonus({ dynastyLeagueId, bonusValue: value ?? 0 }),
    onSuccess: () => {
      toast.success("Successfully blessed everyone");
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex flex-row items-center gap-2" size="sm">
          <Icon
            as={BanknoteArrowUp}
            className="text-primary-foreground"
            size={18}
          />
          <Text>Bonus Users</Text>
        </Button>
      </DialogTrigger>
      <DialogContent portalHost="inside-modal-page">
        <DialogHeader className="items-center">
          <DialogTitle className="text-center">Bonus Users</DialogTitle>
          <DialogDescription className="text-center">
            Bless everyone's balance with a bonus! Once you do this you cannot
            revert it!
          </DialogDescription>
        </DialogHeader>
        <FakeCurrencyInput
          value={value}
          onChangeValue={setValue}
          prefix="$"
          placeholder="$100.00"
          delimiter=","
          separator="."
          precision={2}
          style={{
            color: "hsl(223.8136 0.0004% 98.0256%)",
            fontWeight: 500,
            fontSize: 28,
          }}
          caretColor="hsl(324.9505 80.8% 50.9804%)"
          placeholderTextColor="hsl(223.8136 0% 63.0163%)"
          keyboardType="decimal-pad"
        />
        <DialogFooter className="flex flex-row items-center justify-center">
          <DialogClose asChild>
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button
            className="flex flex-row items-center gap-2"
            disabled={isBonusPending}
            onPress={() => bonusUsers()}
          >
            {isBonusPending && (
              <ActivityIndicator className="text-primary-foreground" />
            )}
            <Text>Confirm Bonus</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
