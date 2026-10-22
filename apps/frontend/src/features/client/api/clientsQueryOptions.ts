import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { clientKeys } from "./clientKeys"
import { clientSchema, clientsSchema, invitationsSchema } from "./clientSchemas"

export function clientsQueryOptions() {
  return queryOptions({
    queryKey: clientKeys.lists(),
    queryFn: async () => {
      const json = await api.get("clients").json()
      return clientsSchema.parse(json)
    },
  })
}

export function clientDetailQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: clientKeys.detail(clientId),
    queryFn: async () => {
      const json = await api.get(`clients/${clientId}`).json()
      return clientSchema.parse(json)
    },
    enabled: Boolean(clientId),
  })
}

export function clientInvitationsQueryOptions() {
  return queryOptions({
    queryKey: clientKeys.invitations(),
    queryFn: async () => {
      const json = await api.get("clients/invitations").json()
      return invitationsSchema.parse(json)
    },
  })
}
