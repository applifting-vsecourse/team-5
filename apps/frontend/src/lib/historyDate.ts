// History months and trained days are defined by the API in Europe/Prague.
const timeZone = "Europe/Prague"
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const headerFormatter = new Intl.DateTimeFormat("cs-CZ", {
  timeZone,
  weekday: "short",
  day: "numeric",
  month: "numeric",
})
const timeFormatter = new Intl.DateTimeFormat("cs-CZ", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
})
const monthFormatter = new Intl.DateTimeFormat("cs-CZ", {
  timeZone,
  month: "long",
  year: "numeric",
})

export function historyCalendarDate(date: Date): string {
  const parts = dayFormatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function formatHistoryDay(date: Date, now = new Date()): string {
  const parts = headerFormatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value
  const header = `${part("weekday").toUpperCase()} ${part("day")}. ${part("month")}.`
  return historyCalendarDate(date) === historyCalendarDate(now) ? `DNES · ${header}` : header
}

export const formatHistoryTime = (date: Date): string => timeFormatter.format(date)
export const formatHistoryMonth = (date: Date): string => monthFormatter.format(date)
