import { SeedTrainingCalendar } from './seed-training-calendar';

const today = new Date('2026-11-09T00:00:00Z');
const DAY_MS = 86_400_000;

function examplePlan(): { dogId: string; date: Date }[] {
  const calendar = new SeedTrainingCalendar(today, []);
  const result: { dogId: string; date: Date }[] = [];
  for (const dogId of ['dog-rex-1', 'dog-baryk-1']) {
    for (let g = 0; g < 3; g++) {
      for (let t = 0; t < 4; t++) {
        for (let n = 3; n < 7; n++) {
          const id = `seed-${dogId}-goal-${g}-training-${t}-date-${n}`;
          result.push({
            dogId,
            date: calendar.allocate(id, 'jan', dogId, true),
          });
        }
      }
    }
  }
  return result;
}

describe('SeedTrainingCalendar', () => {
  it('mixes one/two-training days and rest days across all of an owner’s dogs', () => {
    const plan = examplePlan();
    const days = new Map<number, string[]>();
    for (const training of plan) {
      const key = training.date.getTime();
      days.set(key, [...(days.get(key) ?? []), training.dogId]);
    }
    expect(plan).toHaveLength(96);
    expect([...days.values()].every((dogs) => dogs.length <= 2)).toBe(true);
    expect(
      [...days.values()].every((dogs) => new Set(dogs).size === dogs.length),
    ).toBe(true);
    expect([...days.values()].some((dogs) => dogs.length === 2)).toBe(true);
    expect([...days.values()].some((dogs) => dogs.length === 1)).toBe(true);
    const dates = [...days.keys()].sort((a, b) => a - b);
    expect(
      dates.some(
        (date, index) => index > 0 && date - dates[index - 1] > DAY_MS,
      ),
    ).toBe(true);
    expect(dates[0]).toBeGreaterThanOrEqual(today.getTime());
    expect(examplePlan()).toEqual(plan);
  });

  it('respects manual terms and other dogs belonging to the same owner', () => {
    const calendar = new SeedTrainingCalendar(today, [
      { ownerId: 'jan', dogId: 'rex', date: today },
      { ownerId: 'jan', dogId: 'baryk', date: today },
      {
        ownerId: 'jan',
        dogId: 'rex',
        date: new Date(today.getTime() + DAY_MS),
      },
    ]);
    expect(calendar.allocate('new', 'jan', 'rex', true).getTime()).toBe(
      today.getTime() + 2 * DAY_MS,
    );
    expect(calendar.allocate('other-owner', 'petra', 'alik', true)).toEqual(
      today,
    );
  });

  it('keeps history strictly before today and future terms from today onward', () => {
    const calendar = new SeedTrainingCalendar(today, []);
    for (let i = 0; i < 50; i++) {
      expect(
        calendar.allocate(`past-${i}`, 'jan', 'rex', false).getTime(),
      ).toBeLessThan(today.getTime());
      expect(
        calendar.allocate(`future-${i}`, 'jan', 'rex', true).getTime(),
      ).toBeGreaterThanOrEqual(today.getTime());
    }
  });
});
