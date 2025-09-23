import * as React from "react";
import { Pressable, View } from "react-native";
import { cn } from "~/utils/cn";
import { Text } from "./text";
import { Icon } from "./icon";
import { ChevronDown } from "lucide-react-native";
import { AnimatedView } from "react-native-reanimated/lib/typescript/component/View";

interface SimpleAccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
}

const SimpleAccordionContext =
  React.createContext<SimpleAccordionContextValue | null>(null);

interface SimpleAccordionProps {
  children: React.ReactNode;
  className?: string;
  type: "single" | "multiple";
}

function SimpleAccordion({ children, className, type }: SimpleAccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  const toggleItem = React.useCallback(
    (value: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          if (type === "single") {
            newSet.clear();
          }
          newSet.add(value);
        }
        return newSet;
      });
    },
    [type]
  );

  return (
    <SimpleAccordionContext.Provider value={{ expandedItems, toggleItem }}>
      <View className={className}>{children}</View>
    </SimpleAccordionContext.Provider>
  );
}

interface SimpleAccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function SimpleAccordionItem({
  children,
  value,
  className,
}: SimpleAccordionItemProps) {
  const context = React.useContext(SimpleAccordionContext);
  if (!context) {
    throw new Error("SimpleAccordionItem must be used within SimpleAccordion");
  }

  const isExpanded = context.expandedItems.has(value);

  return (
    <SimpleAccordionItemContext.Provider
      value={{ value, isExpanded, toggleItem: context.toggleItem }}
    >
      <View className={cn("border-b border-border", className)}>
        {children}
      </View>
    </SimpleAccordionItemContext.Provider>
  );
}

interface SimpleAccordionItemContextValue {
  value: string;
  isExpanded: boolean;
  toggleItem: (value: string) => void;
}

const SimpleAccordionItemContext =
  React.createContext<SimpleAccordionItemContextValue | null>(null);

interface SimpleAccordionTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

function SimpleAccordionTrigger({
  children,
  className,
}: SimpleAccordionTriggerProps) {
  const context = React.useContext(SimpleAccordionItemContext);
  if (!context) {
    throw new Error(
      "SimpleAccordionTrigger must be used within SimpleAccordionItem"
    );
  }

  const { value, isExpanded, toggleItem } = context;

  return (
    <Pressable
      onPress={() => toggleItem(value)}
      className={cn(
        "flex flex-row items-center justify-between py-4 transition-all",
        className
      )}
    >
      {children}
      <Icon
        as={ChevronDown}
        size={18}
        className={cn("text-foreground", isExpanded && "rotate-180")}
      />
    </Pressable>
  );
}

interface SimpleAccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

function SimpleAccordionContent({
  children,
  className,
}: SimpleAccordionContentProps) {
  const context = React.useContext(SimpleAccordionItemContext);
  if (!context) {
    throw new Error(
      "SimpleAccordionContent must be used within SimpleAccordionItem"
    );
  }

  const { isExpanded } = context;

  if (!isExpanded) {
    return null;
  }

  return <View className={cn("pb-4", className)}>{children}</View>;
}

export {
  SimpleAccordion,
  SimpleAccordionItem,
  SimpleAccordionTrigger,
  SimpleAccordionContent,
};
