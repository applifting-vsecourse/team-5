import { Copy } from "lucide-react"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { Button } from "@/components/ui/button"

type CopyInviteLinkButtonProps = {
  code: string
  // In a list row the button shows only the icon; the label is for screen readers.
  isCompact?: boolean
}

export const inviteLinkFor = (code: string) =>
  `${window.location.origin}${ROUTES.invite}?code=${encodeURIComponent(code)}`

// Copies the link with the code, for the trainer to send in a chat (#58).
export function CopyInviteLinkButton({ code, isCompact = false }: CopyInviteLinkButtonProps) {
  const link = inviteLinkFor(code)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Odkaz s kódem je zkopírovaný")
    } catch {
      // Clipboard can be blocked (e.g. an http page); show the link to copy by hand.
      toast.error(`Zkopírovat se nepodařilo. Odkaz: ${link}`)
    }
  }

  return (
    <Button
      type="button"
      variant={isCompact ? "ghost" : "outline"}
      size={isCompact ? "icon" : "default"}
      className={isCompact ? "size-11 shrink-0" : "min-h-11 w-full"}
      aria-label={`Zkopírovat odkaz s kódem ${code}`}
      onClick={() => void handleCopy()}
    >
      <Copy className="size-4" />
      {isCompact ? null : "Zkopírovat odkaz s kódem"}
    </Button>
  )
}
