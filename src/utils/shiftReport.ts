export type ShiftType = 'เช้า' | 'บ่าย' | 'ดึก';

export interface ShiftTeam {
  doctor: string;
  incharge: string;
  leader: string;
  member1: string;
  member2: string;
  aemt: string;
  driver1: string;
  driver2: string;
  xrays: string;
  lab: string;
}

export interface TriageStats {
  total: number;
  r: number; // R (Resuscitation) กู้ชีพ
  e: number; // E (Emergency) ฉุกเฉิน
  u: number; // U (Urgent) เร่งด่วน
  s: number; // S (Semi-urgent) กึ่งเร่งด่วน
  n: number; // N (Non-urgent) ไม่ฉุกเฉิน
}

export interface ShiftOtherInfo {
  referCount: number;
  referDetails?: string;
  abnormalIncidents: string;
  handoverNotes: string;
}

export type ShiftSelection = ShiftType | 'ทุกเวร';

export interface ShiftSlot {
  team: ShiftTeam;
  triage: TriageStats;
  other: ShiftOtherInfo;
}

export interface MultiShiftReportData {
  id?: string;
  dateType?: 'single' | 'range';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateFormatted: string; // e.g. "1 พฤศจิกายน 2569 ถึง 2 พฤศจิกายน 2569"
  activeShift: ShiftSelection;
  shifts: {
    เช้า: ShiftSlot;
    บ่าย: ShiftSlot;
    ดึก: ShiftSlot;
  };
  createdAt?: string;
}

export interface ShiftData {
  id?: string;
  dateType?: 'single' | 'range';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  date: string; // e.g. "2 พฤศจิกายน 2569" or "1 พฤศจิกายน 2569 ถึง 2 พฤศจิกายน 2569"
  shift: ShiftType;
  team: ShiftTeam;
  triage: TriageStats;
  other: ShiftOtherInfo;
  createdAt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  sum: number;
  total: number;
  diff: number;
  message: string | null;
}

/**
 * Normalizes text input according to prompt instruction:
 * "ใช้เฉพาะข้อมูลที่ฉันระบุ ห้ามเพิ่มหรือเดาข้อมูลเอง ถ้าช่องไหนว่างให้ระบุว่า 'ไม่ระบุ'"
 */
export function formatValue(val: string | undefined | null, fallback: string = 'ไม่ระบุ'): string {
  if (val === undefined || val === null) return fallback;
  const trimmed = val.trim();
  return trimmed === '' ? fallback : trimmed;
}

/**
 * Normalizes incident or handover notes:
 * If empty, defaults to "ไม่มี"
 */
export function formatIncidentOrNotes(val: string | undefined | null): string {
  if (val === undefined || val === null) return 'ไม่มี';
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'none') {
    return 'ไม่มี';
  }
  return trimmed;
}

/**
 * Calculates shift type based on hour (24-hour clock):
 * 08:00 - 15:59: เช้า
 * 16:00 - 23:59: บ่าย
 * 00:00 - 07:59: ดึก
 */
export function getShiftFromHour(hour: number): ShiftType {
  if (hour >= 8 && hour < 16) {
    return 'เช้า';
  } else if (hour >= 16 && hour <= 23) {
    return 'บ่าย';
  } else {
    return 'ดึก';
  }
}

export function getCurrentShift(): ShiftType {
  const now = new Date();
  return getShiftFromHour(now.getHours());
}

export function calculateTriageTotal(triage: Partial<TriageStats>): number {
  const r = Math.max(0, Number(triage.r) || 0);
  const e = Math.max(0, Number(triage.e) || 0);
  const u = Math.max(0, Number(triage.u) || 0);
  const s = Math.max(0, Number(triage.s) || 0);
  const n = Math.max(0, Number(triage.n) || 0);
  return r + e + u + s + n;
}

/**
 * Triage validation:
 * "ตรวจสอบก่อนสรุป: ถ้า R+E+U+S+N ไม่เท่ากับจำนวนรวม ให้แจ้งเตือนก่อน"
 */
