import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

export const WEEK_STARTS_ON = 1 as const;

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDaysToKey(key: string, amount: number): string {
  return toDateKey(addDays(parseDateKey(key), amount));
}

export function startOfWeekDate(anchor: Date): Date {
  return startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeekDate(anchor);
  const end = endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start, end });
}

export function monthDays(anchor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(anchor),
    end: endOfMonth(anchor),
  });
}

export function monthCalendarGrid(anchor: Date): { date: Date; inMonth: boolean }[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: WEEK_STARTS_ON });
  const month = anchor.getMonth();
  return eachDayOfInterval({ start, end }).map((date) => ({
    date,
    inMonth: date.getMonth() === month,
  }));
}

export function shiftWeek(anchor: Date, amount: number): Date {
  return addWeeks(anchor, amount);
}

export function shiftMonth(anchor: Date, amount: number): Date {
  return addMonths(anchor, amount);
}

export function isFutureDay(date: Date, today = new Date()): boolean {
  return isAfter(startOfDay(date), startOfDay(today));
}

export function isPastDay(date: Date, today = new Date()): boolean {
  return isBefore(startOfDay(date), startOfDay(today));
}

export function formatWeekRange(anchor: Date): string {
  const days = weekDays(anchor);
  const start = days[0];
  const end = days[days.length - 1];
  if (!start || !end) return "";
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function formatMonthLabel(anchor: Date): string {
  return format(anchor, "MMMM yyyy");
}

export function formatLongDate(date: Date): string {
  return format(date, "EEEE, d MMMM");
}

export function weekdayLabel(date: Date, narrow = false): string {
  return format(date, narrow ? "EEEEE" : "EEE");
}

export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export { isToday, isSameDay, subDays, startOfDay, startOfMonth, endOfMonth };
