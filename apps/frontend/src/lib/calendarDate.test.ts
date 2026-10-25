import { describe, expect, it } from "vitest"

import {
  addCalendarDays,
  daysOfWeek,
  formatDayAccusative,
  formatDayLong,
  formatMonthYear,
  formatWeekdayShort,
  formatWeekRange,
  getMonthWeeks,
  isCalendarDate,
  startOfWeekOf,
} from "./calendarDate"

describe("calendarDate", () => {
  it("starts the week on Monday", () => {
    expect(startOfWeekOf("2026-10-22")).toBe("2026-10-19")
    expect(startOfWeekOf("2026-10-25")).toBe("2026-10-19")
    expect(startOfWeekOf("2026-10-19")).toBe("2026-10-19")
  })

  it("lists the seven days of a week", () => {
    expect(daysOfWeek("2026-10-19")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ])
  })

  it("moves across months and the daylight saving change", () => {
    // Summer time ends in the night to 25 Oct 2026.
    expect(addCalendarDays("2026-10-24", 2)).toBe("2026-10-26")
    expect(addCalendarDays("2026-10-31", 1)).toBe("2026-11-01")
  })

  it("formats a week range in Czech", () => {
    expect(formatWeekRange("2026-10-19")).toBe("19.–25. října")
    expect(formatWeekRange("2026-10-26")).toBe("26. října – 1. listopadu")
  })

  it("formats a day in Czech", () => {
    expect(formatDayLong("2026-10-22")).toBe("čtvrtek 22. 10.")
    expect(formatWeekdayShort("2026-10-22")).toBe("Čt")
  })

  it("recognises a real calendar date", () => {
    expect(isCalendarDate("2026-10-19")).toBe(true)
    expect(isCalendarDate("2026-02-30")).toBe(false)
    expect(isCalendarDate("19.10.2026")).toBe(false)
    expect(isCalendarDate(undefined)).toBe(false)
    expect(isCalendarDate(20261019)).toBe(false)
  })

  it("uses the accusative after 'na'", () => {
    expect(formatDayAccusative("2026-10-21")).toBe("středu 21. 10.")
    expect(formatDayAccusative("2026-10-22")).toBe("čtvrtek 22. 10.")
    expect(formatDayAccusative("2026-10-24")).toBe("sobotu 24. 10.")
    expect(formatDayAccusative("2026-10-25")).toBe("neděli 25. 10.")
  })

  it("formats month and year and computes all weeks covering a month", () => {
    expect(formatMonthYear(new Date(2026, 9, 1))).toBe("Říjen 2026")
    const weeks = getMonthWeeks(new Date(2026, 9, 1))
    expect(weeks).toEqual(["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"])
  })
})