export function validateTriageStats(triage: TriageStats): ValidationResult {
  const r = Math.max(0, Number(triage.r) || 0);
  const e = Math.max(0, Number(triage.e) || 0);
  const u = Math.max(0, Number(triage.u) || 0);
  const s = Math.max(0, Number(triage.s) || 0);
  const n = Math.max(0, Number(triage.n) || 0);
  const total = Math.max(0, Number(triage.total) || 0);

  const sum = r + e + u + s + n;
  const diff = sum - total;
  const isValid = sum === total;

  let message: string | null = null;
  if (!isValid) {
    if (diff > 0) {
      message = `แจ้งเตือน: ผลรวมระดับความเร่งด่วน (R+E+U+S+N = ${sum} ราย) มากกว่าจำนวนรวมที่ระบุ (${total} ราย) อยู่ ${diff} ราย กรุณาตรวจสอบก่อนส่งเวร`;
    } else {
      message = `แจ้งเตือน: ผลรวมระดับความเร่งด่วน (R+E+U+S+N = ${sum} ราย) น้อยกว่าจำนวนรวมที่ระบุ (${total} ราย) ขาดอยู่ ${Math.abs(diff)} ราย กรุณาตรวจสอบก่อนส่งเวร`;
    }
  }

  return {
    isValid,
    sum,
    total,
    diff,
    message,
  };
}

/**
 * Formats Thai Date nicely (e.g., 2 พฤศจิกายน 2569)
 */
