"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@acme/ui/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex size-5 shrink-0 rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full rounded-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-xs",
      className,
    )}
    {...props}
  />
));

export function getInitials(props: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  const firstInitial = props.firstName?.charAt(0).toUpperCase() ?? "";
  const lastInitial = props.lastName?.charAt(0).toUpperCase() ?? "";

  return `${firstInitial}${lastInitial}`;
}

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarOnlineIndicator = (props: { online: boolean }) => {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 z-50 block size-2.5 rounded-full ring-2 ring-background",
        {
          "bg-gray-700": !props.online,
          "bg-green-400": props.online,
        },
      )}
    />
  );
};

export { Avatar, AvatarImage, AvatarFallback, AvatarOnlineIndicator };
