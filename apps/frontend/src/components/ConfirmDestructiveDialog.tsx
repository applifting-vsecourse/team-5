import { useSyncExternalStore, type ReactNode } from "react"
import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

type ConfirmDestructiveDialogProps = {
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  trigger: ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const MD_UP = "(min-width: 48rem)"

function subscribeMdUp(onChange: () => void) {
  const media = window.matchMedia(MD_UP)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function useIsMdUp() {
  return useSyncExternalStore(
    subscribeMdUp,
    () => window.matchMedia(MD_UP).matches,
    () => true,
  )
}

/**
 * Irreversible-action confirmation (Figma Smazat psa — bottom sheet on mobile,
 * centred dialog from md up).
 */
export function ConfirmDestructiveDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Zrušit",
  onConfirm,
  trigger,
  isOpen,
  onOpenChange,
}: ConfirmDestructiveDialogProps) {
  const isDesktop = useIsMdUp()

  if (isDesktop) {
    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={onOpenChange}
      >
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className="rounded-sheet shadow-none">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-danger-surface text-danger-foreground">
              <Trash2 aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="items-center text-center">
          <div className="mb-2 inline-flex size-16 items-center justify-center rounded-md bg-danger-surface text-danger-foreground *:[svg:not([class*='size-'])]:size-8">
            <Trash2 aria-hidden />
          </div>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
