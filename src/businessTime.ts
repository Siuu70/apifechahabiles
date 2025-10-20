import {
  LUNCH_END_MINUTES,
  LUNCH_START_MINUTES,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  TIME_ZONE_OFFSET_MINUTES,
  WORK_END_MINUTES,
  WORK_START_MINUTES,
} from "./constants";
import { isBusinessDay } from "./holidays";

function toMinutesInDay(localTimestamp: number): number {
  const date: Date = new Date(localTimestamp);
  return date.getUTCHours() * MINUTES_PER_HOUR + date.getUTCMinutes();
}

function setMinutesInDay(localTimestamp: number, minutes: number): number {
  const date: Date = new Date(localTimestamp);
  const hours: number = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins: number = minutes % MINUTES_PER_HOUR;
  date.setUTCHours(hours, mins, 0, 0);
  return date.getTime();
}

function addMinutes(localTimestamp: number, minutes: number): number {
  return localTimestamp + minutes * MILLISECONDS_PER_MINUTE;
}

function moveToPreviousBusinessDayEnd(localTimestamp: number): number {
  let cursor: number = localTimestamp;
  while (true) {
    cursor = setMinutesInDay(cursor, WORK_END_MINUTES);
    if (isBusinessDay(cursor)) {
      return cursor;
    }
    cursor -= MILLISECONDS_PER_DAY;
  }
}

function moveToNextBusinessDayStart(localTimestamp: number): number {
  let cursor: number = localTimestamp + MILLISECONDS_PER_DAY;
  while (!isBusinessDay(cursor)) {
    cursor += MILLISECONDS_PER_DAY;
  }
  return setMinutesInDay(cursor, WORK_START_MINUTES);
}

function moveToNextWorkingSlot(localTimestamp: number): number {
  const minutes: number = toMinutesInDay(localTimestamp);
  if (minutes < WORK_START_MINUTES) {
    return setMinutesInDay(localTimestamp, WORK_START_MINUTES);
  }
  if (minutes >= WORK_END_MINUTES) {
    return moveToNextBusinessDayStart(localTimestamp);
  }
  if (minutes >= LUNCH_START_MINUTES && minutes < LUNCH_END_MINUTES) {
    return setMinutesInDay(localTimestamp, LUNCH_END_MINUTES);
  }
  return localTimestamp;
}

function isWithinWorkingMinutes(minutes: number): boolean {
  if (minutes >= WORK_START_MINUTES && minutes < LUNCH_START_MINUTES) {
    return true;
  }
  if (minutes >= LUNCH_END_MINUTES && minutes < WORK_END_MINUTES) {
    return true;
  }
  return false;
}

function endOfCurrentIntervalMinutes(minutes: number): number {
  if (minutes < LUNCH_START_MINUTES) {
    return LUNCH_START_MINUTES;
  }
  if (minutes < LUNCH_END_MINUTES) {
    return LUNCH_END_MINUTES;
  }
  return WORK_END_MINUTES;
}

export function utcToLocalTimestamp(utcTimestamp: number): number {
  return utcTimestamp + TIME_ZONE_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE;
}

export function localToUtcTimestamp(localTimestamp: number): number {
  return localTimestamp - TIME_ZONE_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE;
}

export function alignToPreviousWorkingMoment(localTimestamp: number): number {
  if (!isBusinessDay(localTimestamp)) {
    return moveToPreviousBusinessDayEnd(localTimestamp);
  }
  const minutes: number = toMinutesInDay(localTimestamp);
  if (minutes >= WORK_END_MINUTES) {
    return setMinutesInDay(localTimestamp, WORK_END_MINUTES);
  }
  if (minutes >= LUNCH_START_MINUTES && minutes < LUNCH_END_MINUTES) {
    return setMinutesInDay(localTimestamp, LUNCH_START_MINUTES);
  }
  if (minutes < WORK_START_MINUTES) {
    return moveToPreviousBusinessDayEnd(localTimestamp - MILLISECONDS_PER_DAY);
  }
  return localTimestamp;
}

export function addBusinessDays(localTimestamp: number, days: number): number {
  if (days <= 0) {
    return localTimestamp;
  }
  let result: number = localTimestamp;
  for (let counter = 0; counter < days; counter += 1) {
    let candidate: number = result + MILLISECONDS_PER_DAY;
    while (!isBusinessDay(candidate)) {
      candidate += MILLISECONDS_PER_DAY;
    }
    result = candidate;
  }
  return result;
}

export function addBusinessHours(localTimestamp: number, hours: number): number {
  if (hours <= 0) {
    return localTimestamp;
  }
  let result: number = localTimestamp;
  let remainingMinutes: number = hours * MINUTES_PER_HOUR;

  while (remainingMinutes > 0) {
    result = moveToNextWorkingSlot(result);
    const minutes: number = toMinutesInDay(result);
    if (!isWithinWorkingMinutes(minutes)) {
      result = moveToNextBusinessDayStart(result);
      continue;
    }
    const intervalEnd: number = endOfCurrentIntervalMinutes(minutes);
    const available: number = intervalEnd - minutes;
    if (available >= remainingMinutes) {
      result = addMinutes(result, remainingMinutes);
      remainingMinutes = 0;
    } else {
      result = setMinutesInDay(result, intervalEnd);
      remainingMinutes -= available;
      if (intervalEnd === WORK_END_MINUTES) {
        result = moveToNextBusinessDayStart(result);
      }
    }
  }

  return result;
}
