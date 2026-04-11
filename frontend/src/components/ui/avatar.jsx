import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../../lib/utils"

const Avatar = AvatarPrimitive.Root

const AvatarImage = AvatarPrimitive.Image

const AvatarFallback = AvatarPrimitive.Fallback

function AppAvatar({ className, ...props }) {
  return <Avatar className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full", className)} {...props} />
}

function AppAvatarImage({ className, ...props }) {
  return <AvatarImage className={cn("aspect-square h-full w-full", className)} {...props} />
}

function AppAvatarFallback({ className, ...props }) {
  return (
    <AvatarFallback
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

export { AppAvatar as Avatar, AppAvatarImage as AvatarImage, AppAvatarFallback as AvatarFallback }
