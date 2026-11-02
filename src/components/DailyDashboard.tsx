import React, { useState } from 'react';
import {
  MultiShiftReportData,
  ShiftType,
  calculateMultiShiftTotals,
  calculateTriageTotal,
  validateTriageStats,
  formatValue,
  formatIncidentOrNotes,
} from '../utils/shiftReport';
import { SavedReportItem } from './HistoryDrawer';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode,
  HeartPulse,
  Layers,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface DailyDashboardProps {
  data: MultiShiftReportData;
  onSwitchToShift: (shift: ShiftType) => void;
  onLoadSample: () => void;
  onOpenGasModal: () => void;
  savedShifts: SavedReportItem[];
  onSelectHistoricalShift?: (item: SavedReportItem) => void;
}

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  data,
  onSwitchToShift,
  onLoadSample,
  onOpenGasModal,
  savedShifts,
  onSelectHistoricalShift,
}) => {
  const totals = calculateMultiShiftTotals(data.shifts);

  // Check which shifts have recorded data
  const shiftKeys: ShiftType[] = ['เช้า', 'บ่าย', 'ดึก'];
  const shiftsRecorded = shiftKeys.filter((s) => {
    const slot = data.shifts[s];
    const hasTriage = slot.triage.total > 0 || slot.triage.r > 0 || slot.triage.e > 0;
    const hasTeam = Boolean(slot.team.doctor || slot.team.incharge);
    return hasTriage || hasTeam;
  });

  // High Acuity (R + E)
  const highAcuityCount = totals.r + totals.e;
  const highAcuityPercent = totals.total > 0 ? ((highAcuityCount / totals.total) * 100).toFixed(1) : '0.0';
  const referPercent = totals.total > 0 ? ((totals.referTotal / totals.total) * 100).toFixed(1) : '0.0';

  // Individual Triage percentages
  const calcPct = (count: number) => {
    if (totals.total === 0) return '0.0%';
    return `${((count / totals.total) * 100).toFixed(1)}%`;
  };

  const pctR = totals.total > 0 ? (totals.r / totals.total) * 100 : 0;
  const pctE = totals.total > 0 ? (totals.e / totals.total) * 100 : 0;
  const pctU = totals.total > 0 ? (totals.u / totals.total) * 100 : 0;
  const pctS = totals.total > 0 ? (totals.s / totals.total) * 100 : 0;
  const pctN = totals.total > 0 ? (totals.n / totals.total) * 100 : 0;

  // Validation warnings across all 3 shifts
  const shiftValidations = shiftKeys.map((s) => ({
    shift: s,
    validation: validateTriageStats(data.shifts[s].triage),
  }));
  const invalidShifts = shiftValidations.filter((v) => !v.validation.isValid);

  // Collect incidents & handovers
  const incidentsList = shiftKeys
    .map((s) => ({
      shift: s,
      text: formatIncidentOrNotes(data.shifts[s].other.abnormalIncidents),
    }))
    .filter((item) => item.text !== 'ไม่มี' && item.text !== 'ไม่ระบุ');

  const handoverList = shiftKeys
    .map((s) => ({
      shift: s,
      text: formatIncidentOrNotes(data.shifts[s].other.handoverNotes),
    }))
    .filter((item) => item.text !== 'ไม่มี' && item.text !== 'ไม่ระบุ');

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Executive Hero Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm">
                <HeartPulse className="w-3.5 h-3.5" />
                แดชบอร์ดภาพรวมรายวัน (Daily ER Overview)
              </span>
              <span className="text-xs text-slate-300 font-medium bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                งานอุบัติเหตุ-ฉุกเฉินและนิติเวช
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-heading text-white">
              สรุปภาพรวมเวร: {data.dateFormatted || 'วันที่ยังไม่ระบุ'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ติดตามสถิติผู้ป่วยคัดกรอง 5 ระดับ (Triage), สัดส่วนผู้ป่วยวิกฤต-ฉุกเฉิน (High Acuity), ยอดส่งต่อรักษา (Refer) 
              และการปฏิบัติงานครบ 3 เวร (เช้า 08-16 / บ่าย 16-24 / ดึก 00-08)
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={onOpenGasModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-900/40 transition ring-1 ring-red-400/40"
              title="ดูโค้ด Code.gs และ index.html สำหรับ Google Apps Script"
            >
              <FileCode className="w-4 h-4 text-white" />
              <span>โค้ด Code.gs / index.html</span>
            </button>

            {totals.total === 0 && (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>โหลดตัวอย่าง 3 เวร</span>
              </button>
            )}
          </div>
        </div>

        {/* Shift Completion Badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">สถานะบันทึก 3 เวร:</span>
            <div className="flex items-center gap-1.5">
              {shiftKeys.map((s) => {
                const isLogged = shiftsRecorded.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSwitchToShift(s)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      isLogged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title={`คลิกเพื่อดู/แก้ไขเวร${s}`}
                  >
                    <span>เวร{s}</span>
                    {isLogged ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] text-slate-500">-</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-slate-400 text-xs">
            อัปเดตข้อมูลล่าสุด: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </div>
        </div>
      </section>

      {/* Discrepancy Alert Bar if any shift totals don't match */}
      {invalidShifts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="font-bold font-heading block">พบความคลาดเคลื่อนของจำนวนผู้ป่วยคัดกรอง:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 text-xs">
              {invalidShifts.map((iv) => (
                <li key={iv.shift}>
                  <strong>เวร{iv.shift}:</strong> {iv.validation.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* KPI 1: Total Patients */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ผู้รับบริการคัดกรองรวม 3 เวร</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-heading">
              {totals.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">ราย</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
            <span>เช้า: {totals.byShift.เช้า}</span>
            <span>บ่าย: {totals.byShift.บ่าย}</span>
            <span>ดึก: {totals.byShift.ดึก}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        {/* KPI 2: High Acuity (R + E) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700">วิกฤต-ฉุกเฉิน (R + E)</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-red-600 font-heading">
              {highAcuityCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">ราย</span>
            <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              {highAcuityPercent}%
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-red-700 font-semibold">🔴 R (กู้ชีพ): {totals.r}</span>
            <span className="text-amber-700 font-semibold">🟠 E (ฉุกเฉิน): {totals.e}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
        </div>

        {/* KPI 3: Referrals */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">ส่งต่อรักษา (Refer)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-purple-700 font-heading">
              {totals.referTotal}
            </span>
            <span className="text-xs text-slate-500 font-medium">ราย</span>
            <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              {referPercent}%
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2 truncate">
            <span>ส่งต่อไปยัง รพ.ระดับสูงกว่า / รพ.ศูนย์</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600"></div>
        </div>

        {/* KPI 4: Completeness */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">ความครบถ้วนของเวร</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-heading">
              {shiftsRecorded.length}/3
            </span>
            <span className="text-xs text-slate-500 font-medium">เวร</span>
            <span
              className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                shiftsRecorded.length === 3
                  ? 'text-emerald-800 bg-emerald-100'
                  : 'text-amber-800 bg-amber-100'
              }`}
            >
              {shiftsRecorded.length === 3 ? 'ครบ 3 เวร' : `ขาด ${3 - shiftsRecorded.length} เวร`}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>เวรเช้า (08-16) • บ่าย (16-24) • ดึก (00-08)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

      </div>

      {/* Triage Spectrum Section */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 font-heading">
                สรุปจำนวนผู้ป่วยคัดกรองแยกตามระดับความเร่งด่วน (5 ระดับ)
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                รวม 3 เวร
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เกณฑ์การคัดแยกประเภทผู้ป่วยอุบัติเหตุและฉุกเฉิน (Emergency Severity Index / Triage Spectrum)
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            ยอดรวมทั้งหมด: <span className="text-slate-950 font-black text-sm">{totals.total}</span> ราย
          </div>
        </div>

        {/* Stacked Percentage Visual Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/60">
            <div
              style={{ width: `${pctR}%` }}
              className="bg-red-600 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              title={`R: ${totals.r} (${pctR.toFixed(1)}%)`}
            >
              {pctR >= 5 ? `${pctR.toFixed(0)}%` : ''}
            </div>
            <div
              style={{ width: `${pctE}%` }}
              className="bg-amber-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              title={`E: ${totals.e} (${pctE.toFixed(1)}%)`}
            >
              {pctE >= 5 ? `${pctE.toFixed(0)}%` : ''}
            </div>
            <div
              style={{ width: `${pctU}%` }}
              className="bg-yellow-400 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-slate-900 overflow-hidden"
              title={`U: ${totals.u} (${pctU.toFixed(1)}%)`}
            >
              {pctU >= 5 ? `${pctU.toFixed(0)}%` : ''}
            </div>
            <div
              style={{ width: `${pctS}%` }}
              className="bg-emerald-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              title={`S: ${totals.s} (${pctS.toFixed(1)}%)`}
            >
              {pctS >= 5 ? `${pctS.toFixed(0)}%` : ''}
            </div>
            <div
              style={{ width: `${pctN}%` }}
              className="bg-slate-400 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              title={`N: ${totals.n} (${pctN.toFixed(1)}%)`}
            >
              {pctN >= 5 ? `${pctN.toFixed(0)}%` : ''}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 5 Triage Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          {/* Level 1: R */}
          <div className="bg-red-50/80 border border-red-200/90 rounded-2xl p-3.5 text-center flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>R (กู้ชีพ)</span>
              </div>
              <div className="text-3xl font-black text-red-700 font-heading mt-2">
                {totals.r}
              </div>
              <div className="text-xs text-red-600 font-bold mt-0.5">
                {calcPct(totals.r)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-red-200/60 text-[10px] text-red-800">
              <span className="font-semibold block">Resuscitation</span>
              <span>ต้องช่วยชีวิตทันที (0 นาที)</span>
            </div>
          </div>

          {/* Level 2: E */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 text-center flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>E (ฉุกเฉิน)</span>
              </div>
              <div className="text-3xl font-black text-amber-800 font-heading mt-2">
                {totals.e}
              </div>
              <div className="text-xs text-amber-700 font-bold mt-0.5">
                {calcPct(totals.e)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-amber-800">
              <span className="font-semibold block">Emergency</span>
              <span>ภาวะฉุกเฉินวิกฤต (&lt; 15 นาที)</span>
            </div>
          </div>

          {/* Level 3: U */}
          <div className="bg-yellow-50/80 border border-yellow-200/90 rounded-2xl p-3.5 text-center flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                <span>U (เร่งด่วน)</span>
              </div>
              <div className="text-3xl font-black text-yellow-800 font-heading mt-2">
                {totals.u}
              </div>
              <div className="text-xs text-yellow-700 font-bold mt-0.5">
                {calcPct(totals.u)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-yellow-200/60 text-[10px] text-yellow-800">
              <span className="font-semibold block">Urgent</span>
              <span>ภาวะเร่งด่วน (&lt; 30 นาที)</span>
            </div>
          </div>

          {/* Level 4: S */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 text-center flex flex-col justify-between shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>S (กึ่งเร่งด่วน)</span>
              </div>
              <div className="text-3xl font-black text-emerald-800 font-heading mt-2">
                {totals.s}
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-0.5">
                {calcPct(totals.s)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800">
              <span className="font-semibold block">Semi-urgent</span>
              <span>กึ่งเร่งด่วน (&lt; 60 นาที)</span>
            </div>
          </div>

          {/* Level 5: N */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center flex flex-col justify-between shadow-xs col-span-2 sm:col-span-1">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-400 text-white font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>N (ไม่ฉุกเฉิน)</span>
              </div>
              <div className="text-3xl font-black text-slate-700 font-heading mt-2">
                {totals.n}
              </div>
              <div className="text-xs text-slate-600 font-bold mt-0.5">
                {calcPct(totals.n)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
              <span className="font-semibold block">Non-urgent</span>
              <span>ไม่ฉุกเฉิน (&lt; 120 นาที)</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3-Shift Comparison Matrix */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 font-heading">
              เปรียบเทียบภาระงานรายเวร (เช้า / บ่าย / ดึก)
            </h3>
            <p className="text-xs text-slate-500">
              แสดงทีมแพทย์-พยาบาล, จำนวนผู้ป่วยตามความเร่งด่วน และสัดส่วนภาระงานต่อวัน
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg">
            คลิกที่การ์ดเพื่อสลับไปแก้ไขเวรนั้นๆ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {shiftKeys.map((s) => {
            const slot = data.shifts[s];
            const shiftCount = totals.byShift[s];
            const shiftPct = totals.total > 0 ? ((shiftCount / totals.total) * 100).toFixed(1) : '0.0';

            const timeRanges: Record<ShiftType, string> = {
              เช้า: '08:00 - 16:00 น.',
              บ่าย: '16:00 - 24:00 น.',
              ดึก: '00:00 - 08:00 น.',
            };

            const headerColors: Record<ShiftType, string> = {
              เช้า: 'from-amber-600 to-yellow-600',
              บ่าย: 'from-orange-600 to-amber-700',
              ดึก: 'from-indigo-700 to-slate-800',
            };

            return (
              <div
                key={s}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-red-300 transition shadow-xs"
              >
                {/* Shift Card Header */}
                <div>
                  <div className={`bg-gradient-to-r ${headerColors[s]} text-white px-4 py-3 flex items-center justify-between`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base font-heading">เวร{s}</span>
                        <span className="text-[11px] opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded">
                          {timeRanges[s]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black font-heading">{shiftCount}</span>
                      <span className="text-[11px] ml-1 opacity-90">ราย ({shiftPct}%)</span>
                    </div>
                  </div>

                  {/* Team Details */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">แพทย์เวร:</span>
                        <span className="font-semibold text-slate-800 text-right truncate">
                          {formatValue(slot.team.doctor)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">Incharge:</span>
                        <span className="font-semibold text-slate-800 text-right truncate">
                          {formatValue(slot.team.incharge)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">Leader:</span>
                        <span className="font-semibold text-slate-800 text-right truncate">
                          {formatValue(slot.team.leader)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">AEMT / พขร:</span>
                        <span className="text-slate-700 text-right truncate text-[11px]">
                          {formatValue(slot.team.aemt)} • {formatValue(slot.team.driver1)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0">X-ray / Lab:</span>
                        <span className="text-slate-700 text-right truncate text-[11px]">
                          {formatValue(slot.team.xrays)} • {formatValue(slot.team.lab)}
                        </span>
                      </div>
                    </div>

                    {/* Triage Mini-Breakdown */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                        <span>สถิติผู้ป่วยคัดกรอง:</span>
                        <span className="font-bold text-slate-900">{slot.triage.total} ราย</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1 text-[11px] text-center font-bold">
                        <div className="bg-red-100 text-red-700 py-1 rounded">
                          <span className="block text-[9px] text-red-500">R</span>
                          {slot.triage.r}
                        </div>
                        <div className="bg-amber-100 text-amber-800 py-1 rounded">
                          <span className="block text-[9px] text-amber-600">E</span>
                          {slot.triage.e}
                        </div>
                        <div className="bg-yellow-100 text-yellow-800 py-1 rounded">
                          <span className="block text-[9px] text-yellow-600">U</span>
                          {slot.triage.u}
                        </div>
                        <div className="bg-emerald-100 text-emerald-800 py-1 rounded">
                          <span className="block text-[9px] text-emerald-600">S</span>
                          {slot.triage.s}
                        </div>
                        <div className="bg-slate-200 text-slate-700 py-1 rounded">
                          <span className="block text-[9px] text-slate-500">N</span>
                          {slot.triage.n}
                        </div>
                      </div>
                    </div>

                    {/* Refer count */}
                    <div className="flex items-center justify-between text-xs pt-2 text-purple-800 font-semibold">
                      <span>ส่งต่อ (Refer):</span>
                      <span className="bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                        {slot.other.referCount} ราย
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch to Edit Button */}
                <div className="p-3 bg-white border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => onSwitchToShift(s)}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 hover:border-red-300 transition flex items-center justify-center gap-1.5"
                  >
                    <span>เปิดแก้ไขเวร{s}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incidents & Handover Highlights Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Incidents / Equipment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 pb-2 border-b border-slate-100">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 font-heading">
                เหตุการณ์และอุปกรณ์ผิดปกติ
              </h4>
              <p className="text-xs text-slate-500">รายงานปัญหาเครื่องมือแพทย์และสิ่งแวดล้อมฉุกเฉิน</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {incidentsList.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                ไม่มีรายงานเหตุการณ์หรืออุปกรณ์ขัดข้อง
              </div>
            ) : (
              incidentsList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 text-rose-950 flex items-start gap-2.5 text-xs leading-relaxed"
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800 shrink-0">
                    เวร{item.shift}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Handover tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sky-700 pb-2 border-b border-slate-100">
            <Clock className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 font-heading">
                ประเด็นสำคัญที่ต้องส่งต่อเวรถัดไป
              </h4>
              <p className="text-xs text-slate-500">ภาระงานค้างรับส่งเวร, ผลตรวจแล็บ, เคสนิติเวช</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {handoverList.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                ไม่มีประเด็นค้างส่งต่อเวรถัดไป
              </div>
            ) : (
              handoverList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-sky-50/80 border border-sky-200/80 text-sky-950 flex items-start gap-2.5 text-xs leading-relaxed"
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-200 text-sky-800 shrink-0">
                    เวร{item.shift}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Google Apps Script Integration Footer Card */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-600/30 rounded-xl border border-red-500/30 shrink-0">
            <FileCode className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white font-heading">
              เชื่อมต่อ Google Sheets &amp; Apps Script Web App
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              นำไฟล์ <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Code.gs</code> และ{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">index.html</code> ไปติดตั้งบน Google Drive 
              เพื่อให้บุคลากรในโรงพยาบาลเปิดดูแดชบอร์ดสรุปเวรผ่านเว็บแอปได้ทันที
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGasModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md transition shrink-0 self-start sm:self-auto"
        >
          <FileCode className="w-4 h-4" />
          <span>เปิดดูโค้ดและวิธีติดตั้ง</span>
        </button>
      </section>

    </div>
  );
};
