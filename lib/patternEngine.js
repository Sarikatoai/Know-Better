export const SIGNAL_DIMS = ['appetite', 'energy', 'water_intake', 'demeanor', 'vomiting', 'elimination'];

export const localDayKey = (dateInput) => {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isLowSignal = (dim, values) => {
  switch (dim) {
    case 'appetite':     return values.some(v => v === 'low' || v === 'skipped');
    case 'energy':       return values.some(v => v === 'low');
    case 'water_intake': return values.some(v => v === 'low' || v === 'absent');
    case 'demeanor':     return values.some(v => v === 'low');
    case 'vomiting':     return values.some(v => v === 'once' || v === 'multiple');
    case 'elimination':  return values.some(v => v === 'irregular' || v === 'absent');
    default: return false;
  }
};

export const isDayConcerning = (rows) =>
  rows.some(r => r.input_classification === 'concerning' || r.input_classification === 'health_event');

export const isDayNormal = (rows) =>
  !isDayConcerning(rows) && rows.some(r =>
    r.input_classification === 'normal' || r.input_classification === 'irrelevant'
  );

export const groupCheckInsByDay = (checkIns) => {
  const byDay = {};
  for (const row of checkIns) {
    const day = localDayKey(row.created_at);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(row);
  }
  return byDay;
};

// Takes raw check-in rows, returns baseline metrics (no DB calls).
export const computeBaselineMetrics = (checkIns) => {
  const checkInsByDay = groupCheckInsByDay(checkIns);
  const sortedDays = Object.keys(checkInsByDay).sort().reverse();

  const normal_days = sortedDays.filter(day => isDayNormal(checkInsByDay[day])).length;
  const concerning_days = sortedDays.filter(day => isDayConcerning(checkInsByDay[day])).length;
  const total_days = normal_days + concerning_days;
  const normal_rate = total_days > 0 ? normal_days / total_days : 0;
  const concerning_rate = total_days > 0 ? concerning_days / total_days : 0;
  const last_day_classification = sortedDays.length > 0
    ? (isDayConcerning(checkInsByDay[sortedDays[0]]) ? 'concerning' : 'normal')
    : null;
  const baseline_active = total_days >= 3;

  let consecutive_concerning_days = 0;
  for (const day of sortedDays) {
    if (isDayConcerning(checkInsByDay[day])) consecutive_concerning_days++;
    else break;
  }

  return {
    total_days,
    normal_days,
    concerning_days,
    normal_rate,
    concerning_rate,
    consecutive_concerning_days,
    last_day_classification,
    baseline_active,
  };
};

// Takes raw signal rows and an optional nowMs anchor for testability.
export const computeConsecutiveCombinationDays = (signalRows, nowMs = Date.now()) => {
  const signalDayMap = {};
  for (const row of signalRows) {
    const day = localDayKey(row.created_at);
    if (!signalDayMap[day]) signalDayMap[day] = [];
    signalDayMap[day].push(row);
  }
  let consecutive_combination_days = 0;
  for (let i = 0; i < 7; i++) {
    const day = localDayKey(new Date(nowMs - i * 24 * 60 * 60 * 1000));
    const dayRows = signalDayMap[day] ?? [];
    const dayLowCount = SIGNAL_DIMS.filter(dim => {
      const vals = dayRows.map(r => r[dim]).filter(v => v != null && v !== 'null');
      return isLowSignal(dim, vals);
    }).length;
    if (dayLowCount >= 2) consecutive_combination_days++;
    else break;
  }
  return consecutive_combination_days;
};

// Consecutive concerning days rule. Returns alert level (1|2|3) or null.
export const computeAlertLevel = (baselineData, treatmentActive = false) => {
  const ccd = baselineData.consecutive_concerning_days ?? 0;
  const totalDays = baselineData.total_days ?? 0;
  if (treatmentActive) {
    if (ccd >= 5) return 3;
    if (ccd >= 3) return 2;
    if (ccd >= 2) return 1;
    return null;
  }
  if (ccd >= 5 && totalDays >= 5) return 3;
  if (ccd >= 3 && totalDays >= 3) return 2;
  if (ccd >= 2 && totalDays >= 3) return 1;
  return null;
};

// Signal combination rule. Returns alert level (1|2) or null.
export const computeCombinationAlertLevel = (baselineData) => {
  const ccfd = baselineData.consecutive_combination_days ?? 0;
  const lowCount = baselineData.low_signal_count_today ?? 0;
  const totalDays = baselineData.total_days ?? 0;
  if (lowCount >= 3 && totalDays >= 3) return 2;
  if (ccfd >= 3 && totalDays >= 5) return 2;
  if (ccfd >= 2 && totalDays >= 3) return 1;
  return null;
};

// Final level: highest from both rules.
export const computeFinalAlertLevel = (baselineData, treatmentActive = false) => {
  const a = computeAlertLevel(baselineData, treatmentActive);
  const b = computeCombinationAlertLevel(baselineData);
  return Math.max(a ?? 0, b ?? 0) || null;
};
