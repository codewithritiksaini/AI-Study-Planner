/**
 * test_scheduling_slots.js
 *
 * Automated verification for Phase 11 Task 3:
 * 1. Time conversion utilities (HH:MM <-> minutes)
 * 2. Mathematical interval subtraction arithmetic
 * 3. generateAvailableSlots (availability - blocked - locked)
 * 4. calculateAdaptiveCapacity (observed capacity, adherence scaling, safety buffers)
 */

import {
  timeStringToMinutes,
  minutesToTimeString,
  getDayOfWeekFromDate,
  subtractIntervals,
  generateAvailableSlots
} from '../services/planner/slot.service.js';
import { calculateAdaptiveCapacity } from '../services/planner/capacity.service.js';

async function runSlotsAndCapacityTest() {
  console.log('🧪 Testing Phase 11: Slot Arithmetic & Adaptive Capacity Engine...\n');

  // --- Test 1: Time Conversion Utilities ---
  console.log('--- Test 1: Time Conversion Utilities ---');
  if (timeStringToMinutes('00:00') !== 0) throw new Error('00:00 to minutes failed');
  if (timeStringToMinutes('18:30') !== 1110) throw new Error('18:30 to minutes failed');
  if (minutesToTimeString(1110) !== '18:30') throw new Error('1110 to time string failed');
  if (minutesToTimeString(0) !== '00:00') throw new Error('0 to time string failed');
  console.log('✅ Time conversion utilities verified.');

  // --- Test 2: Interval Subtraction Arithmetic ---
  console.log('\n--- Test 2: Interval Subtraction Arithmetic ---');
  // Open: 18:00 - 21:00 (1080 - 1260 = 180 min)
  // Busy: 19:00 - 19:30 (1140 - 1170 = 30 min)
  const open = [{ start: 1080, end: 1260 }];
  const busy = [{ start: 1140, end: 1170 }];
  const result = subtractIntervals(open, busy, 20);

  if (result.length !== 2) throw new Error(`Expected 2 intervals, got ${result.length}`);
  if (result[0].start !== 1080 || result[0].end !== 1140 || result[0].duration !== 60) {
    throw new Error('First interval mismatch: expected 1080-1140 (60m)');
  }
  if (result[1].start !== 1170 || result[1].end !== 1260 || result[1].duration !== 90) {
    throw new Error('Second interval mismatch: expected 1170-1260 (90m)');
  }
  console.log('✅ Basic interval subtraction verified: 180m minus 30m busy yields [60m, 90m].');

  // Subtraction with remnant < 20 min (should be filtered out)
  // Open: 18:00 - 19:00 (1080 - 1140 = 60m), Busy: 18:00 - 18:50 (1080 - 1130 = 50m)
  // Remaining: 10m < 20m -> should be empty
  const tinyRemnant = subtractIntervals([{ start: 1080, end: 1140 }], [{ start: 1080, end: 1130 }], 20);
  if (tinyRemnant.length !== 0) throw new Error('Tiny remnant < 20m should have been pruned');
  console.log('✅ Minimum duration thresholding pruned unusable 10m fragments.');

  // --- Test 3: generateAvailableSlots End-to-End ---
  console.log('\n--- Test 3: generateAvailableSlots End-to-End ---');
  // 2026-09-28 is a Monday (day_of_week = 1)
  const testDate = '2026-09-28';
  if (getDayOfWeekFromDate(testDate) !== 1) throw new Error('2026-09-28 must be Monday');

  const availability = [
    { day_of_week: 1, start_time: '18:00', end_time: '22:00', is_active: true } // 4 hours = 240m
  ];

  const blocked = [
    { day_of_week: 1, start_time: '19:30', end_time: '20:00', reason: 'Dinner' } // 30m blocked
  ];

  const locked = [
    { plan_date: '2026-09-28', start_time: '20:30', end_time: '21:15', is_locked: true } // 45m locked
  ];

  const slots = generateAvailableSlots({
    date: testDate,
    availability,
    blockedPeriods: blocked,
    lockedSessions: locked,
    minDuration: 20
  });

  // Expected free slots:
  // 1. 18:00 - 19:30 (90m)
  // 2. 20:00 - 20:30 (30m)
  // 3. 21:15 - 22:00 (45m)
  if (slots.length !== 3) throw new Error(`Expected 3 available slots, got ${slots.length}`);
  if (slots[0].start_time !== '18:00' || slots[0].end_time !== '19:30' || slots[0].duration_minutes !== 90) {
    throw new Error('Slot 1 mismatch');
  }
  if (slots[1].start_time !== '20:00' || slots[1].end_time !== '20:30' || slots[1].duration_minutes !== 30) {
    throw new Error('Slot 2 mismatch');
  }
  if (slots[2].start_time !== '21:15' || slots[2].end_time !== '22:00' || slots[2].duration_minutes !== 45) {
    throw new Error('Slot 3 mismatch');
  }

  const totalAvailable = slots.reduce((acc, s) => acc + s.duration_minutes, 0);
  console.log(`✅ Available slots successfully generated (3 slots, ${totalAvailable} total minutes):`);
  slots.forEach((s, idx) => console.log(`   Slot ${idx + 1}: ${s.start_time} - ${s.end_time} (${s.duration_minutes}m)`));

  // --- Test 4: Adaptive Capacity Calculator ---
  console.log('\n--- Test 4: Adaptive Capacity Calculator ---');

  // Case A: Student with < 3 sessions -> uses declared max
  const contextA = {
    preferences: { max_daily_minutes: 180 },
    historical_metrics: { total_sessions: 1, observed_daily_avg_minutes: 45 }
  };
  const capA = calculateAdaptiveCapacity(contextA, 240);
  if (capA.effective_capacity_minutes !== 180 || capA.is_adapted !== false) {
    throw new Error('Case A failed: should use declared limit when sessions < 3');
  }
  console.log('✅ Case A: New student (< 3 sessions) uses declared capacity directly (180m).');

  // Case B: Student with 10 sessions, 100m daily avg, 75% adherence
  const contextB = {
    preferences: { max_daily_minutes: 180 },
    historical_metrics: {
      total_sessions: 10,
      observed_daily_avg_minutes: 100,
      plan_adherence_rate: 75
    }
  };
  // 100m * 1.15 = 115m effective capacity. Safety buffer: 115 * 0.15 = 17m. Schedulable: 98m.
  const capB = calculateAdaptiveCapacity(contextB, 240);
  if (capB.effective_capacity_minutes !== 115 || !capB.is_adapted) {
    throw new Error(`Case B failed: expected 115m effective capacity, got ${capB.effective_capacity_minutes}`);
  }
  if (capB.safety_buffer_minutes !== 17 || capB.schedulable_capacity_minutes !== 98) {
    throw new Error(`Case B buffer mismatch: buffer=${capB.safety_buffer_minutes}, schedulable=${capB.schedulable_capacity_minutes}`);
  }
  console.log('✅ Case B: Adapted to observed average (100m -> 115m effective, 17m safety buffer, 98m schedulable).');

  // Case C: Low adherence (< 50%) -> scales down to prevent failure
  const contextC = {
    preferences: { max_daily_minutes: 180 },
    historical_metrics: {
      total_sessions: 10,
      observed_daily_avg_minutes: 100,
      plan_adherence_rate: 35
    }
  };
  // 100 * 1.15 * 0.85 = 97.75 -> 98m
  const capC = calculateAdaptiveCapacity(contextC, 240);
  if (capC.effective_capacity_minutes > capB.effective_capacity_minutes) {
    throw new Error('Case C failed: low adherence should de-escalate capacity');
  }
  console.log(`✅ Case C: Low adherence scaled down capacity to ${capC.effective_capacity_minutes}m.`);

  console.log('\n🎉 Task 3: Time Slot Service & Adaptive Capacity Calculator PASSED 100%!\n');
}

runSlotsAndCapacityTest().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Slots & Capacity test failed:', err);
  process.exit(1);
});
