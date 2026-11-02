import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getShiftFromHour,
  validateTriageStats,
  formatValue,
  formatIncidentOrNotes,
  generateHandoverReport,
  generateLineText,
  parseShiftText,
  formatThaiDateRange,
  getYesterdayISODate,
  ShiftData,
  getSampleMultiShiftData,
  calculateMultiShiftTotals,
  generateCombinedMultiShiftReport,
} from './shiftReport';

test('formatThaiDateRange formats single date and date range properly', () => {
  // Single date
  assert.equal(formatThaiDateRange('2026-11-02', '2026-11-02'), '2 พฤศจิกายน 2569');
  assert.equal(formatThaiDateRange('2026-11-02'), '2 พฤศจิกายน 2569');

  // Date range between two dates
  assert.equal(
    formatThaiDateRange('2026-11-01', '2026-11-02'),
    '1 พฤศจิกายน 2569 ถึง 2 พฤศจิกายน 2569'
  );
});

test('Shift calculation based on 24-hour ER LPH shifts', () => {
  // เช้า: 08:00 - 15:59
  assert.equal(getShiftFromHour(8), 'เช้า');
  assert.equal(getShiftFromHour(12), 'เช้า');
  assert.equal(getShiftFromHour(15), 'เช้า');

  // บ่าย: 16:00 - 23:59
  assert.equal(getShiftFromHour(16), 'บ่าย');
  assert.equal(getShiftFromHour(20), 'บ่าย');
  assert.equal(getShiftFromHour(23), 'บ่าย');

  // ดึก: 00:00 - 07:59
  assert.equal(getShiftFromHour(0), 'ดึก');
  assert.equal(getShiftFromHour(4), 'ดึก');
  assert.equal(getShiftFromHour(7), 'ดึก');
});

test('Triage validation correctly identifies matching sums', () => {
  const result = validateTriageStats({
    total: 30,
    r: 2,
    e: 5,
    u: 10,
    s: 8,
    n: 5
  });
  assert.equal(result.isValid, true);
  assert.equal(result.sum, 30);
  assert.equal(result.diff, 0);
  assert.equal(result.message, null);
});

test('Triage validation warns when R+E+U+S+N does not match total', () => {
  // Sum is 25, total is 26 (diff = -1)
  const resultUnder = validateTriageStats({
    total: 26,
    r: 2,
    e: 5,
    u: 8,
    s: 5,
    n: 5
  });
  assert.equal(resultUnder.isValid, false);
  assert.equal(resultUnder.sum, 25);
  assert.equal(resultUnder.diff, -1);
  assert.match(resultUnder.message || '', /น้อยกว่าจำนวนรวมที่ระบุ/);

  // Sum is 32, total is 30 (diff = +2)
  const resultOver = validateTriageStats({
    total: 30,
    r: 2,
    e: 8,
    u: 12,
    s: 5,
    n: 5
  });
  assert.equal(resultOver.isValid, false);
  assert.equal(resultOver.sum, 32);
  assert.equal(resultOver.diff, 2);
  assert.match(resultOver.message || '', /มากกว่าจำนวนรวมที่ระบุ/);
});

test('Default empty fields format to "ไม่ระบุ" and notes default to "ไม่มี"', () => {
  assert.equal(formatValue('', 'ไม่ระบุ'), 'ไม่ระบุ');
  assert.equal(formatValue(undefined, 'ไม่ระบุ'), 'ไม่ระบุ');
  assert.equal(formatValue('  ', 'ไม่ระบุ'), 'ไม่ระบุ');
  assert.equal(formatValue('นพ.สมชาย', 'ไม่ระบุ'), 'นพ.สมชาย');

  assert.equal(formatIncidentOrNotes(''), 'ไม่มี');
  assert.equal(formatIncidentOrNotes('-'), 'ไม่มี');
  assert.equal(formatIncidentOrNotes('none'), 'ไม่มี');
  assert.equal(formatIncidentOrNotes('เครื่อง Defibrillator ช่อง 2 แบตเตอรี่เสื่อม'), 'เครื่อง Defibrillator ช่อง 2 แบตเตอรี่เสื่อม');
});

