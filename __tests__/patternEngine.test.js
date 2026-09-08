import {
  isDayConcerning,
  isDayNormal,
  computeBaselineMetrics,
  computeAlertLevel,
  computeCombinationAlertLevel,
  computeFinalAlertLevel,
} from '../lib/patternEngine';

// ─── isDayConcerning ──────────────────────────────────────────────────────────

describe('isDayConcerning', () => {
  test('true when any check-in is concerning', () => {
    expect(isDayConcerning([
      { input_classification: 'normal' },
      { input_classification: 'concerning' },
    ])).toBe(true);
  });

  test('true for health_event', () => {
    expect(isDayConcerning([{ input_classification: 'health_event' }])).toBe(true);
  });

  test('false when all normal', () => {
    expect(isDayConcerning([{ input_classification: 'normal' }])).toBe(false);
  });

  test('false when all irrelevant', () => {
    expect(isDayConcerning([{ input_classification: 'irrelevant' }])).toBe(false);
  });
});

// ─── isDayNormal ──────────────────────────────────────────────────────────────

describe('isDayNormal', () => {
  test('true for a normal check-in', () => {
    expect(isDayNormal([{ input_classification: 'normal' }])).toBe(true);
  });

  test('false when any check-in is concerning', () => {
    expect(isDayNormal([
      { input_classification: 'normal' },
      { input_classification: 'concerning' },
    ])).toBe(false);
  });

  test('false for health_event', () => {
    expect(isDayNormal([{ input_classification: 'health_event' }])).toBe(false);
  });

  test('true for irrelevant-only day — irrelevant counts as non-concerning', () => {
    expect(isDayNormal([{ input_classification: 'irrelevant' }])).toBe(true);
  });
});

// ─── computeBaselineMetrics ───────────────────────────────────────────────────

describe('computeBaselineMetrics', () => {
  test('empty check-in list returns zero metrics and inactive baseline', () => {
    const result = computeBaselineMetrics([]);
    expect(result.total_days).toBe(0);
    expect(result.normal_days).toBe(0);
    expect(result.concerning_days).toBe(0);
    expect(result.baseline_active).toBe(false);
    expect(result.consecutive_concerning_days).toBe(0);
    expect(result.last_day_classification).toBeNull();
  });

  test('2 normal days — baseline_active is false', () => {
    const checkIns = [
      { input_classification: 'normal', created_at: '2026-09-06T10:00:00Z' },
      { input_classification: 'normal', created_at: '2026-09-07T10:00:00Z' },
    ];
    expect(computeBaselineMetrics(checkIns).baseline_active).toBe(false);
  });

  test('3 normal days — baseline_active is true', () => {
    const checkIns = [
      { input_classification: 'normal', created_at: '2026-09-05T10:00:00Z' },
      { input_classification: 'normal', created_at: '2026-09-06T10:00:00Z' },
      { input_classification: 'normal', created_at: '2026-09-07T10:00:00Z' },
    ];
    const result = computeBaselineMetrics(checkIns);
    expect(result.baseline_active).toBe(true);
    expect(result.total_days).toBe(3);
    expect(result.normal_days).toBe(3);
    expect(result.concerning_days).toBe(0);
  });

  test('multiple check-ins same day — day is concerning if any one is concerning', () => {
    const checkIns = [
      { input_classification: 'normal',     created_at: '2026-09-07T08:00:00Z' },
      { input_classification: 'concerning', created_at: '2026-09-07T18:00:00Z' },
      { input_classification: 'normal',     created_at: '2026-09-06T10:00:00Z' },
      { input_classification: 'normal',     created_at: '2026-09-05T10:00:00Z' },
    ];
    const result = computeBaselineMetrics(checkIns);
    expect(result.total_days).toBe(3);
    expect(result.concerning_days).toBe(1);
    expect(result.normal_days).toBe(2);
  });

  test('consecutive_concerning_days stops at the first non-concerning day', () => {
    const checkIns = [
      { input_classification: 'concerning', created_at: '2026-09-07T10:00:00Z' },
      { input_classification: 'concerning', created_at: '2026-09-06T10:00:00Z' },
      { input_classification: 'normal',     created_at: '2026-09-05T10:00:00Z' }, // gap
      { input_classification: 'concerning', created_at: '2026-09-04T10:00:00Z' }, // not counted
    ];
    const result = computeBaselineMetrics(checkIns);
    expect(result.consecutive_concerning_days).toBe(2);
  });

  test('normal_rate and concerning_rate are correct', () => {
    const checkIns = [
      { input_classification: 'normal',     created_at: '2026-09-07T10:00:00Z' },
      { input_classification: 'normal',     created_at: '2026-09-06T10:00:00Z' },
      { input_classification: 'concerning', created_at: '2026-09-05T10:00:00Z' },
    ];
    const result = computeBaselineMetrics(checkIns);
    expect(result.normal_rate).toBeCloseTo(2 / 3);
    expect(result.concerning_rate).toBeCloseTo(1 / 3);
  });
});

