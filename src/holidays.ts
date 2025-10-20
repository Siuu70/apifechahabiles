import { HOLIDAY_CACHE_YEARS_BACKWARD, HOLIDAY_CACHE_YEARS_FORWARD, MILLISECONDS_PER_DAY } from "./constants";
import { HolidayCacheEntry } from "./types";

const holidayCache: Map<number, HolidayCacheEntry> = new Map();

const mondayAdjustedDates: ReadonlyArray<[number, number]> = [
  [1, 6],
  [3, 19],
  [6, 29],
  [8, 15],
  [10, 12],
  [11, 1],
  [11, 11],
];

const fixedDates: ReadonlyArray<[number, number]> = [
  [1, 1],
  [5, 1],
  [7, 20],
  [8, 7],
  [12, 8],
  [12, 25],
];

const HOLY_THURSDAY_OFFSET: number = -3;
const GOOD_FRIDAY_OFFSET: number = -2;
const ASCENSION_OFFSET: number = 39;
const CORPUS_CHRISTI_OFFSET: number = 60;
const SACRED_HEART_OFFSET: number = 68;

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MILLISECONDS_PER_DAY);
}

function moveToNextMonday(date: Date): Date {
  const result: Date = new Date(date.getTime());
  const dayOfWeek: number = result.getUTCDay();
  const delta: number = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  result.setUTCDate(result.getUTCDate() + delta);
  return result;
}

function formatDateKey(date: Date): string {
  const year: number = date.getUTCFullYear();
  const month: number = date.getUTCMonth() + 1;
  const day: number = date.getUTCDate();
  const monthText: string = month < 10 ? `0${month}` : `${month}`;
  const dayText: string = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${monthText}-${dayText}`;
}

function calculateEasterSunday(year: number): Date {
  const a: number = year % 19;
  const b: number = Math.floor(year / 100);
  const c: number = year % 100;
  const d: number = Math.floor(b / 4);
  const e: number = b % 4;
  const f: number = Math.floor((b + 8) / 25);
  const g: number = Math.floor((b - f + 1) / 3);
  const h: number = (19 * a + b - d - g + 15) % 30;
  const i: number = Math.floor(c / 4);
  const k: number = c % 4;
  const l: number = (32 + 2 * e + 2 * i - h - k) % 7;
  const m: number = Math.floor((a + 11 * h + 22 * l) / 451);
  const month: number = Math.floor((h + l - 7 * m + 114) / 31);
  const day: number = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function buildHolidaySet(year: number): Set<string> {
  const result: Set<string> = new Set();

  for (const [month, day] of fixedDates) {
    result.add(formatDateKey(new Date(Date.UTC(year, month - 1, day))));
  }

  for (const [month, day] of mondayAdjustedDates) {
    const observed: Date = moveToNextMonday(new Date(Date.UTC(year, month - 1, day)));
    result.add(formatDateKey(observed));
  }

  const easterSunday: Date = calculateEasterSunday(year);
  const holyThursday: Date = addDaysUtc(easterSunday, HOLY_THURSDAY_OFFSET);
  const goodFriday: Date = addDaysUtc(easterSunday, GOOD_FRIDAY_OFFSET);
  result.add(formatDateKey(holyThursday));
  result.add(formatDateKey(goodFriday));

  const ascensionMonday: Date = moveToNextMonday(addDaysUtc(easterSunday, ASCENSION_OFFSET));
  const corpusChristiMonday: Date = moveToNextMonday(addDaysUtc(easterSunday, CORPUS_CHRISTI_OFFSET));
  const sacredHeartMonday: Date = moveToNextMonday(addDaysUtc(easterSunday, SACRED_HEART_OFFSET));

  result.add(formatDateKey(ascensionMonday));
  result.add(formatDateKey(corpusChristiMonday));
  result.add(formatDateKey(sacredHeartMonday));

  return result;
}

export function ensureHolidayYear(year: number): void {
  if (!holidayCache.has(year)) {
    holidayCache.set(year, { year, days: buildHolidaySet(year) });
  }
}

export function preloadHolidayRange(centerYear: number): void {
  for (let offset = -HOLIDAY_CACHE_YEARS_BACKWARD; offset <= HOLIDAY_CACHE_YEARS_FORWARD; offset += 1) {
    ensureHolidayYear(centerYear + offset);
  }
}

export function isHolidayDateKey(dateKey: string): boolean {
  const [yearText] = dateKey.split("-");
  const year: number = Number.parseInt(yearText, 10);
  ensureHolidayYear(year);
  return holidayCache.get(year)?.days.has(dateKey) ?? false;
}

export function isHolidayTimestamp(localTimestamp: number): boolean {
  const date: Date = new Date(localTimestamp);
  const dateKey: string = formatDateKey(date);
  return isHolidayDateKey(dateKey);
}

export function isBusinessDay(localTimestamp: number): boolean {
  const date: Date = new Date(localTimestamp);
  const dayOfWeek: number = date.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  return !isHolidayTimestamp(localTimestamp);
}

export function formatDateKeyFromTimestamp(localTimestamp: number): string {
  return formatDateKey(new Date(localTimestamp));
}