export function formatThaiDateString(dateInput: string | Date): string {
  if (!dateInput) return 'ไม่ระบุ';
  if (typeof dateInput === 'string' && dateInput.includes('พ.ศ.') || (typeof dateInput === 'string' && /[\u0E00-\u0E7F]/.test(dateInput))) {
    return dateInput.trim();
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : 'ไม่ระบุ';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543; // Buddhist Era
  return `${day} ${month} ${year}`;
}

export function getTodayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayISODate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatThaiDateRange(startDateInput: string, endDateInput?: string): string {
  if (!startDateInput) return 'ไม่ระบุ';
  const startStr = formatThaiDateString(startDateInput);
  if (!endDateInput || startDateInput === endDateInput) {
    return startStr;
  }
  const endStr = formatThaiDateString(endDateInput);
  return `${startStr} ถึง ${endStr}`;
}

/**
 * Generates the official report text following user requirements:
 * 1. หัวข้อ: สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช วันที่... เวร...
 * 2. รายชื่อทีมปฏิบัติงาน
 * 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (ตาราง)
 * 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อเวรถัดไป
 */
export function generateHandoverReport(data: ShiftData, options?: { showWarningBanner?: boolean }): string {
  const dateFormatted = formatValue(data.date, 'ไม่ระบุ');
  const shift = data.shift || 'ไม่ระบุ';

  const doc = formatValue(data.team?.doctor);
  const inc = formatValue(data.team?.incharge);
  const ldr = formatValue(data.team?.leader);
  const m1 = formatValue(data.team?.member1);
  const m2 = formatValue(data.team?.member2);
  const aemt = formatValue(data.team?.aemt);
  const drv1 = formatValue(data.team?.driver1);
  const drv2 = formatValue(data.team?.driver2);
  const xr = formatValue(data.team?.xrays);
  const lb = formatValue(data.team?.lab);

  const total = Number(data.triage?.total) || 0;
  const r = Number(data.triage?.r) || 0;
  const e = Number(data.triage?.e) || 0;
  const u = Number(data.triage?.u) || 0;
  const s = Number(data.triage?.s) || 0;
  const n = Number(data.triage?.n) || 0;

  const validation = validateTriageStats(data.triage);

  const referCount = Number(data.other?.referCount) || 0;
  const referDetails = data.other?.referDetails?.trim();
  const incidents = formatIncidentOrNotes(data.other?.abnormalIncidents);
  const notes = formatIncidentOrNotes(data.other?.handoverNotes);

  const calcPct = (count: number) => {
    if (total === 0) return '0.0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  };

  const lines: string[] = [];

  // If there is an unresolved discrepancy and caller asks to include it
  if (options?.showWarningBanner && !validation.isValid && validation.message) {
    lines.push(`[⚠️ ตรวจสอบสถิติ: ${validation.message}]`);
    lines.push('');
  }

  // 1. หัวข้อ
  lines.push(`สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช วันที่ ${dateFormatted} เวร ${shift}`);
  lines.push('────────────────────────────────────────');

  // 2. รายชื่อทีมปฏิบัติงาน
  lines.push('ทีมปฏิบัติงาน');
  lines.push(`• แพทย์เวร: ${doc}`);
  lines.push(`• Incharge: ${inc}`);
  lines.push(`• Leader: ${ldr}`);
  lines.push(`• Member 1: ${m1}`);
  lines.push(`• Member 2: ${m2}`);
  lines.push(`• AEMT: ${aemt}`);
  lines.push(`• X-ray: ${xr}`);
  lines.push(`• Lab: ${lb}`);
  lines.push(`• พขร. (พนักงานขับรถ): 1) ${drv1}  2) ${drv2}`);
  lines.push('────────────────────────────────────────');

  // 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (ตาราง)
  lines.push(`สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (รวม ${total} ราย)`);
  lines.push('┌──────┬──────────────────────┬──────────┬──────────┐');
  lines.push('│ ระดับ │ คำอธิบาย             │ จำนวน(ราย) │ สัดส่วน  │');
  lines.push('├──────┼──────────────────────┼──────────┼──────────┤');
  lines.push(`│  R   │ Resuscitation (กู้ชีพ) │ ${String(r).padStart(8, ' ')} │ ${calcPct(r).padStart(8, ' ')} │`);
  lines.push(`│  E   │ Emergency (ฉุกเฉิน)  │ ${String(e).padStart(8, ' ')} │ ${calcPct(e).padStart(8, ' ')} │`);
  lines.push(`│  U   │ Urgent (เร่งด่วน)     │ ${String(u).padStart(8, ' ')} │ ${calcPct(u).padStart(8, ' ')} │`);
  lines.push(`│  S   │ Semi-urgent (กึ่งด่วน) │ ${String(s).padStart(8, ' ')} │ ${calcPct(s).padStart(8, ' ')} │`);
  lines.push(`│  N   │ Non-urgent (ไม่ฉุกเฉิน)│ ${String(n).padStart(8, ' ')} │ ${calcPct(n).padStart(8, ' ')} │`);
  lines.push('├──────┴──────────────────────┼──────────┼──────────┤');
  lines.push(`│ รวมผู้ป่วยคัดกรอง (R+E+U+S+N)│ ${String(validation.sum).padStart(8, ' ')} │ 100.0%   │`);
  if (!validation.isValid) {
    lines.push(`│ จำนวนผู้รับบริการรวมที่ระบุ │ ${String(total).padStart(8, ' ')} │          │`);
  }
  lines.push('└─────────────────────────────┴──────────┴──────────┘');

  if (!validation.isValid) {
    lines.push(`⚠️ หมายเหตุความถูกต้องสถิติ: ผลรวมระดับ (${validation.sum}) ไม่เท่ากับยอดรวม (${total})`);
  }

  lines.push('────────────────────────────────────────');

  // 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อเวรถัดไป
  lines.push('ข้อสังเกตและประเด็นที่ต้องส่งต่อเวรถัดไป');
  let referLine = `• ผู้ป่วย Refer: ${referCount} ราย`;
  if (referDetails) {
    referLine += ` (${referDetails})`;
  }
  lines.push(referLine);
  lines.push(`• เหตุการณ์/อุปกรณ์ผิดปกติ: ${incidents}`);
  lines.push(`• เรื่องที่ต้องส่งต่อเวรถัดไป: ${notes}`);

  return lines.join('\n');
}

/**
 * Mobile-friendly text optimized for LINE application pasting
 */
export function generateLineText(data: ShiftData): string {
  const dateFormatted = formatValue(data.date, 'ไม่ระบุ');
  const shift = data.shift || 'ไม่ระบุ';

  const doc = formatValue(data.team?.doctor);
  const inc = formatValue(data.team?.incharge);
  const ldr = formatValue(data.team?.leader);
  const m1 = formatValue(data.team?.member1);
  const m2 = formatValue(data.team?.member2);
  const aemt = formatValue(data.team?.aemt);
  const drv1 = formatValue(data.team?.driver1);
  const drv2 = formatValue(data.team?.driver2);
  const xr = formatValue(data.team?.xrays);
  const lb = formatValue(data.team?.lab);

  const total = Number(data.triage?.total) || 0;
  const r = Number(data.triage?.r) || 0;
  const e = Number(data.triage?.e) || 0;
  const u = Number(data.triage?.u) || 0;
  const s = Number(data.triage?.s) || 0;
  const n = Number(data.triage?.n) || 0;

  const validation = validateTriageStats(data.triage);

  const referCount = Number(data.other?.referCount) || 0;
  const referDetails = data.other?.referDetails?.trim();
  const incidents = formatIncidentOrNotes(data.other?.abnormalIncidents);
  const notes = formatIncidentOrNotes(data.other?.handoverNotes);

  const lines: string[] = [
    `📋 สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช`,
    `📅 วันที่: ${dateFormatted}`,
    `⏰ เวร: ${shift}`,
    ``,
    `👥 รายชื่อทีมปฏิบัติงาน`,
    `• แพทย์เวร: ${doc}`,
    `• Incharge: ${inc}`,
    `• Leader: ${ldr}`,
    `• Member 1: ${m1}`,
    `• Member 2: ${m2}`,
    `• AEMT: ${aemt}`,
    `• X-ray: ${xr}`,
    `• Lab: ${lb}`,
    `• พขร.: 1) ${drv1}  2) ${drv2}`,
    ``,
    `📊 สรุปจำนวนผู้รับบริการ (รวม ${total} ราย)`,
    `🔴 R (Resuscitation): ${r} ราย`,
    `🟠 E (Emergency): ${e} ราย`,
    `🟡 U (Urgent): ${u} ราย`,
    `🟢 S (Semi-urgent): ${s} ราย`,
    `⚪ N (Non-urgent): ${n} ราย`,
  ];

  if (!validation.isValid) {
    lines.push(`⚠️ ตรวจสอบ: ผลรวม (${validation.sum}) ≠ ยอดรวม (${total})`);
  }

  lines.push(``);
  lines.push(`📌 ข้อสังเกต / ประเด็นส่งต่อเวรถัดไป`);
  lines.push(`• Refer: ${referCount} ราย${referDetails ? ` (${referDetails})` : ''}`);
  lines.push(`• เหตุการณ์/อุปกรณ์ผิดปกติ: ${incidents}`);
  lines.push(`• เรื่องที่ต้องส่งต่อเวรถัดไป: ${notes}`);

  return lines.join('\n');
}

/**
 * Intelligent parser to parse raw pasted text into ShiftData
 */
export function parseShiftText(rawText: string): Partial<ShiftData> {
  const result: Partial<ShiftData> = {
    team: {
      doctor: '',
      incharge: '',
      leader: '',
      member1: '',
      member2: '',
      aemt: '',
      driver1: '',
      driver2: '',
      xrays: '',
      lab: '',
    },
    triage: {
      total: 0,
      r: 0,
      e: 0,
      u: 0,
      s: 0,
      n: 0,
    },
    other: {
      referCount: 0,
      referDetails: '',
      abnormalIncidents: '',
      handoverNotes: '',
    },
  };

  const lines = rawText.split('\n');

  // Extract shift
  if (/เวร\s*[:\s-]?\s*(เช้า|บ่าย|ดึก)/i.test(rawText)) {
    const match = rawText.match(/เวร\s*[:\s-]?\s*(เช้า|บ่าย|ดึก)/i);
    if (match) result.shift = match[1] as ShiftType;
  }

  // Extract date
  const dateMatch = rawText.match(/วันที่\s*[:\s-]?\s*([0-9\u0E00-\u0E7F\s\/\.-]+)/i);
  if (dateMatch && dateMatch[1]) {
    const rawDate = dateMatch[1].split(/เวร|\n|ทีม/)[0].trim();
    if (rawDate) result.date = rawDate;
  }

  // Extract team
  const doctorMatch = rawText.match(/(?:แพทย์เวร|แพทย์|Doctor)\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (doctorMatch && doctorMatch[1]) result.team!.doctor = doctorMatch[1].trim();

  const inchargeMatch = rawText.match(/Incharge\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (inchargeMatch && inchargeMatch[1]) result.team!.incharge = inchargeMatch[1].trim();

  const leaderMatch = rawText.match(/Leader\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (leaderMatch && leaderMatch[1]) result.team!.leader = leaderMatch[1].trim();

  const member1Match = rawText.match(/Member\s*1\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (member1Match && member1Match[1]) result.team!.member1 = member1Match[1].trim();

  const member2Match = rawText.match(/Member\s*2\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (member2Match && member2Match[1]) result.team!.member2 = member2Match[1].trim();

  const aemtMatch = rawText.match(/AEMT\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (aemtMatch && aemtMatch[1]) result.team!.aemt = aemtMatch[1].trim();

  const xraysMatch = rawText.match(/(?:X-?rays?|เอกซเรย์)\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (xraysMatch && xraysMatch[1]) result.team!.xrays = xraysMatch[1].trim();

  const labMatch = rawText.match(/Lab\s*[:\s-]?\s*([^\n\r,]+)/i);
  if (labMatch && labMatch[1]) result.team!.lab = labMatch[1].trim();

  // Drivers: 1) ... 2) ... or comma separated
  const driverMatch = rawText.match(/พขร[^\n\r:]*[:\s-]?\s*([^\n\r]+)/i);
  if (driverMatch && driverMatch[1]) {
    const dText = driverMatch[1];
    const subMatch1 = dText.match(/1\)\s*([^2]+)/);
    const subMatch2 = dText.match(/2\)\s*([^,]+)/);
    if (subMatch1) result.team!.driver1 = subMatch1[1].trim();
    if (subMatch2) result.team!.driver2 = subMatch2[1].trim();
    if (!subMatch1 && !subMatch2) {
      const parts = dText.split(/[,/]/);
      if (parts[0]) result.team!.driver1 = parts[0].trim();
      if (parts[1]) result.team!.driver2 = parts[1].trim();
    }
  }

  // Triage
  const totalMatch = rawText.match(/รวม[^\d]*(\d+)/i) || rawText.match(/จำนวนผู้รับบริการรวม[^\d]*(\d+)/i);
  if (totalMatch && totalMatch[1]) result.triage!.total = parseInt(totalMatch[1], 10);

  const rMatch = rawText.match(/R\s*(?:\([^)]*\))?\s*[:\s-]?\s*(\d+)/i);
  if (rMatch && rMatch[1]) result.triage!.r = parseInt(rMatch[1], 10);

  const eMatch = rawText.match(/E\s*(?:\([^)]*\))?\s*[:\s-]?\s*(\d+)/i);
  if (eMatch && eMatch[1]) result.triage!.e = parseInt(eMatch[1], 10);

  const uMatch = rawText.match(/U\s*(?:\([^)]*\))?\s*[:\s-]?\s*(\d+)/i);
  if (uMatch && uMatch[1]) result.triage!.u = parseInt(uMatch[1], 10);

  const sMatch = rawText.match(/S\s*(?:\([^)]*\))?\s*[:\s-]?\s*(\d+)/i);
  if (sMatch && sMatch[1]) result.triage!.s = parseInt(sMatch[1], 10);

  const nMatch = rawText.match(/N\s*(?:\([^)]*\))?\s*[:\s-]?\s*(\d+)/i);
  if (nMatch && nMatch[1]) result.triage!.n = parseInt(nMatch[1], 10);

  // Other info
  const referMatch = rawText.match(/Refer\s*[:\s-]?\s*(\d+)(?:\s*ราย)?(?:\s*\(([^)]+)\))?/i);
  if (referMatch) {
    if (referMatch[1]) result.other!.referCount = parseInt(referMatch[1], 10);
    if (referMatch[2]) result.other!.referDetails = referMatch[2].trim();
  }

  const incidentMatch = rawText.match(/เหตุการณ์\/อุปกรณ์ผิดปกติ\s*[:\s-]?\s*([^\n\r]+)/i);
  if (incidentMatch && incidentMatch[1]) {
    result.other!.abnormalIncidents = incidentMatch[1].trim();
  }

  const handoverMatch = rawText.match(/เรื่องที่ต้องส่งต่อเวรถัดไป\s*[:\s-]?\s*([^\n\r]+)/i);
  if (handoverMatch && handoverMatch[1]) {
    result.other!.handoverNotes = handoverMatch[1].trim();
  }

  return result;
}

export function createDefaultShiftSlot(): ShiftSlot {
  return {
    team: {
      doctor: '',
      incharge: '',
      leader: '',
      member1: '',
      member2: '',
      aemt: '',
      driver1: '',
      driver2: '',
      xrays: '',
      lab: '',
    },
    triage: {
      total: 0,
      r: 0,
      e: 0,
      u: 0,
      s: 0,
      n: 0,
    },
    other: {
      referCount: 0,
      referDetails: '',
      abnormalIncidents: '',
      handoverNotes: '',
    },
  };
}

export function createDefaultMultiShiftData(
  startDate?: string,
  endDate?: string,
  dateType: 'single' | 'range' = 'single'
): MultiShiftReportData {
  const start = startDate || getTodayISODate();
  const end = endDate || start;
  const formatted = dateType === 'single'
    ? formatThaiDateString(start)
    : formatThaiDateRange(start, end);

  return {
    dateType,
    startDate: start,
    endDate: end,
    dateFormatted: formatted,
    activeShift: getCurrentShift(),
    shifts: {
      เช้า: createDefaultShiftSlot(),
      บ่าย: createDefaultShiftSlot(),
      ดึก: createDefaultShiftSlot(),
    },
  };
}

export function getSampleMultiShiftData(): MultiShiftReportData {
  const today = getTodayISODate();
  return {
    dateType: 'single',
    startDate: today,
    endDate: today,
    dateFormatted: formatThaiDateString(today),
    activeShift: 'ทุกเวร',
    shifts: {
      เช้า: {
        team: {
          doctor: 'นพ.ธนา สว่างเวช',
          incharge: 'พว.วิภาดา สมบูรณ์ (RN)',
          leader: 'พว.ณัฐนนท์ ใจมั่น',
          member1: 'พว.สุภาพร แก้วมณี',
          member2: 'พว.อนุสรณ์ ปัญญา',
          aemt: 'นายธีระเดช อาสา (AEMT)',
          driver1: 'นายสมบัติ ว่องไว',
          driver2: 'นายวิชัย รวดเร็ว',
          xrays: 'นายเอกชัย ถ่ายภาพ',
          lab: 'น.ส.มุกดา ผลตรวจ',
        },
        triage: {
          total: 32,
          r: 2,
          e: 6,
          u: 12,
          s: 8,
          n: 4,
        },
        other: {
          referCount: 2,
          referDetails: 'ส่งต่อ รพ.ศูนย์ 2 ราย (STEMI 1, ICH 1)',
          abnormalIncidents: 'เครื่อง Defibrillator ช่อง 1 ตรวจเช็คเปลี่ยนสายแพดใหม่ พร้อมใช้งาน',
          handoverNotes: 'รอผล CT Scan ผู้ป่วยอุบัติเหตุจราจร HN 67-004521, Case นิติเวชชันสูตรพลิกศพ 1 ราย ญาติมาติดต่อบ่ายนี้',
        },
      },
      บ่าย: {
        team: {
          doctor: 'พญ.ไพลิน พิทักษ์ธรรม',
          incharge: 'พว.กาญจนา มงคล (RN)',
          leader: 'พว.กิตติพงษ์ เพียรงาน',
          member1: 'พว.ศิริพร บุญเหลือ',
          member2: 'พว.ประเสริฐ จิตดี',
          aemt: 'นายวัชระ พร้อมกู้ (AEMT)',
          driver1: 'นายบุญมี นำส่ง',
          driver2: 'นายสมชาย ถึงไว',
          xrays: 'นายอนันต์ รังสี',
          lab: 'น.ส.กัญญา เจาะเลือด',
        },
        triage: {
          total: 28,
          r: 1,
          e: 5,
          u: 10,
          s: 7,
          n: 5,
        },
        other: {
          referCount: 1,
          referDetails: 'ส่งต่อ รพ.ศูนย์ 1 ราย (Trauma Hemorrhagic Shock)',
          abnormalIncidents: 'ไม่มี',
          handoverNotes: 'เคสนิติเวชชันสูตรพลิกศพเสร็จสิ้น ญาติรับเอกสารเรียบร้อย',
        },
      },
      ดึก: {
        team: {
          doctor: 'นพ.สราวุฒิ มั่นคง',
          incharge: 'พว.นารีรัตน์ โสภา (RN)',
          leader: 'พว.ธนพร รัตนชัย',
          member1: 'พว.จริยา บริสุทธิ์',
          member2: 'พว.ชัยวัฒน์ มงคล',
          aemt: 'นายพิทักษ์ อาสา (AEMT)',
          driver1: 'นายมานพ นำทาง',
          driver2: 'นายณรงค์ ชำนาญทาง',
          xrays: 'นายวิชิต เอ็กซเรย์',
          lab: 'น.ส.พรทิพย์ ห้องแล็บ',
        },
        triage: {
          total: 14,
          r: 1,
          e: 2,
          u: 5,
          s: 4,
          n: 2,
        },
        other: {
          referCount: 1,
          referDetails: 'ส่งต่อ รพ.ศูนย์ 1 ราย (Severe Sepsis)',
          abnormalIncidents: 'ไม่มี',
          handoverNotes: 'เตรียมเครื่องมือและตรวจสอบรถพยาบาลส่งมอบเวรเช้าเรียบร้อย',
        },
      },
    },
  };
}

export interface MultiShiftTotals {
  r: number;
  e: number;
  u: number;
  s: number;
  n: number;
  total: number;
  byShift: {
    เช้า: number;
    บ่าย: number;
    ดึก: number;
  };
  referTotal: number;
}

export function calculateMultiShiftTotals(shifts: MultiShiftReportData['shifts']): MultiShiftTotals {
  const r = (Number(shifts.เช้า.triage.r) || 0) + (Number(shifts.บ่าย.triage.r) || 0) + (Number(shifts.ดึก.triage.r) || 0);
  const e = (Number(shifts.เช้า.triage.e) || 0) + (Number(shifts.บ่าย.triage.e) || 0) + (Number(shifts.ดึก.triage.e) || 0);
  const u = (Number(shifts.เช้า.triage.u) || 0) + (Number(shifts.บ่าย.triage.u) || 0) + (Number(shifts.ดึก.triage.u) || 0);
  const s = (Number(shifts.เช้า.triage.s) || 0) + (Number(shifts.บ่าย.triage.s) || 0) + (Number(shifts.ดึก.triage.s) || 0);
  const n = (Number(shifts.เช้า.triage.n) || 0) + (Number(shifts.บ่าย.triage.n) || 0) + (Number(shifts.ดึก.triage.n) || 0);
  const total = r + e + u + s + n;

  const mTotal = calculateTriageTotal(shifts.เช้า.triage);
  const aTotal = calculateTriageTotal(shifts.บ่าย.triage);
  const nTotal = calculateTriageTotal(shifts.ดึก.triage);

  const referTotal =
    (Number(shifts.เช้า.other.referCount) || 0) +
    (Number(shifts.บ่าย.other.referCount) || 0) +
    (Number(shifts.ดึก.other.referCount) || 0);

  return {
    r,
    e,
    u,
    s,
    n,
    total,
    byShift: {
      เช้า: mTotal,
      บ่าย: aTotal,
      ดึก: nTotal,
    },
    referTotal,
  };
}

/**
 * Generates the official report covering date range and separating shifts (เช้า / บ่าย / ดึก)
 */
export function generateCombinedMultiShiftReport(data: MultiShiftReportData): string {
  const dateFormatted = data.dateFormatted || 'ไม่ระบุ';
  const totals = calculateMultiShiftTotals(data.shifts);

  const calcPct = (count: number) => {
    if (totals.total === 0) return '0.0%';
    return `${((count / totals.total) * 100).toFixed(1)}%`;
  };

  const lines: string[] = [];

  // 1. หัวข้อ
  lines.push(`สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช ช่วงวันที่ ${dateFormatted} (แยกเวร เช้า/บ่าย/ดึก)`);
  lines.push('═══════════════════════════════════════════════════════════');

  // 2. รายชื่อทีมปฏิบัติงานแยกตามเวร
  lines.push('รายชื่อทีมปฏิบัติงานแยกตามเวร');
  const shiftNames: ShiftType[] = ['เช้า', 'บ่าย', 'ดึก'];
  shiftNames.forEach((sName) => {
    const slot = data.shifts[sName];
    lines.push(`\n[ เวร${sName} ]`);
    lines.push(`• แพทย์เวร: ${formatValue(slot.team.doctor)}`);
    lines.push(`• Incharge: ${formatValue(slot.team.incharge)} | Leader: ${formatValue(slot.team.leader)}`);
    lines.push(`• Member 1: ${formatValue(slot.team.member1)} | Member 2: ${formatValue(slot.team.member2)}`);
    lines.push(`• AEMT: ${formatValue(slot.team.aemt)} | X-ray: ${formatValue(slot.team.xrays)} | Lab: ${formatValue(slot.team.lab)}`);
    lines.push(`• พขร. (พนักงานขับรถ): 1) ${formatValue(slot.team.driver1)}  2) ${formatValue(slot.team.driver2)}`);
  });

  lines.push('\n───────────────────────────────────────────────────────────');

  // 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วนและแยกเวร (ตาราง)
  lines.push(`สรุปจำนวนผู้ป่วยคัดกรองแยกตามระดับความเร่งด่วนและแยกเวร (รวม ${totals.total} ราย)`);
  lines.push('┌──────┬──────────────────────┬────────┬────────┬────────┬────────┬──────────┐');
  lines.push('│ ระดับ │ คำอธิบาย             │  เช้า  │  บ่าย  │  ดึก   │ รวมทุุก │ สัดส่วน  │');
  lines.push('├──────┼──────────────────────┼────────┼────────┼────────┼────────┼──────────┤');

  const rows = [
    { code: 'R', desc: 'Resuscitation (กู้ชีพ) ', rM: data.shifts.เช้า.triage.r, rA: data.shifts.บ่าย.triage.r, rN: data.shifts.ดึก.triage.r, sum: totals.r },
    { code: 'E', desc: 'Emergency (ฉุกเฉิน)  ', rM: data.shifts.เช้า.triage.e, rA: data.shifts.บ่าย.triage.e, rN: data.shifts.ดึก.triage.e, sum: totals.e },
    { code: 'U', desc: 'Urgent (เร่งด่วน)     ', rM: data.shifts.เช้า.triage.u, rA: data.shifts.บ่าย.triage.u, rN: data.shifts.ดึก.triage.u, sum: totals.u },
    { code: 'S', desc: 'Semi-urgent (กึ่งด่วน) ', rM: data.shifts.เช้า.triage.s, rA: data.shifts.บ่าย.triage.s, rN: data.shifts.ดึก.triage.s, sum: totals.s },
    { code: 'N', desc: 'Non-urgent (ไม่ฉุกเฉิน)', rM: data.shifts.เช้า.triage.n, rA: data.shifts.บ่าย.triage.n, rN: data.shifts.ดึก.triage.n, sum: totals.n },
  ];

  rows.forEach((r) => {
    lines.push(
      `│  ${r.code}   │ ${r.desc}│ ${String(r.rM).padStart(6, ' ')} │ ${String(r.rA).padStart(6, ' ')} │ ${String(r.rN).padStart(6, ' ')} │ ${String(r.sum).padStart(6, ' ')} │ ${calcPct(r.sum).padStart(8, ' ')} │`
    );
  });

  lines.push('├──────┴──────────────────────┼────────┼────────┼────────┼────────┼──────────┤');
  lines.push(
    `│ รวมผู้ป่วยคัดกรอง           │ ${String(totals.byShift.เช้า).padStart(6, ' ')} │ ${String(totals.byShift.บ่าย).padStart(6, ' ')} │ ${String(totals.byShift.ดึก).padStart(6, ' ')} │ ${String(totals.total).padStart(6, ' ')} │ 100.0%   │`
  );
  lines.push('└─────────────────────────────┴────────┴────────┴────────┴────────┴──────────┘');

  lines.push('───────────────────────────────────────────────────────────');

  // 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อเวรถัดไป
  lines.push('ข้อสังเกตและประเด็นที่ต้องส่งต่อแยกตามเวร');
  lines.push(`• ผู้ป่วย Refer รวมทุกเวร: ${totals.referTotal} ราย`);
  shiftNames.forEach((sName) => {
    const slot = data.shifts[sName];
    const incidents = formatIncidentOrNotes(slot.other.abnormalIncidents);
    const notes = formatIncidentOrNotes(slot.other.handoverNotes);
    const ref = Number(slot.other.referCount) || 0;
    const refD = slot.other.referDetails?.trim();

    lines.push(`\n[ เวร${sName} ]`);
    lines.push(`  - Refer: ${ref} ราย${refD ? ` (${refD})` : ''}`);
    lines.push(`  - เหตุการณ์/อุปกรณ์ผิดปกติ: ${incidents}`);
    lines.push(`  - เรื่องส่งต่อ: ${notes}`);
  });

  return lines.join('\n');
}

/**
 * Mobile-friendly LINE summary for multi-shift breakdown
 */
export function generateCombinedLineText(data: MultiShiftReportData): string {
  const dateFormatted = data.dateFormatted || 'ไม่ระบุ';
  const totals = calculateMultiShiftTotals(data.shifts);

  const lines: string[] = [
    `📋 สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช`,
    `📅 ช่วงวันที่: ${dateFormatted}`,
    `⏰ รวม 3 เวร (แยกเวร เช้า / บ่าย / ดึก)`,
    ``,
    `📊 สรุปยอดผู้ป่วยคัดกรองรวม: ${totals.total} ราย`,
    `• เวรเช้า: ${totals.byShift.เช้า} ราย`,
    `• เวรบ่าย: ${totals.byShift.บ่าย} ราย`,
    `• เวรดึก: ${totals.byShift.ดึก} ราย`,
    ``,
    `🔴 R (Resuscitation): ${totals.r} ราย (เช้า:${data.shifts.เช้า.triage.r} บ่าย:${data.shifts.บ่าย.triage.r} ดึก:${data.shifts.ดึก.triage.r})`,
    `🟠 E (Emergency): ${totals.e} ราย (เช้า:${data.shifts.เช้า.triage.e} บ่าย:${data.shifts.บ่าย.triage.e} ดึก:${data.shifts.ดึก.triage.e})`,
    `🟡 U (Urgent): ${totals.u} ราย (เช้า:${data.shifts.เช้า.triage.u} บ่าย:${data.shifts.บ่าย.triage.u} ดึก:${data.shifts.ดึก.triage.u})`,
    `🟢 S (Semi-urgent): ${totals.s} ราย (เช้า:${data.shifts.เช้า.triage.s} บ่าย:${data.shifts.บ่าย.triage.s} ดึก:${data.shifts.ดึก.triage.s})`,
    `⚪ N (Non-urgent): ${totals.n} ราย (เช้า:${data.shifts.เช้า.triage.n} บ่าย:${data.shifts.บ่าย.triage.n} ดึก:${data.shifts.ดึก.triage.n})`,
    ``,
    `🚑 ผู้ป่วย Refer รวม: ${totals.referTotal} ราย (เช้า:${data.shifts.เช้า.other.referCount} บ่าย:${data.shifts.บ่าย.other.referCount} ดึก:${data.shifts.ดึก.other.referCount})`,
    ``,
    `👥 แพทย์เวรแต่ละกะ:`,
    `• เช้า: ${formatValue(data.shifts.เช้า.team.doctor)}`,
    `• บ่าย: ${formatValue(data.shifts.บ่าย.team.doctor)}`,
    `• ดึก: ${formatValue(data.shifts.ดึก.team.doctor)}`,
  ];

  return lines.join('\n');
}
