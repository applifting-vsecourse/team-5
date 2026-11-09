type GoalTrainingProgressInput = {
  sessions: {
    scheduledTrainings?: { id: string; date: Date; status: "PLANNED" | "COMPLETED" | "SKIPPED" }[]
    workoutLogs?: { id: string; completedAt: Date }[]
  }[]
}

export function goalTrainingProgress(goal: GoalTrainingProgressInput) {
  const trainings = goal.sessions
    .flatMap((session) => [
      ...(session.scheduledTrainings ?? []),
      ...(session.workoutLogs ?? []).map((log) => ({
        id: log.id,
        date: log.completedAt,
        status: "COMPLETED" as const,
      })),
    ])
    .filter((training) => training.status !== "SKIPPED")
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const completed = trainings.filter((training) => training.status === "COMPLETED").length
  const planned = trainings.length - completed
  return {
    trainings,
    completed,
    planned,
    total: trainings.length,
    percent: trainings.length ? Math.round((completed / trainings.length) * 100) : 0,
  }
}
