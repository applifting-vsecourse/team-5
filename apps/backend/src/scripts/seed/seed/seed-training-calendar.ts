import { createHash } from 'node:crypto';

const DAY_MS = 86_400_000;
type TrainingDay = { ownerId: string; dogId: string; date: Date };

/** Only assigns dates to NEW fixtures. Existing/manual terms occupy their days. */
export class SeedTrainingCalendar {
  private readonly days = new Map<
    string,
    { count: number; dogs: Set<string> }
  >();
  private readonly cursors = new Map<string, Date>();

  constructor(
    private readonly today: Date,
    existing: TrainingDay[],
  ) {
    for (const training of existing) this.reserve(training);
  }

  allocate(
    id: string,
    ownerId: string,
    dogId: string,
    isPlanned: boolean,
  ): Date {
    const direction = isPlanned ? 1 : -1;
    const cursorKey = `${dogId}:${direction}`;
    let date = new Date(
      this.cursors.get(cursorKey) ??
        new Date(this.today.getTime() + (isPlanned ? 0 : -DAY_MS)),
    );
    for (;;) {
      const occupied = this.days.get(this.key(ownerId, date));
      if (!occupied || (occupied.count < 2 && !occupied.dogs.has(dogId))) break;
      date = new Date(date.getTime() + direction * DAY_MS);
    }
    this.reserve({ ownerId, dogId, date });
    // Stable pseudo-random gaps: fresh data looks varied without changing on deploy.
    const gap = createHash('sha256').update(id).digest()[0] % 3 === 0 ? 2 : 1;
    this.cursors.set(
      cursorKey,
      new Date(date.getTime() + direction * gap * DAY_MS),
    );
    return date;
  }

  private key(ownerId: string, date: Date): string {
    return `${ownerId}:${date.toISOString().slice(0, 10)}`;
  }

  private reserve({ ownerId, dogId, date }: TrainingDay): void {
    const key = this.key(ownerId, date);
    const day = this.days.get(key) ?? { count: 0, dogs: new Set<string>() };
    day.count++;
    day.dogs.add(dogId);
    this.days.set(key, day);
  }
}