test('generateHandoverReport produces the 4-part official format requested', () => {
  const sampleData: ShiftData = {
    date: '2 พฤศจิกายน 2569',
    shift: 'เช้า',
    team: {
      doctor: 'พญ.อารียา สุขสม',
      incharge: 'พว.สุดารัตน์ ใจดี',
      leader: 'พว.กิตติพงษ์ มั่นคง',
      member1: 'พว.จินตนาการ บริสุทธิ์',
      member2: 'พว.ธนภัทร ว่องไว',
      aemt: 'นายเอกราช กู้ภัย',
      driver1: 'นายสมบัติ เร็วไว',
      driver2: '', // Should become "ไม่ระบุ"
      xrays: 'นายวรวุฒิ สแกนดี',
      lab: '' // Should become "ไม่ระบุ"
    },
    triage: {
      total: 35,
      r: 2,
      e: 6,
      u: 12,
      s: 10,
      n: 5
    },
    other: {
      referCount: 2,
      referDetails: 'Refer รพ.ลำพูน 2 ราย (STEMI 1, ICH 1)',
      abnormalIncidents: '', // Should become "ไม่มี"
      handoverNotes: 'รอผล CT Brain ผู้ป่วย HN 670012'
    }
  };

  const report = generateHandoverReport(sampleData);

  // Check 1. หัวข้อ
  assert.ok(report.includes('สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช วันที่ 2 พฤศจิกายน 2569 เวร เช้า'));

  // Check 2. รายชื่อทีมปฏิบัติงาน
  assert.ok(report.includes('ทีมปฏิบัติงาน'));
  assert.ok(report.includes('แพทย์เวร: พญ.อารียา สุขสม'));
  assert.ok(report.includes('Incharge: พว.สุดารัตน์ ใจดี'));
  assert.ok(report.includes('Leader: พว.กิตติพงษ์ มั่นคง'));
  assert.ok(report.includes('Member 1: พว.จินตนาการ บริสุทธิ์'));
  assert.ok(report.includes('Member 2: พว.ธนภัทร ว่องไว'));
  assert.ok(report.includes('AEMT: นายเอกราช กู้ภัย'));
  assert.ok(report.includes('X-ray: นายวรวุฒิ สแกนดี'));
  assert.ok(report.includes('Lab: ไม่ระบุ'));
  assert.ok(report.includes('1) นายสมบัติ เร็วไว  2) ไม่ระบุ'));

  // Check 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (ตาราง)
  assert.ok(report.includes('Resuscitation (กู้ชีพ)'));
  assert.ok(report.includes('Emergency (ฉุกเฉิน)'));
  assert.ok(report.includes('Urgent (เร่งด่วน)'));
  assert.ok(report.includes('Semi-urgent (กึ่งด่วน)'));
  assert.ok(report.includes('Non-urgent (ไม่ฉุกเฉิน)'));

  // Check 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อเวรถัดไป
  assert.ok(report.includes('ข้อสังเกตและประเด็นที่ต้องส่งต่อเวรถัดไป'));
  assert.ok(report.includes('ผู้ป่วย Refer: 2 ราย'));
  assert.ok(report.includes('เหตุการณ์/อุปกรณ์ผิดปกติ: ไม่มี'));
  assert.ok(report.includes('เรื่องที่ต้องส่งต่อเวรถัดไป: รอผล CT Brain ผู้ป่วย HN 670012'));
});

test('parseShiftText correctly parses raw text with new team members', () => {
  const raw = `
ข้อมูลเวร
- วันที่: 02/11/2026
- เวร: บ่าย
- แพทย์เวร: นพ.ธนา สว่าง
- incharge: พว.วิภาดา
- Leader: พว.ณัฐนนท์
- Member 1: พว.สุภาพร
- Member 2: พว.อนุสรณ์
- AEMT: นายธีระเดช
- X-ray: นายเอก
- Lab: นางสาวมุก
- พขร: 1) นายวิชัย 2) นายสมพงษ์

จำนวนผู้รับบริการรวม: 25 ราย
- R (Resuscitation): 1 ราย
- E (Emergency): 4 ราย
- U (Urgent): 10 ราย
- S (Semi-urgent): 7 ราย
- N (Non-urgent): 3 ราย

ข้อมูลอื่น
- Refer: 1 ราย
- เหตุการณ์/อุปกรณ์ผิดปกติ: ไม่มี
- เรื่องที่ต้องส่งต่อเวรถัดไป: เบิก Ambu bag เพิ่ม 1 ชุด
  `;

  const parsed = parseShiftText(raw);
  assert.equal(parsed.shift, 'บ่าย');
  assert.equal(parsed.team?.doctor, 'นพ.ธนา สว่าง');
  assert.equal(parsed.team?.incharge, 'พว.วิภาดา');
  assert.equal(parsed.team?.leader, 'พว.ณัฐนนท์');
  assert.equal(parsed.team?.member1, 'พว.สุภาพร');
  assert.equal(parsed.team?.member2, 'พว.อนุสรณ์');
  assert.equal(parsed.team?.aemt, 'นายธีระเดช');
  assert.equal(parsed.team?.driver1, 'นายวิชัย');
  assert.equal(parsed.team?.driver2, 'นายสมพงษ์');
  assert.equal(parsed.team?.xrays, 'นายเอก');
  assert.equal(parsed.team?.lab, 'นางสาวมุก');
  assert.equal(parsed.triage?.total, 25);
  assert.equal(parsed.triage?.r, 1);
  assert.equal(parsed.triage?.e, 4);
  assert.equal(parsed.triage?.u, 10);
  assert.equal(parsed.triage?.s, 7);
  assert.equal(parsed.triage?.n, 3);
  assert.equal(parsed.other?.referCount, 1);
});