// ─── computeAlertLevel (no treatment) ────────────────────────────────────────

describe('computeAlertLevel — no treatment', () => {
  test('null when ccd is 0', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 0, total_days: 5 })).toBeNull();
  });

  test('null when ccd is 1', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 1, total_days: 5 })).toBeNull();
  });

  test('null when ccd is 2 but total_days is only 2', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 2, total_days: 2 })).toBeNull();
  });

  test('level 1: ccd=2, total_days=3', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 2, total_days: 3 })).toBe(1);
  });

  test('null when ccd is 3 but total_days is only 2', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 3, total_days: 2 })).toBeNull();
  });

  test('level 2: ccd=3, total_days=3', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 3, total_days: 3 })).toBe(2);
  });

  test('level 2: ccd=4, total_days=3 — ccd<5 so cannot reach level 3', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 4, total_days: 3 })).toBe(2);
  });

  test('level 3: ccd=5, total_days=5', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 5, total_days: 5 })).toBe(3);
  });
});

// ─── computeAlertLevel (treatment active) ────────────────────────────────────

describe('computeAlertLevel — treatment active', () => {
  test('null when ccd is 1 even with treatment', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 1, total_days: 1 }, true)).toBeNull();
  });

  test('level 1: ccd=2 regardless of total_days', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 2, total_days: 1 }, true)).toBe(1);
  });

  test('level 2: ccd=3 regardless of total_days', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 3, total_days: 2 }, true)).toBe(2);
  });

  test('level 3: ccd=5 regardless of total_days', () => {
    expect(computeAlertLevel({ consecutive_concerning_days: 5, total_days: 3 }, true)).toBe(3);
  });
});

// ─── computeCombinationAlertLevel ─────────────────────────────────────────────

describe('computeCombinationAlertLevel', () => {
  test('level 2: 3+ low signals today with total_days >= 3 (immediate rule)', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 3, consecutive_combination_days: 0, total_days: 3 })).toBe(2);
  });

  test('null: 3 low signals today but total_days only 2', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 3, consecutive_combination_days: 0, total_days: 2 })).toBeNull();
  });

  test('null: 2 low signals today — below immediate threshold', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 2, consecutive_combination_days: 0, total_days: 5 })).toBeNull();
  });

  test('level 2: ccfd=3 with total_days >= 5', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 0, consecutive_combination_days: 3, total_days: 5 })).toBe(2);
  });

  test('level 1: ccfd=3 but total_days only 4 — level 2 blocked, falls through to ccfd>=2 rule', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 0, consecutive_combination_days: 3, total_days: 4 })).toBe(1);
  });

  test('level 1: ccfd=2 with total_days >= 3', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 0, consecutive_combination_days: 2, total_days: 3 })).toBe(1);
  });

  test('null: ccfd=2 but total_days only 2', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 0, consecutive_combination_days: 2, total_days: 2 })).toBeNull();
  });

  test('null: ccfd=1 — below all thresholds', () => {
    expect(computeCombinationAlertLevel({ low_signal_count_today: 0, consecutive_combination_days: 1, total_days: 5 })).toBeNull();
  });
});

// ─── computeFinalAlertLevel ───────────────────────────────────────────────────

describe('computeFinalAlertLevel', () => {
  test('null when both rules return null', () => {
    expect(computeFinalAlertLevel({
      consecutive_concerning_days: 0,
      total_days: 3,
      consecutive_combination_days: 0,
      low_signal_count_today: 0,
    })).toBeNull();
  });

  test('takes the higher level when combination rule exceeds consecutive rule', () => {
    // alertLevel=1 (ccd=2, totalDays=5), combinationAlertLevel=2 (ccfd=3, totalDays=5) → 2
    expect(computeFinalAlertLevel({
      consecutive_concerning_days: 2,
      total_days: 5,
      consecutive_combination_days: 3,
      low_signal_count_today: 0,
    })).toBe(2);
  });

  test('takes the higher level when consecutive rule exceeds combination rule', () => {
    // alertLevel=3 (ccd=5, totalDays=5), combinationAlertLevel=1 (ccfd=2, totalDays=3) → 3
    expect(computeFinalAlertLevel({
      consecutive_concerning_days: 5,
      total_days: 5,
      consecutive_combination_days: 2,
      low_signal_count_today: 0,
    })).toBe(3);
  });

  test('returns combination level when consecutive rule returns null', () => {
    // alertLevel=null (ccd=1), combinationAlertLevel=1 (ccfd=2, totalDays=3) → 1
    expect(computeFinalAlertLevel({
      consecutive_concerning_days: 1,
      total_days: 3,
      consecutive_combination_days: 2,
      low_signal_count_today: 0,
    })).toBe(1);
  });
});
