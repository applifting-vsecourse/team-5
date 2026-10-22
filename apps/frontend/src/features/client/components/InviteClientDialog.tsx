import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type InviteClientDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function InviteClientDialog({ isOpen, onOpenChange }: InviteClientDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pozvat klienta</DialogTitle>
          <DialogDescription>
            Předání 6místného kódu nebo odkazu klientovi na lekci připravujeme v rámci user story
            #58.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
