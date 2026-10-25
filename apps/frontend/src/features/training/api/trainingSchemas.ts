import { z } from "zod"

export const focusLevelSchema = z.enum(["YES", "PARTIALLY", "NO"])
export type FocusLevel = z.infer<typeof focusLevelSchema>

export const mistakeLevelSchema = z.enum(["YES", "PARTIALLY", "NO"])
export type MistakeLevel = z.infer<typeof mistakeLevelSchema>

export const completeTrainingInputSchema = z.object({
  successRate: z.number().int().min(0).max(100).optional(),
  focus: focusLevelSchema.optional(),
  repeatedMistakes: mistakeLevelSchema.optional(),
  note: z.string().max(2000).optional(),
})

export type CompleteTrainingInput = z.infer<typeof completeTrainingInputSchema>

export const completedActivitySchema = z.object({
  id: z.string(),
  dogId: z.string().optional(),
  title: z.string(),
  discipline: z.string().nullable().optional(),
  status: z.string(),
  completedAt: z.coerce.date().optional(),
  successRate: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  focus: focusLevelSchema.nullable().optional(),
  repeatedMistakes: mistakeLevelSchema.nullable().optional(),
  note: z.string().nullable().optional(),
})

export type CompletedActivity = z.infer<typeof completedActivitySchema>

export const trainingDetailExerciseSchema = z.object({
  id: z.string(),
  position: z.number(),
  title: z.string(),
  instruction: z.string().nullable(),
  criterion: z.string().nullable(),
})

export type TrainingDetailExercise = z.infer<typeof trainingDetailExerciseSchema>

export const trainingDetailSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PLANNED", "COMPLETED", "SKIPPED"]),
  dog: z.object({
    id: z.string(),
    name: z.string(),
    color: z.number(),
    hasTrainer: z.boolean().optional(),
  }),
  goal: z.object({
    id: z.string(),
    title: z.string(),
  }),
  exercises: z.array(trainingDetailExerciseSchema),
})

export type TrainingDetail = z.infer<typeof trainingDetailSchema>
