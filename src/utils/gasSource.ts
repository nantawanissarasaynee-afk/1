/**
 * Static representations of Google Apps Script Code.gs and Index.html
 * for 1-click in-app viewing, copying, and downloading.
 */

export const CODE_GS_SOURCE = `/**
 * Google Apps Script: ER LPH Handover & Daily Overview Dashboard
 * ระบบสรุปเวรและแดชบอร์ดภาพรวมรายวัน งานอุบัติเหตุ-ฉุกเฉินและนิติเวช
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets ใหม่ หรือไฟล์ ER Template
 * 2. ไปที่ ส่วนขยาย (Extensions) > Apps Script
 * 3. วางโค้ดนี้ใน Code.gs
 * 4. สร้างไฟล์ HTML ชื่อ 'index' แล้ววางโค้ดจาก index.html
 * 5. กด Deploy > New deployment > Web app (ตั้งสิทธิ์ Anyone เข้าถึงได้)
 */

const SHEET_NAME_LOG = 'Handover_Log';
const SHEET_NAME_DAILY = 'Daily_Summary';

/**
 * Web App HTTP GET Handler
 * แสดงผลหน้าแดชบอร์ดสรุปเวรภาพรวมรายวัน
 */
function doGet(e) {
  try {
    setupSheet();
    const template = HtmlService.createTemplateFromFile('index');
    return template.evaluate()
      .setTitle('ER & Forensic Daily Dashboard | แดชบอร์ดสรุปเวรรายวัน')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput('<h3>เกิดข้อผิดพลาดในการโหลดแดชบอร์ด: ' + err.toString() + '</h3>');
  }
}

/**
 * Web App HTTP POST Handler
 * สำหรับรับข้อมูลสรุปเวรผ่าน JSON API จากระบบภายนอก
 */
function doPost(e) {
  try {
    setupSheet();
    const postData = JSON.parse(e.postData.contents);
    const result = saveHandoverShift(postData);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'บันทึกข้อมูลสรุปเวรลง Google Sheets สำเร็จ',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * สร้างหรือตรวจสอบโครงสร้างชีตฐานข้อมูลให้พร้อมใช้งาน
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ตรวจสอบแผ่นชีต Handover_Log
  let logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAME_LOG);
    const headers = [
      'Timestamp',
      'วันที่',
      'เวร',
      'แพทย์เวร',
      'Incharge',
      'Leader',
      'Member 1',
      'Member 2',
      'AEMT',
      'พขร 1',
      'พขร 2',
      'X-ray',
      'Lab',
      'จำนวนผู้รับบริการรวม',
      'R (Resuscitation)',
      'E (Emergency)',
      'U (Urgent)',
      'S (Semi-urgent)',
      'N (Non-urgent)',
      'Refer (ราย)',
      'รายละเอียด Refer',
      'เหตุการณ์/อุปกรณ์ผิดปกติ',
      'เรื่องที่ต้องส่งต่อเวรถัดไป'
    ];
    logSheet.appendRow(headers);
    logSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#991b1b')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    logSheet.setFrozenRows(1);
  }

  // 2. ตรวจสอบแผ่นชีต Daily_Summary
  let dailySheet = ss.getSheetByName(SHEET_NAME_DAILY);
  if (!dailySheet) {
    dailySheet = ss.insertSheet(SHEET_NAME_DAILY);
    const summaryHeaders = [
      'วันที่',
      'ผู้รับบริการรวม (ราย)',
      'R กู้ชีพ',
      'E ฉุกเฉิน',
      'U เร่งด่วน',
      'S กึ่งเร่งด่วน',
      'N ไม่เร่งด่วน',
      '% วิกฤต-ฉุกเฉิน (R+E)',
      'Refer รวม',
      'เวรที่บันทึกแล้ว',
      'แพทย์เวรทั้งหมด',
      'Incharge ทั้งหมด',
      'ประเด็นสำคัญส่งต่อ'
    ];
    dailySheet.appendRow(summaryHeaders);
    dailySheet.getRange(1, 1, 1, summaryHeaders.length)
      .setBackground('#1e293b')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    dailySheet.setFrozenRows(1);
  }
}

/**
 * บันทึกข้อมูลสรุปเวรเดี่ยว (1 เวร) ลงชีต Handover_Log
 */
function saveHandoverShift(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (!logSheet) setupSheet();

  const timestamp = new Date();
  const dateStr = data.date || Utilities.formatDate(timestamp, 'GMT+7', 'yyyy-MM-dd');
  const shift = data.shift || 'เช้า';
  const team = data.team || {};
  const triage = data.triage || {};
  const other = data.other || {};

  const row = [
    timestamp,
    dateStr,
    shift,
    team.doctor || 'ไม่ระบุ',
    team.incharge || 'ไม่ระบุ',
    team.leader || 'ไม่ระบุ',
    team.member1 || 'ไม่ระบุ',
    team.member2 || 'ไม่ระบุ',
    team.aemt || 'ไม่ระบุ',
    team.driver1 || 'ไม่ระบุ',
    team.driver2 || 'ไม่ระบุ',
    team.xrays || 'ไม่ระบุ',
    team.lab || 'ไม่ระบุ',
    Number(triage.total) || 0,
    Number(triage.r) || 0,
    Number(triage.e) || 0,
    Number(triage.u) || 0,
    Number(triage.s) || 0,
    Number(triage.n) || 0,
    Number(other.referCount) || 0,
    other.referDetails || 'ไม่มี',
    other.abnormalIncidents || 'ไม่มี',
    other.handoverNotes || 'ไม่มี'
  ];

  logSheet.appendRow(row);
  return { success: true, date: dateStr, shift: shift };
}

/**
 * บันทึกข้อมูลสรุปเวร 3 เวร (เช้า/บ่าย/ดึก)
 */
function saveMultiShiftData(multiData) {
  const results = [];
  const shifts = ['เช้า', 'บ่าย', 'ดึก'];
  for (let i = 0; i < shifts.length; i++) {
    const sName = shifts[i];
    if (multiData.shifts && multiData.shifts[sName]) {
      const payload = {
        date: multiData.startDate || multiData.dateFormatted || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
        shift: sName,
        team: multiData.shifts[sName].team,
        triage: multiData.shifts[sName].triage,
        other: multiData.shifts[sName].other
      };
      results.push(saveHandoverShift(payload));
    }
  }
  return { success: true, count: results.length };
}

/**
 * ดึงข้อมูล Dashboard ภาพรวมรายวัน สำหรับแสดงบนหน้าเว็บ Web App
 * @param {string} targetDate วันที่ในรูปแบบ yyyy-MM-dd หรือปล่อยว่างเพื่อดึงวันนี้
 */
function getDailyDashboardData(targetDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  if (!logSheet) {
    setupSheet();
    logSheet = ss.getSheetByName(SHEET_NAME_LOG);
  }

  const todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  const queryDate = targetDate ? targetDate.trim() : todayStr;

  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return getMockDashboardData(queryDate);
  }

  const shiftsMap = {
    'เช้า': null,
    'บ่าย': null,
    'ดึก': null
  };

  const allDates = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let rowDate = row[1];
    if (rowDate instanceof Date) {
      rowDate = Utilities.formatDate(rowDate, 'GMT+7', 'yyyy-MM-dd');
    } else {
      rowDate = String(rowDate || '').trim();
    }

    if (rowDate) {
      allDates[rowDate] = (allDates[rowDate] || 0) + 1;
    }

    if (rowDate === queryDate) {
      const shiftType = String(row[2]).trim();
      const shiftObj = {
        shift: shiftType,
        team: {
          doctor: row[3] || 'ไม่ระบุ',
          incharge: row[4] || 'ไม่ระบุ',
          leader: row[5] || 'ไม่ระบุ',
          member1: row[6] || 'ไม่ระบุ',
          member2: row[7] || 'ไม่ระบุ',
          aemt: row[8] || 'ไม่ระบุ',
          driver1: row[9] || 'ไม่ระบุ',
          driver2: row[10] || 'ไม่ระบุ',
          xrays: row[11] || 'ไม่ระบุ',
          lab: row[12] || 'ไม่ระบุ'
        },
        triage: {
          total: Number(row[13]) || 0,
          r: Number(row[14]) || 0,
          e: Number(row[15]) || 0,
          u: Number(row[16]) || 0,
          s: Number(row[17]) || 0,
          n: Number(row[18]) || 0
        },
        other: {
          referCount: Number(row[19]) || 0,
          referDetails: row[20] || 'ไม่มี',
          abnormalIncidents: row[21] || 'ไม่มี',
          handoverNotes: row[22] || 'ไม่มี'
        }
      };

      if (['เช้า', 'บ่าย', 'ดึก'].indexOf(shiftType) !== -1) {
        shiftsMap[shiftType] = shiftObj;
      }
    }
  }

  let totalPatients = 0;
  let totalR = 0;
  let totalE = 0;
  let totalU = 0;
  let totalS = 0;
  let totalN = 0;
  let totalRefer = 0;
  const recordedShifts = [];
  const incidentsList = [];
  const handoverList = [];

  const shiftOrder = ['เช้า', 'บ่าย', 'ดึก'];
  shiftOrder.forEach(function(sName) {
    const s = shiftsMap[sName];
    if (s) {
      recordedShifts.push(sName);
      totalPatients += s.triage.total;
      totalR += s.triage.r;
      totalE += s.triage.e;
      totalU += s.triage.u;
      totalS += s.triage.s;
      totalN += s.triage.n;
      totalRefer += s.other.referCount;

      if (s.other.abnormalIncidents && s.other.abnormalIncidents !== 'ไม่มี' && s.other.abnormalIncidents !== 'ไม่ระบุ') {
        incidentsList.push({ shift: sName, text: s.other.abnormalIncidents });
      }
      if (s.other.handoverNotes && s.other.handoverNotes !== 'ไม่มี' && s.other.handoverNotes !== 'ไม่ระบุ') {
        handoverList.push({ shift: sName, text: s.other.handoverNotes });
      }
    }
  });

  const highAcuity = totalR + totalE;
  const highAcuityPercent = totalPatients > 0 ? ((highAcuity / totalPatients) * 100).toFixed(1) : 0;
  const referPercent = totalPatients > 0 ? ((totalRefer / totalPatients) * 100).toFixed(1) : 0;

  return {
    queryDate: queryDate,
    availableDates: Object.keys(allDates).sort().reverse(),
    totalPatients: totalPatients,
    triage: {
      total: totalPatients,
      r: totalR,
      e: totalE,
      u: totalU,
      s: totalS,
      n: totalN
    },
    highAcuity: {
      count: highAcuity,
      percentage: Number(highAcuityPercent)
    },
    refer: {
      count: totalRefer,
      percentage: Number(referPercent)
    },
    shifts: shiftsMap,
    recordedShiftsCount: recordedShifts.length,
    recordedShifts: recordedShifts,
    incidents: incidentsList,
    handoverTasks: handoverList
  };
}

function getMockDashboardData(dateStr) {
  return {
    queryDate: dateStr,
    availableDates: [dateStr],
    totalPatients: 84,
    triage: { total: 84, r: 4, e: 14, u: 30, s: 26, n: 10 },
    highAcuity: { count: 18, percentage: 21.4 },
    refer: { count: 5, percentage: 6.0 },
    shifts: {
      'เช้า': {
        shift: 'เช้า',
        team: { doctor: 'นพ.สมศักดิ์ วงศ์สวัสดิ์', incharge: 'พว.สุดาพร ใจดี', leader: 'พว.วิมล เกษมสุข' },
        triage: { total: 34, r: 1, e: 6, u: 14, s: 10, n: 3 },
        other: { referCount: 2 }
      },
      'บ่าย': {
        shift: 'บ่าย',
        team: { doctor: 'พญ.ชญานิษฐ์ รัตนพรหม', incharge: 'พว.ดวงพร กลิ่นจันทร์', leader: 'พว.ชลธิชา สว่างศรี' },
        triage: { total: 32, r: 2, e: 5, u: 11, s: 10, n: 4 },
        other: { referCount: 2 }
      },
      'ดึก': {
        shift: 'ดึก',
        team: { doctor: 'นพ.เกียรติศักดิ์ ชัยชนะ', incharge: 'พว.พิมพ์ใจ บุญมี', leader: 'พว.วรัญญา ศรีสุข' },
        triage: { total: 18, r: 1, e: 3, u: 5, s: 6, n: 3 },
        other: { referCount: 1 }
      }
    },
    recordedShiftsCount: 3,
    recordedShifts: ['เช้า', 'บ่าย', 'ดึก'],
    incidents: [{ shift: 'เช้า', text: 'เครื่องวัดสัญญาณชีพโซน CPR ช่องที่ 2 สายชาร์จหลวม แจ้งช่างแล้ว' }],
    handoverTasks: [
      { shift: 'เช้า', text: 'ติดตามผล CT Scan ซ้ำเคส Observation เตียง 3 เวลา 17:00 น.' },
      { shift: 'ดึก', text: 'รอรับศพส่งชันสูตรนิติเวชเวลา 09:00 น.' }
    ]
  };
}
`;

