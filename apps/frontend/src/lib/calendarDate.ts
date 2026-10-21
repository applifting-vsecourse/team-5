import { addDays, format, getDay, isSameMonth, isValid, parseISO, startOfWeek } from "date-fns"
import { cs } from "date-fns/locale"

// Trainings are planned for a day, not a moment: the API speaks in plain
// calendar dates ("2026-10-22"). These helpers keep them as local days, so a
// date never shifts by a time zone on the way to the screen.
export type CalendarDate = string

export const toCalendarDate = (date: Date): CalendarDate => format(date, "yyyy-MM-dd")

export const fromCalendarDate = (calendarDate: CalendarDate): Date => parseISO(calendarDate)

export const todayCalendarDate = (): CalendarDate => toCalendarDate(new Date())

// A real day written as YYYY-MM-DD, e.g. from a URL ("2026-02-30" is not one).
export const isCalendarDate = (value: unknown): value is CalendarDate =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValid(parseISO(value)) &&
  toCalendarDate(parseISO(value)) === value

// Weeks start on Monday, as in the Czech calendar.
export const startOfWeekOf = (calendarDate: CalendarDate): CalendarDate =>
  toCalendarDate(startOfWeek(fromCalendarDate(calendarDate), { weekStartsOn: 1 }))

export const addCalendarDays = (calendarDate: CalendarDate, days: number): CalendarDate =>
  toCalendarDate(addDays(fromCalendarDate(calendarDate), days))

export const daysOfWeek = (weekStart: CalendarDate): CalendarDate[] =>
  Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index))

// "19.–25. října", or "26. října – 1. listopadu" across months.
export const formatWeekRange = (weekStart: CalendarDate): string => {
  const start = fromCalendarDate(weekStart)
  const end = addDays(start, 6)
  return isSameMonth(start, end)
    ? `${format(start, "d.")}–${format(end, "d. MMMM", { locale: cs })}`
    : `${format(start, "d. MMMM", { locale: cs })} – ${format(end, "d. MMMM", { locale: cs })}`
}

// "čtvrtek 22. 10."
export const formatDayLong = (calendarDate: CalendarDate): string =>
  format(fromCalendarDate(calendarDate), "EEEE d. M.", { locale: cs })

// After "na" Czech needs the accusative: "na středu 21. 10.", "na neděli 25. 10.".
// date-fns only knows the nominative, so the weekday is looked up here
// (getDay: 0 = Sunday).
const WEEKDAYS_ACCUSATIVE = [
  "neděli",
  "pondělí",
  "úterý",
  "středu",
  "čtvrtek",
  "pátek",
  "sobotu",
] as const

export const formatDayAccusative = (calendarDate: CalendarDate): string => {
  const date = fromCalendarDate(calendarDate)
  return `${WEEKDAYS_ACCUSATIVE[getDay(date)]} ${format(date, "d. M.")}`
}

// "Čt", "22"
export const formatWeekdayShort = (calendarDate: CalendarDate): string => {
  const weekday = format(fromCalendarDate(calendarDate), "EEEEEE", { locale: cs })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

export const formatDayOfMonth = (calendarDate: CalendarDate): string =>
  format(fromCalendarDate(calendarDate), "d")
