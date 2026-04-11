import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import { cn } from "../../lib/utils"

const Sheet = Dialog
const SheetTrigger = DialogTrigger
const SheetClose = DialogClose

const SheetContent = React.forwardRef(({ side = "right", className, ...props }, ref) => {
  const sideClasses = {
    top: "inset-x-0 top-0 max-w-none translate-x-0 translate-y-0 rounded-none border-x-0 border-t-0",
    bottom: "inset-x-0 bottom-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-none border-x-0 border-b-0",
    left: "left-0 top-0 h-full max-w-sm translate-x-0 translate-y-0 rounded-r-lg",
    right: "right-0 left-auto top-0 h-full max-w-sm translate-x-0 translate-y-0 rounded-l-lg",
  }

  return (
    <DialogContent
      ref={ref}
      className={cn(
        "fixed z-50 w-full gap-4 bg-background p-6 shadow-lg duration-200",
        sideClasses[side],
        className
      )}
      {...props}
    />
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }) => (
  <DialogHeader className={cn("text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }) => (
  <DialogFooter className={cn("sm:justify-start", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = DialogTitle
const SheetDescription = DialogDescription

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
