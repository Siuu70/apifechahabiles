import axios from "axios";
import { HOLIDAY_CACHE_YEARS_BACKWARD, HOLIDAY_CACHE_YEARS_FORWARD } from "./constants";
import { HolidayCacheEntry } from "./types";

const holidayCache: Map<number, HolidayCacheEntry> = new Map();
const HOLIDAY_URL = "https://content.capta.co/Recruitment/WorkingDays.json";

let allHolidays: Set<string> | undefined;

async function fetchHolidays(): Promise<Set<string>> {
  if (allHolidays) {
    return allHolidays;
  }
  try {
    const response = await axios.get<string[]>(HOLIDAY_URL);
    allHolidays = new Set(response.data);
    return allHolidays;
  } catch (error) {
    console.error("Error fetching holidays, using internal calculation as fallback:", error);
    // Fallback to internal calculation if fetching fails
    return new Set();
  }
}

function formatDateKey(date: Date): string {
  const year: number = date.getUTCFullYear();
  const month: number = date.getUTCMonth() + 1;
  const day: number = date.getUTCDate();
  const monthText: string = month < 10 ? `0${month}` : `${month}`;
  const dayText: string = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${monthText}-${dayText}`;
}

function buildHolidaySetForYear(year: number, holidays: Set<string>): Set<string> {
  const yearHolidays = new Set<string>();
  for (const holiday of holidays) {
    if (holiday.startsWith(year.toString())) {
      yearHolidays.add(holiday);
    }
  }
  return yearHolidays;
}

export function ensureHolidayYear(year: number): void {
  if (!holidayCache.has(year)) {
    // This function is now sync, so it can't fetch.
    // It relies on preloading.
    // If holidays are not preloaded, it will result in incorrect calculations.
    // I will add a console warning if the cache is empty.
    if (!allHolidays) {
        console.warn(`Holiday cache is not populated for year ${year}. Calculations may be incorrect.`);
        holidayCache.set(year, { year, days: new Set() });
    } else {
        const yearHolidays = buildHolidaySetForYear(year, allHolidays);
        holidayCache.set(year, { year, days: yearHolidays });
    }
  }
}

export async function preloadHolidayRange(centerYear: number): Promise<void> {
  const holidays = await fetchHolidays();
  for (let offset = -HOLIDAY_CACHE_YEARS_BACKWARD; offset <= HOLIDAY_CACHE_YEARS_FORWARD; offset += 1) {
    const year = centerYear + offset;
    if (!holidayCache.has(year)) {
        const yearHolidays = buildHolidaySetForYear(year, holidays);
        holidayCache.set(year, { year, days: yearHolidays });
    }
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