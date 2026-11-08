import { api } from "@/lib/api-client"

export async function verifyResetPasswordToken(token: string): Promise<boolean> {
  if (!token) return false
  const res = await api
    .get("auth/verify-reset-password-token", {
      searchParams: { token },
    })
    .json<{ valid: boolean }>()
  return res.valid === true
}
