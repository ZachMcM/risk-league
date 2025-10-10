import { Image, ImageProps } from "expo-image";
import * as React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "~/utils/cn";

interface AvatarContextValue {
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
  imageError: boolean;
  setImageError: (error: boolean) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | undefined>(
  undefined
);

function Avatar({
  className,
  children,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  return (
    <AvatarContext.Provider
      value={{ imageLoaded, setImageLoaded, imageError, setImageError }}
    >
      <View
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </View>
    </AvatarContext.Provider>
  );
}

function AvatarImage({
  className,
  source,
  ...props
}: ImageProps & {
  ref?: React.RefObject<Image>;
}) {
  const context = React.useContext(AvatarContext);

  if (!context) {
    throw new Error("AvatarImage must be used within Avatar");
  }

  const { setImageLoaded, setImageError } = context;

  return (
    <Image
      source={source}
      className={cn("aspect-square h-full w-full", className)}
      onLoad={() => setImageLoaded(true)}
      onError={() => {
        setImageError(true);
        setImageLoaded(false);
      }}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: ViewProps & {
  ref?: React.RefObject<View>;
}) {
  const context = React.useContext(AvatarContext);

  if (!context) {
    throw new Error("AvatarFallback must be used within Avatar");
  }

  const { imageLoaded, imageError } = context;

  // Only show fallback if image failed to load or hasn't loaded yet
  if (imageLoaded && !imageError) {
    return null;
  }

  return (
    <View
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
