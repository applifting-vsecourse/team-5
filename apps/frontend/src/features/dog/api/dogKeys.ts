export const dogKeys = {
  all: ["dogs"] as const,
  lists: () => [...dogKeys.all, "list"] as const,
  details: () => [...dogKeys.all, "detail"] as const,
  detail: (id: string) => [...dogKeys.details(), id] as const,
}
