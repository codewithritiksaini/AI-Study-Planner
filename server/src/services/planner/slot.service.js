/**
 * slot.service.js
 *
 * Pure mathematical time-slot generator and interval arithmetic for Phase 11.
 * Subtracts blocked periods and locked sessions from student availability windows,
 * enforces minimum session duration thresholds, and accounts for breaks.
 */

import { schedulerConfig } from '../../config/scheduler.config.js';

/**
 * Converts a time string "HH:MM" or "HH:MM:SS" into minutes from midnight.
 *
 * @param {string} timeStr - e.g. "18:30" or "18:30:00"
 * @returns {number} Minutes from midnight (0 - 1439)
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  if (timeStr instanceof Date) {
    return timeStr.getUTCHours() * 60 + timeStr.getUTCMinutes();
  }
  if (typeof timeStr !== 'string') {
    timeStr = String(timeStr);
  }
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
  }
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into "HH:MM" string.
 *
 * @param {number} totalMinutes - Minutes from midnight
 * @returns {string} Formatted "HH:MM" string
 */
export function minutesToTimeString(totalMinutes) {
  const normalized = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Computes day of week (0=Sunday, 1=Monday ... 6=Saturday) for a YYYY-MM-DD date string.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {number} 0 - 6
 */
export function getDayOfWeekFromDate(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return date.getUTCDay();
}

/**
 * Subtracts an array of busy intervals from a list of open intervals.
 *
 * @param {Array<{ start: number, end: number }>} openIntervals - Available intervals in minutes
 * @param {Array<{ start: number, end: number }>} busyIntervals - Busy/blocked intervals in minutes
 * @param {number} minDuration - Minimum allowable duration in minutes
 * @returns {Array<{ start: number, end: number, duration: number }>} Resulting open intervals
 */
export function subtractIntervals(openIntervals, busyIntervals, minDuration = 20) {
  let currentOpen = [...openIntervals];

  for (const busy of busyIntervals) {
    const nextOpen = [];

    for (const open of currentOpen) {
      // Case 1: No overlap (busy is completely before or after open)
      if (busy.end <= open.start || busy.start >= open.end) {
        nextOpen.push(open);
        continue;
      }

      // Case 2: Left remnant (open starts before busy)
      if (open.start < busy.start) {
        const leftDuration = busy.start - open.start;
        if (leftDuration >= minDuration) {
          nextOpen.push({
            start: open.start,
            end: busy.start,
            duration: leftDuration
          });
        }
      }

      // Case 3: Right remnant (open ends after busy)
      if (open.end > busy.end) {
        const rightDuration = open.end - busy.end;
        if (rightDuration >= minDuration) {
          nextOpen.push({
            start: busy.end,
            end: open.end,
            duration: rightDuration
          });
        }
      }
    }

    currentOpen = nextOpen;
  }

  return currentOpen.map((item) => ({
    start: item.start,
    end: item.end,
    duration: item.end - item.start
  }));
}

/**
 * Generates available, unblocked study slots for a specific date.
 *
 * @param {Object} params
 * @param {string} params.date - Target date string YYYY-MM-DD
 * @param {Array<Object>} params.availability - Weekly availability schedule
 * @param {Array<Object>} [params.blockedPeriods=[]] - Blocked periods
 * @param {Array<Object>} [params.lockedSessions=[]] - Locked/fixed sessions on this date
 * @param {number} [params.minDuration] - Minimum slot duration (default from config)
 * @returns {Array<{ date: string, start_time: string, end_time: string, start_minutes: number, end_minutes: number, duration_minutes: number }>}
 */
export function generateAvailableSlots({
  date,
  availability = [],
  blockedPeriods = [],
  lockedSessions = [],
  minDuration = schedulerConfig.SESSION_BOUNDS.MIN_SESSION_MINUTES
}) {
  const dayOfWeek = getDayOfWeekFromDate(date);

  // 1. Find matching active availability windows for this day of week
  const matchingAvailabilities = availability.filter((a) => {
    return Number(a.day_of_week) === dayOfWeek && (a.is_active === undefined || a.is_active === true);
  });

  if (matchingAvailabilities.length === 0) {
    return [];
  }

  // Convert availability windows to minute intervals
  const baseOpenIntervals = matchingAvailabilities.map((a) => {
    const start = timeStringToMinutes(a.start_time);
    const end = timeStringToMinutes(a.end_time);
    return { start, end, duration: end - start };
  }).filter((w) => w.duration >= minDuration);

  // 2. Collect busy intervals for this date:
  // a) Blocked periods matching this specific date OR this recurring day of week
  const relevantBlocked = blockedPeriods.filter((b) => {
    if (b.date) {
      const bDateStr = typeof b.date === 'string' ? b.date.split('T')[0] : new Date(b.date).toISOString().split('T')[0];
      return bDateStr === date;
    }
    if (b.day_of_week !== null && b.day_of_week !== undefined) {
      return Number(b.day_of_week) === dayOfWeek;
    }
    return false;
  }).map((b) => ({
    start: timeStringToMinutes(b.start_time),
    end: timeStringToMinutes(b.end_time)
  }));

  // b) Locked sessions on this date
  const relevantLocked = lockedSessions.filter((s) => {
    const sDateStr = typeof s.plan_date === 'string' ? s.plan_date.split('T')[0] : new Date(s.plan_date).toISOString().split('T')[0];
    return sDateStr === date && s.start_time && s.end_time;
  }).map((s) => ({
    start: typeof s.start_time === 'string' && s.start_time.includes('T')
      ? new Date(s.start_time).getUTCHours() * 60 + new Date(s.start_time).getUTCMinutes()
      : timeStringToMinutes(s.start_time),
    end: typeof s.end_time === 'string' && s.end_time.includes('T')
      ? new Date(s.end_time).getUTCHours() * 60 + new Date(s.end_time).getUTCMinutes()
      : timeStringToMinutes(s.end_time)
  }));

  const allBusy = [...relevantBlocked, ...relevantLocked].sort((a, b) => a.start - b.start);

  // 3. Subtract busy intervals from base open intervals
  const freeIntervals = subtractIntervals(baseOpenIntervals, allBusy, minDuration);

  // 4. Map back to formatted time slot objects
  return freeIntervals.map((interval) => ({
    date,
    start_time: minutesToTimeString(interval.start),
    end_time: minutesToTimeString(interval.end),
    start_minutes: interval.start,
    end_minutes: interval.end,
    duration_minutes: interval.duration
  }));
}

export default {
  timeStringToMinutes,
  minutesToTimeString,
  getDayOfWeekFromDate,
  subtractIntervals,
  generateAvailableSlots
};
