/**
 * study-metrics.service.js
 *
 * Deterministic calculation engine for study session statistics, active vs. inactive days,
 * study consistency percentages, daily time series, and streak calculations.
 */

/**
 * Formats a date object/string to YYYY-MM-DD in the specified timezone.
 *
 * @param {string | Date} dateInput
 * @param {string} timezone
 * @returns {string} YYYY-MM-DD
 */
export function getLocalDateString(dateInput, timezone = 'UTC') {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/**
 * Computes current and longest study streak in days.
 *
 * @param {Set<string>} activeDateSet - Set of YYYY-MM-DD strings with >0 study minutes
 * @param {string} referenceDateStr - Today's date in student timezone (YYYY-MM-DD)
 * @returns {{ current_streak: number, longest_streak: number }}
 */
export function calculateStreaks(activeDateSet, referenceDateStr) {
  if (!activeDateSet || activeDateSet.size === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  // 1. Longest streak across all dates
  const sortedDates = Array.from(activeDateSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const curr = new Date(dateStr + 'T00:00:00Z');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curr.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curr;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // 2. Current streak ending today or yesterday
  let currentStreak = 0;
  let checkDate = new Date(referenceDateStr + 'T00:00:00Z');

  const studiedToday = activeDateSet.has(referenceDateStr);
  if (!studiedToday) {
    // Check if student studied yesterday
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (!activeDateSet.has(yesterdayStr)) {
      return { current_streak: 0, longest_streak: longestStreak };
    }
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDateSet.has(dateStr)) {
      currentStreak += 1;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak)
  };
}

/**
 * Calculates comprehensive study metrics from an array of study session records.
 *
 * @param {Array<Object>} sessions - Raw study session rows
 * @param {number} periodDays - Lookback window in calendar days (e.g. 7, 14, 30, 90)
 * @param {string} timezone - Student timezone string (e.g. 'Asia/Kolkata', 'UTC')
 * @param {string} [referenceDate] - Optional override for current date (YYYY-MM-DD)
 * @returns {Object} Structured study metrics
 */
export function calculateStudyMetrics(sessions = [], periodDays = 30, timezone = 'UTC', referenceDate = null) {
  const safePeriod = Math.max(1, Math.min(365, Number(periodDays) || 30));
  const todayStr = referenceDate || getLocalDateString(new Date(), timezone);

  let totalMinutes = 0;
  let longestSession = 0;
  const dayTotalsMap = new Map();
  const sessionCount = sessions.length;

  for (const s of sessions) {
    const mins = Math.max(0, Number(s.duration_minutes) || 0);
    totalMinutes += mins;
    if (mins > longestSession) {
      longestSession = mins;
    }

    const localDay = getLocalDateString(s.started_at, timezone);
    if (localDay) {
      dayTotalsMap.set(localDay, (dayTotalsMap.get(localDay) || 0) + mins);
    }
  }

  // Identify active days (days with > 0 minutes)
  const activeDateSet = new Set();
  for (const [day, mins] of dayTotalsMap.entries()) {
    if (mins > 0) {
      activeDateSet.add(day);
    }
  }

  const activeDays = activeDateSet.size;
  const inactiveDays = Math.max(0, safePeriod - activeDays);
  const consistencyPercentage = Math.min(100, Math.round((activeDays / safePeriod) * 100));

  const averageMinutesPerCalendarDay = Number((totalMinutes / safePeriod).toFixed(1));
  const averageMinutesPerActiveDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const averageSessionMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  // Calculate streaks
  const { current_streak, longest_streak } = calculateStreaks(activeDateSet, todayStr);

  // Generate daily time series for the lookback window
  const daily = [];
  const startD = new Date(todayStr + 'T00:00:00Z');
  startD.setUTCDate(startD.getUTCDate() - (safePeriod - 1));

  for (let i = 0; i < safePeriod; i++) {
    const cur = new Date(startD);
    cur.setUTCDate(cur.getUTCDate() + i);
    const dStr = cur.toISOString().split('T')[0];
    const dayMins = dayTotalsMap.get(dStr) || 0;
    daily.push({
      date: dStr,
      minutes: dayMins,
      hours: Number((dayMins / 60).toFixed(2))
    });
  }

  return {
    available: sessionCount > 0,
    total_minutes: totalMinutes,
    total_hours: totalHours,
    session_count: sessionCount,
    average_session_minutes: averageSessionMinutes,
    longest_session_minutes: longestSession,
    active_days: activeDays,
    inactive_days: inactiveDays,
    total_days: safePeriod,
    average_minutes_per_calendar_day: averageMinutesPerCalendarDay,
    average_minutes_per_active_day: averageMinutesPerActiveDay,
    consistency_percentage: consistencyPercentage,
    current_streak,
    longest_streak,
    daily
  };
}
