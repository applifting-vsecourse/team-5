import ky, { HTTPError } from "ky"

import { env } from "@/config/env"
import { queryClient } from "@/config/react-query"
import { authKeys } from "@/lib/auth-keys"

// Single shared HTTP client. Per the Applifting frontend playbook:
// - send credentials so better-auth's session cookie travels with every request
// - on 401 invalidate the auth session query so route loaders re-resolve auth
//   and redirect through the login flow
// - turn API errors into readable messages (see beforeError below)
//
// Paths are joined onto `prefix`, and a leading slash is normalised away, so
// both `api.get("dogs")` and `api.get("/dogs")` hit the same endpoint.
export const api = ky.create({
  prefix: env.VITE_API_URL,
  credentials: "include",
  retry: { limit: 0 },
  hooks: {
    // NestJS returns { message: string | string[] } on validation failures.
    // Without this the user would see ky's generic "Request failed with status
    // code 400" and never learn what was actually wrong.
    beforeError: [
      async ({ error }) => {
        if (!(error instanceof HTTPError)) return error
        try {
          const raw: unknown = await error.response.clone().json()
          if (raw && typeof raw === "object") {
            const rawMessage: unknown = Reflect.get(raw, "message")
            const message = Array.isArray(rawMessage)
              ? rawMessage.filter((part): part is string => typeof part === "string").join(", ")
              : typeof rawMessage === "string"
                ? rawMessage
                : null
            if (message) error.message = message
          }
        } catch {
          // response had no JSON body — keep ky's default message
        }
        return error
      },
    ],
    afterResponse: [
      ({ response }) => {
        if (response.status === 401) {
          void queryClient.invalidateQueries({ queryKey: authKeys.session() })
        }
      },
    ],
  },
})

export { HTTPError }
