import { useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api-client"
import { replyKeys, type UnreadReply } from "@/lib/trainingReplies"

// The server only removes these IDs. It cannot consume a message that arrived
// between loading the displayed record and this acknowledgement.
export function useReadTrainingReplies(replyIds: string[] | undefined) {
  const queryClient = useQueryClient()
  const attempted = useRef("")
  const snapshot = JSON.stringify(replyIds ?? [])
  const mutation = useMutation({
    mutationFn: (ids: string[]) => api.post("training-replies/read", { json: { replyIds: ids } }),
    onSuccess: (_response, ids) => {
      const acknowledged = new Set(ids)
      queryClient.setQueryData<UnreadReply[]>(replyKeys.unread, (current) =>
        current?.filter((reply) => !acknowledged.has(reply.id)),
      )
      void queryClient.invalidateQueries({ queryKey: replyKeys.unread })
    },
  })
  const { mutate } = mutation
  useEffect(() => {
    if (snapshot !== "[]" && attempted.current !== snapshot) {
      attempted.current = snapshot
      mutate(JSON.parse(snapshot) as string[])
    }
  }, [snapshot, mutate])
  return { ...mutation, retry: () => mutate(replyIds ?? []) }
}
