import { z } from "zod"

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
  }),
  goal: z.object({
    id: z.string(),
    title: z.string(),
  }),
  exercises: z.array(trainingDetailExerciseSchema),
})

export type TrainingDetail = z.infer<typeof trainingDetailSchema>