export const INDEX_HTML_SOURCE = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ER & Forensic Daily Handover Dashboard | แดชบอร์ดสรุปเวรภาพรวมรายวัน</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Sarabun & Prompt -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Sarabun', sans-serif; }
    h1, h2, h3, h4, h5, h6, .font-heading { font-family: 'Prompt', sans-serif; }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col">

  <!-- Header Section -->
  <header class="bg-slate-900 text-white border-b border-slate-800 shadow-lg sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md shadow-red-600/30 ring-2 ring-red-400/30 shrink-0">
            <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white font-heading">
                แดชบอร์ดภาพรวมสรุปเวรรายวัน (ER & Forensic)
              </h1>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800">
                Google Sheets Log
              </span>
            </div>
            <p class="text-xs text-slate-400">
              งานอุบัติเหตุ-ฉุกเฉินและนิติเวช • ระบบติดตามความเร่งด่วน Triage และส่งต่อเวร
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div class="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <span class="text-slate-400 mr-2 font-medium">วันที่:</span>
            <input type="date" id="datePicker" class="bg-transparent text-white focus:outline-none cursor-pointer" />
          </div>
          <button type="button" onclick="loadDashboard()" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition flex items-center gap-1.5">
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <div id="loadingBox" class="hidden text-center py-12">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-red-600"></div>
      <p class="text-sm text-slate-500 mt-2 font-medium">กำลังโหลดข้อมูลสรุปเวรจาก Google Sheets...</p>
    </div>

    <div id="dashboardRoot" class="space-y-6">
      <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase font-semibold tracking-wider text-red-400">ภาพรวมการให้บริการและส่งเวร</span>
          <h2 id="displayDateThai" class="text-lg sm:text-2xl font-bold font-heading text-white mt-0.5">ประจำวันที่ ...</h2>
        </div>
        <div id="shiftBadgesContainer" class="flex items-center gap-1.5"></div>
      </div>

      <!-- 4 Top Executive KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <span class="text-xs font-semibold text-slate-500">ผู้รับบริการคัดกรองรวม</span>
          <div class="mt-3 flex items-baseline gap-2">
            <span id="kpiTotalPatients" class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">0</span>
            <span class="text-xs text-slate-500">ราย</span>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <span class="text-xs font-semibold text-red-700">วิกฤต-ฉุกเฉิน (R+E)</span>
          <div class="mt-3 flex items-baseline gap-2">
            <span id="kpiHighAcuity" class="text-2xl sm:text-3xl font-extrabold text-red-600 font-heading">0</span>
            <span class="text-xs text-slate-500">ราย</span>
            <span id="kpiHighAcuityPercent" class="ml-auto text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">0%</span>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <span class="text-xs font-semibold text-purple-700">ส่งต่อรักษา (Refer)</span>
          <div class="mt-3 flex items-baseline gap-2">
            <span id="kpiReferTotal" class="text-2xl sm:text-3xl font-extrabold text-purple-700 font-heading">0</span>
            <span class="text-xs text-slate-500">ราย</span>
            <span id="kpiReferPercent" class="ml-auto text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">0%</span>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-purple-600"></div>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <span class="text-xs font-semibold text-emerald-700">การบันทึกส่งเวร</span>
          <div class="mt-3 flex items-baseline gap-2">
            <span id="kpiShiftCount" class="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-heading">0/3</span>
            <span class="text-xs text-slate-500">เวร</span>
            <span id="kpiShiftStatusTag" class="ml-auto text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">ครบ 3 เวร</span>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>
      </div>

      <!-- Triage Spectrum -->
      <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-base text-slate-900 font-heading">สรุปจำนวนผู้ป่วยคัดกรองแยกตามระดับความเร่งด่วน (5 ระดับ)</h3>
          <div class="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">รวม: <span id="triageSumBadge">0</span> ราย</div>
        </div>
        <div class="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div id="barR" style="width: 0%" class="bg-red-600 transition-all duration-500"></div>
          <div id="barE" style="width: 0%" class="bg-amber-500 transition-all duration-500"></div>
          <div id="barU" style="width: 0%" class="bg-yellow-400 transition-all duration-500"></div>
          <div id="barS" style="width: 0%" class="bg-emerald-500 transition-all duration-500"></div>
          <div id="barN" style="width: 0%" class="bg-slate-400 transition-all duration-500"></div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div class="bg-red-50/70 border border-red-200 rounded-xl p-3 text-center">
            <span class="text-red-700 font-bold text-xs">R (กู้ชีพ)</span>
            <div class="text-2xl font-black text-red-700 font-heading mt-1" id="countR">0</div>
            <div class="text-[11px] text-red-600 font-medium" id="percentR">0%</div>
          </div>
          <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
            <span class="text-amber-800 font-bold text-xs">E (ฉุกเฉิน)</span>
            <div class="text-2xl font-black text-amber-800 font-heading mt-1" id="countE">0</div>
            <div class="text-[11px] text-amber-700 font-medium" id="percentE">0%</div>
          </div>
          <div class="bg-yellow-50/70 border border-yellow-200 rounded-xl p-3 text-center">
            <span class="text-yellow-800 font-bold text-xs">U (เร่งด่วน)</span>
            <div class="text-2xl font-black text-yellow-800 font-heading mt-1" id="countU">0</div>
            <div class="text-[11px] text-yellow-700 font-medium" id="percentU">0%</div>
          </div>
          <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
            <span class="text-emerald-800 font-bold text-xs">S (กึ่งเร่งด่วน)</span>
            <div class="text-2xl font-black text-emerald-800 font-heading mt-1" id="countS">0</div>
            <div class="text-[11px] text-emerald-700 font-medium" id="percentS">0%</div>
          </div>
          <div class="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span class="text-slate-700 font-bold text-xs">N (ไม่เร่งด่วน)</span>
            <div class="text-2xl font-black text-slate-700 font-heading mt-1" id="countN">0</div>
            <div class="text-[11px] text-slate-600 font-medium" id="percentN">0%</div>
          </div>
        </div>
      </div>

      <!-- 3 Shift Columns -->
      <div class="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 class="font-bold text-base text-slate-900 font-heading">เปรียบเทียบภาระงานรายเวร (เช้า / บ่าย / ดึก)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="shiftColumnsContainer"></div>
      </div>

      <!-- Incidents & Handover Highlights -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h4 class="font-bold text-sm text-slate-900 font-heading text-rose-700">เหตุการณ์ / อุปกรณ์ขัดข้อง</h4>
          <div id="incidentsListContainer" class="space-y-2 text-xs text-slate-600"></div>
        </div>
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h4 class="font-bold text-sm text-slate-900 font-heading text-sky-700">ประเด็นสำคัญที่ต้องส่งต่อเวรถัดไป</h4>
          <div id="handoverListContainer" class="space-y-2 text-xs text-slate-600"></div>
        </div>
      </div>
    </div>
  </main>

  <footer class="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 text-center">
    <p>ระบบสรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช • Google Apps Script Integration</p>
  </footer>

  <script>
    function getTodayISO() {
      const d = new Date();
      return d.toISOString().split('T')[0];
    }
    window.addEventListener('DOMContentLoaded', function() {
      document.getElementById('datePicker').value = getTodayISO();
      loadDashboard();
    });
    function loadDashboard() {
      const targetDate = document.getElementById('datePicker').value || getTodayISO();
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(renderDashboard)
          .getDailyDashboardData(targetDate);
      } else {
        renderDashboard(getMockClientData(targetDate));
      }
    }
    function renderDashboard(data) {
      document.getElementById('displayDateThai').textContent = 'ประจำวันที่ ' + (data.queryDate || '');
      document.getElementById('kpiTotalPatients').textContent = data.totalPatients || 0;
      document.getElementById('kpiHighAcuity').textContent = data.highAcuity.count || 0;
      document.getElementById('kpiHighAcuityPercent').textContent = (data.highAcuity.percentage || 0) + '%';
      document.getElementById('kpiReferTotal').textContent = data.refer.count || 0;
      document.getElementById('kpiReferPercent').textContent = (data.refer.percentage || 0) + '%';
      document.getElementById('kpiShiftCount').textContent = (data.recordedShiftsCount || 0) + '/3';
      const tot = data.totalPatients || 0;
      const t = data.triage;
      document.getElementById('triageSumBadge').textContent = tot;
      document.getElementById('countR').textContent = t.r;
      document.getElementById('countE').textContent = t.e;
      document.getElementById('countU').textContent = t.u;
      document.getElementById('countS').textContent = t.s;
      document.getElementById('countN').textContent = t.n;
      const pR = tot > 0 ? ((t.r / tot) * 100).toFixed(1) : 0;
      const pE = tot > 0 ? ((t.e / tot) * 100).toFixed(1) : 0;
      const pU = tot > 0 ? ((t.u / tot) * 100).toFixed(1) : 0;
      const pS = tot > 0 ? ((t.s / tot) * 100).toFixed(1) : 0;
      const pN = tot > 0 ? ((t.n / tot) * 100).toFixed(1) : 0;
      document.getElementById('percentR').textContent = pR + '%';
      document.getElementById('percentE').textContent = pE + '%';
      document.getElementById('percentU').textContent = pU + '%';
      document.getElementById('percentS').textContent = pS + '%';
      document.getElementById('percentN').textContent = pN + '%';
      document.getElementById('barR').style.width = pR + '%';
      document.getElementById('barE').style.width = pE + '%';
      document.getElementById('barU').style.width = pU + '%';
      document.getElementById('barS').style.width = pS + '%';
      document.getElementById('barN').style.width = pN + '%';
    }
    function getMockClientData(targetDate) {
      return {
        queryDate: targetDate,
        totalPatients: 84,
        triage: { total: 84, r: 4, e: 14, u: 30, s: 26, n: 10 },
        highAcuity: { count: 18, percentage: 21.4 },
        refer: { count: 5, percentage: 6.0 },
        shifts: {},
        recordedShiftsCount: 3
      };
    }
  </script>
</body>
</html>
`;
