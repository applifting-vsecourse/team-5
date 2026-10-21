export const dogKeys = {
  all: ["dogs"] as const,
  lists: () => [...dogKeys.all, "list"] as const,
  details: () => [...dogKeys.all, "detail"] as const,
  detail: (id: string) => [...dogKeys.details(), id] as const,
  goals: (dogId: string) => [...dogKeys.detail(dogId), "goals"] as const,
  goal: (goalId: string) => [...dogKeys.all, "goal", goalId] as const,
  activities: (dogId: string) => [...dogKeys.detail(dogId), "activities"] as const,
}
