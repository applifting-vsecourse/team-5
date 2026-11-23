import { useSyncExternalStore, type ReactNode } from "react"
import { Archive, Trash2 } from "lucide-react"

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
import { cn } from "@/lib/utils"

type ConfirmDestructiveDialogProps = {
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  trigger: ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * `destructive` (default) for irreversible actions such as deleting.
   * `reversible` for actions the user can undo later (archiving): neutral
   * colours, an archive icon and a primary confirm button (#256).
   */
  tone?: "destructive" | "reversible"
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
 * Confirmation of a consequential action (Figma Smazat psa — bottom sheet on
 * mobile, centred dialog from md up). Red is reserved for irreversible actions.
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
  tone = "destructive",
}: ConfirmDestructiveDialogProps) {
  const isDesktop = useIsMdUp()
  const isReversible = tone === "reversible"
  const Icon = isReversible ? Archive : Trash2
  const mediaTone = isReversible
    ? "bg-secondary text-secondary-foreground"
    : "bg-danger-surface text-danger-foreground"
  const confirmVariant = isReversible ? "default" : "destructive"

  if (isDesktop) {
    return (
      <AlertDialog
        open={isOpen}
        onOpenChange={onOpenChange}
      >
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className="rounded-sheet shadow-none">
          <AlertDialogHeader>
            <AlertDialogMedia className={mediaTone}>
              <Icon aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmVariant}
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
          <div
            className={cn(
              "mb-2 inline-flex size-16 items-center justify-center rounded-md *:[svg:not([class*='size-'])]:size-8",
              mediaTone,
            )}
          >
            <Icon aria-hidden />
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
              variant={confirmVariant}
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
