/**
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
    // ไม่มีข้อมูล ส่งข้อมูลจำลองพร้อมใช้งาน
    return getMockDashboardData(queryDate);
  }

  // แผนกโครงสร้างคอลัมน์
  // 0: Timestamp, 1: วันที่, 2: เวร, 3: แพทย์, 4: Incharge, 5: Leader, 6: M1, 7: M2, 8: AEMT, 9: พขร1, 10: พขร2, 11: Xray, 12: Lab
  // 13: Total, 14: R, 15: E, 16: U, 17: S, 18: N, 19: Refer, 20: ReferDetail, 21: Incidents, 22: Handover
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

    // กรองตรงกับวันที่ที่เลือก
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

  // รวมผลสถิติรายวัน
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

/**
 * ข้อมูลตัวอย่างจำลองเมื่อชีตยังไม่มีการบันทึก
 */
function getMockDashboardData(dateStr) {
  return {
    queryDate: dateStr,
    availableDates: [dateStr],
    totalPatients: 84,
    triage: {
      total: 84,
      r: 4,
      e: 14,
      u: 30,
      s: 26,
      n: 10
    },
    highAcuity: {
      count: 18,
      percentage: 21.4
    },
    refer: {
      count: 5,
      percentage: 6.0
    },
    shifts: {
      'เช้า': {
        shift: 'เช้า',
        team: {
          doctor: 'นพ.สมศักดิ์ วงศ์สวัสดิ์',
          incharge: 'พว.สุดาพร ใจดี',
          leader: 'พว.วิมล เกษมสุข',
          member1: 'พว.อารีย์ สุขใส',
          member2: 'พว.กมลวรรณ นิ่มนวล',
          aemt: 'นายสมพร ชูจิตร',
          driver1: 'นายวิเชียร ทองใบ',
          driver2: 'นายมาโนช แสนสุข',
          xrays: 'นายนพดล ปานะบุตร',
          lab: 'ทนพญ.กานดา แจ่มใส'
        },
        triage: { total: 34, r: 1, e: 6, u: 14, s: 10, n: 3 },
        other: {
          referCount: 2,
          referDetails: 'Severe Head Injury 1 ราย, STEMI 1 ราย ส่งต่อ รพ.ศูนย์',
          abnormalIncidents: 'เครื่องวัดสัญญาณชีพโซน CPR ช่องที่ 2 สายชาร์จหลวม แจ้งช่างแล้ว',
          handoverNotes: 'ติดตามผล CT Scan ซ้ำเคส Observation เตียง 3 เวลา 17:00 น.'
        }
      },
      'บ่าย': {
        shift: 'บ่าย',
        team: {
          doctor: 'พญ.ชญานิษฐ์ รัตนพรหม',
          incharge: 'พว.ดวงพร กลิ่นจันทร์',
          leader: 'พว.ชลธิชา สว่างศรี',
          member1: 'พว.เกวลิน ชาญชัย',
          member2: 'พว.อนุสรณ์ จิตตานนท์',
          aemt: 'นายเอกชัย ปิ่นเกล้า',
          driver1: 'นายสมคิด บุญมา',
          driver2: 'นายธวัชชัย รื่นเริง',
          xrays: 'นายธีระศักดิ์ ยิ่งยง',
          lab: 'ทนพ.ธนวัฒน์ พูนผล'
        },
        triage: { total: 32, r: 2, e: 5, u: 11, s: 10, n: 4 },
        other: {
          referCount: 2,
          referDetails: 'Acute Stroke fast-track 1 ราย, Open Fracture 1 ราย',
          abnormalIncidents: 'ไม่มี',
          handoverNotes: 'ยาเสพติดควบคุมพิเศษเบิกทดแทนตู้ฉุกเฉินเรียบร้อย'
        }
      },
      'ดึก': {
        shift: 'ดึก',
        team: {
          doctor: 'นพ.เกียรติศักดิ์ ชัยชนะ',
          incharge: 'พว.พิมพ์ใจ บุญมี',
          leader: 'พว.วรัญญา ศรีสุข',
          member1: 'พว.ณัฐกาญจน์ มีผล',
          member2: 'ไม่ระบุ',
          aemt: 'นายภานุเดช มะลิวรรณ',
          driver1: 'นายมนตรี พันธ์พงษ์',
          driver2: 'นายประสิทธิ์ มั่นคง',
          xrays: 'นายณรงค์ บุญช่วย',
          lab: 'ทนพญ.วรรณา เจริญกิจ'
        },
        triage: { total: 18, r: 1, e: 3, u: 5, s: 6, n: 3 },
        other: {
          referCount: 1,
          referDetails: 'Sepsis with Septic Shock 1 ราย',
          abnormalIncidents: 'ไม่มี',
          handoverNotes: 'รอรับศพส่งชันสูตรนิติเวชเวลา 09:00 น.'
        }
      }
    },
    recordedShiftsCount: 3,
    recordedShifts: ['เช้า', 'บ่าย', 'ดึก'],
    incidents: [
      { shift: 'เช้า', text: 'เครื่องวัดสัญญาณชีพโซน CPR ช่องที่ 2 สายชาร์จหลวม แจ้งช่างแล้ว' }
    ],
    handoverTasks: [
      { shift: 'เช้า', text: 'ติดตามผล CT Scan ซ้ำเคส Observation เตียง 3 เวลา 17:00 น.' },
      { shift: 'ดึก', text: 'รอรับศพส่งชันสูตรนิติเวชเวลา 09:00 น.' }
    ]
  };
}
