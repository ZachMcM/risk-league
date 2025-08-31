import * as TabsPrimitive from "@rn-primitives/tabs";
import * as React from "react";
import { cn } from "~/utils/cn";
import { TextClassContext } from "~/components/ui/text";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: TabsPrimitive.ListProps & {
  ref?: React.RefObject<TabsPrimitive.ListRef>;
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "web:inline-flex flex-row w-full items-center native:px-1.5",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TriggerProps & {
  ref?: React.RefObject<TabsPrimitive.TriggerRef>;
}) {
  const { value } = TabsPrimitive.useRootContext();
  return (
    <TextClassContext.Provider
      value={cn(
        "text-sm native:text-base font-bold text-muted-foreground web:transition-all",
        value === props.value && "text-foreground",
      )}
    >
      <TabsPrimitive.Trigger
        className={cn(
          "inline-flex flex-row items-center justify-center gap-2 flex-1 web:whitespace-nowrap border-b-2 border-border pb-4",
          props.disabled && "web:pointer-events-none opacity-50",
          props.value === value && "border-primary",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.ContentProps & {
  ref?: React.RefObject<TabsPrimitive.ContentRef>;
}) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