test('calculateMultiShiftTotals calculates correct sums across 3 shifts', () => {
  const sample = getSampleMultiShiftData();
  const totals = calculateMultiShiftTotals(sample.shifts);

  // เช้า: R:2 E:6 U:12 S:8 N:4 (Total: 32)
  // บ่าย: R:1 E:5 U:10 S:7 N:5 (Total: 28)
  // ดึก: R:1 E:2 U:5 S:4 N:2 (Total: 14)
  assert.equal(totals.r, 4);
  assert.equal(totals.e, 13);
  assert.equal(totals.u, 27);
  assert.equal(totals.s, 19);
  assert.equal(totals.n, 11);
  assert.equal(totals.total, 74);
  assert.equal(totals.byShift.เช้า, 32);
  assert.equal(totals.byShift.บ่าย, 28);
  assert.equal(totals.byShift.ดึก, 14);
  assert.equal(totals.referTotal, 4);
});

test('generateCombinedMultiShiftReport produces 4-part multi-shift handover report', () => {
  const sample = getSampleMultiShiftData();
  const report = generateCombinedMultiShiftReport(sample);

  // 1. หัวข้อ
  assert.ok(report.includes('สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช ช่วงวันที่'));
  assert.ok(report.includes('แยกเวร เช้า/บ่าย/ดึก'));

  // 2. ทีมปฏิบัติงานแยกตามเวร
  assert.ok(report.includes('[ เวรเช้า ]'));
  assert.ok(report.includes('นพ.ธนา สว่างเวช'));
  assert.ok(report.includes('[ เวรบ่าย ]'));
  assert.ok(report.includes('พญ.ไพลิน พิทักษ์ธรรม'));
  assert.ok(report.includes('[ เวรดึก ]'));
  assert.ok(report.includes('นพ.สราวุฒิ มั่นคง'));

  // 3. ตารางสรุปแยกเวร
  assert.ok(report.includes('สรุปจำนวนผู้ป่วยคัดกรองแยกตามระดับความเร่งด่วนและแยกเวร'));
  assert.ok(report.includes('เช้า'));
  assert.ok(report.includes('บ่าย'));
  assert.ok(report.includes('ดึก'));
  assert.ok(report.includes('รวมทุุก'));

  // 4. ข้อสังเกตและประเด็นส่งต่อ
  assert.ok(report.includes('ผู้ป่วย Refer รวมทุกเวร: 4 ราย'));
});

test('Google Apps Script Code.gs and Index.html templates contain all required functions and components', async () => {
  const { CODE_GS_SOURCE, INDEX_HTML_SOURCE } = await import('./gasSource');

  // Verify Code.gs backend functions
  assert.ok(CODE_GS_SOURCE.includes('function doGet(e)'));
  assert.ok(CODE_GS_SOURCE.includes('function doPost(e)'));
  assert.ok(CODE_GS_SOURCE.includes('function setupSheet()'));
  assert.ok(CODE_GS_SOURCE.includes('function saveHandoverShift(data)'));
  assert.ok(CODE_GS_SOURCE.includes('function getDailyDashboardData(targetDate)'));
  assert.ok(CODE_GS_SOURCE.includes('SHEET_NAME_LOG'));
  assert.ok(CODE_GS_SOURCE.includes('SHEET_NAME_DAILY'));

  // Verify Index.html frontend web app structure
  assert.ok(INDEX_HTML_SOURCE.includes('แดชบอร์ดภาพรวมสรุปเวรรายวัน'));
  assert.ok(INDEX_HTML_SOURCE.includes('kpiTotalPatients'));
  assert.ok(INDEX_HTML_SOURCE.includes('kpiHighAcuity'));
  assert.ok(INDEX_HTML_SOURCE.includes('kpiReferTotal'));
  assert.ok(INDEX_HTML_SOURCE.includes('barR'));
  assert.ok(INDEX_HTML_SOURCE.includes('barE'));
  assert.ok(INDEX_HTML_SOURCE.includes('shiftColumnsContainer'));
});

