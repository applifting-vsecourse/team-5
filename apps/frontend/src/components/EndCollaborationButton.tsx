import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { ConfirmDestructiveDialog } from "@/components/ConfirmDestructiveDialog"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api-client"
import { authKeys } from "@/lib/auth-keys"

type Props =
  | {
      clientId: string
      clientName: string
      dogId?: never
      trainerId?: never
      trainerName?: never
      dogName?: never
    }
  | {
      dogId: string
      dogName: string
      trainerId: string
      trainerName: string
      clientId?: never
      clientName?: never
    }

export function EndCollaborationButton(props: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async () => {
      const path = props.clientId
        ? `clients/${props.clientId}`
        : `dogs/${props.dogId}/trainers/${props.trainerId}`
      await api.delete(path)
    },
    onSuccess: async () => {
      if (props.clientId) {
        // Discard cached dog/plan/history data before leaving the client detail.
        const privateQueries = {
          predicate: (query: { queryKey: readonly unknown[] }) =>
            query.queryKey[0] !== authKeys.all()[0],
        }
        await queryClient.cancelQueries(privateQueries)
        queryClient.removeQueries(privateQueries)
        await navigate({ to: "/clients" })
      }
      await queryClient.invalidateQueries()
      toast.success("Spolupráce byla ukončena.")
    },
    onError: () => toast.error("Spolupráci se nepodařilo ukončit. Zkuste to znovu."),
  })

  return (
    <ConfirmDestructiveDialog
      title="Ukončit spolupráci?"
      description={
        props.clientId
          ? `Ukončíte spolupráci s klientem ${props.clientName} a ztratíte přístup ke všem jeho sdíleným psům. Psovodovi zůstanou plány, tréninky, záznamy i vaše odpovědi.`
          : `Trenér ${props.trainerName} okamžitě ztratí přístup ke psovi ${props.dogName}. Plán, tréninky, záznamy i odpovědi trenéra vám zůstanou. Sdílení ostatních psů se nezmění.`
      }
      confirmLabel="Ukončit spolupráci"
      onConfirm={() => {
        if (!mutation.isPending) mutation.mutate()
      }}
      trigger={
        <Button
          variant="outline"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Ukončování…" : "Ukončit spolupráci"}
        </Button>
      }
    />
  )
}
