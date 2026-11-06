import { useSyncExternalStore, type ReactNode } from "react"

import { EditorIcon } from "@/components/EditorIcon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

const mediaQuery = "(min-width: 48rem)"
const subscribe = (change: () => void) => {
  const media = window.matchMedia(mediaQuery)
  media.addEventListener("change", change)
  return () => media.removeEventListener("change", change)
}

export function EditorSheet({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(mediaQuery).matches,
    () => true,
  )
  const close = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Zavřít"
      onClick={() => onOpenChange(false)}
      className="rounded-field"
    >
      <EditorIcon name="X" />
    </Button>
  )
  if (isDesktop) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-sheet bg-background sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      dismissible
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92dvh]">
        <DrawerHeader>
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle className="text-2xl">{title}</DrawerTitle>
            {close}
          </div>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-gutter pb-8">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
