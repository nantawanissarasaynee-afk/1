import React, { useState } from 'react';
import {
  Copy,
  Check,
  Printer,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  FileText,
  Table,
  BookmarkPlus,
  Layers,
  Sun,
  Sunset,
  Moon,
  ChevronRight
} from 'lucide-react';
import {
  MultiShiftReportData,
  ShiftSelection,
  ShiftType,
  generateHandoverReport,
  generateLineText,
  generateCombinedMultiShiftReport,
  generateCombinedLineText,
  validateTriageStats,
  calculateTriageTotal,
  calculateMultiShiftTotals,
  formatValue,
  formatIncidentOrNotes,
  ShiftData
} from '../utils/shiftReport';

interface ReportPreviewProps {
  data: MultiShiftReportData;
  onSetActiveShift: (shift: ShiftSelection) => void;
  onAttemptCopy: () => void;
  onSaveToHistory: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  data,
  onSetActiveShift,
  onAttemptCopy,
  onSaveToHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'line' | 'plain'>('official');
  const [copied, setCopied] = useState(false);

  const isMultiShift = data.activeShift === 'ทุกเวร';
  const totals = calculateMultiShiftTotals(data.shifts);

  // Active single shift data if not "ทุกเวร"
  const activeSingleShift: ShiftType = !isMultiShift ? (data.activeShift as ShiftType) : 'เช้า';
  const currentSlot = !isMultiShift ? data.shifts[activeSingleShift] : null;
  const singleShiftData: ShiftData | null = !isMultiShift && currentSlot
    ? {
        date: data.dateFormatted,
        shift: activeSingleShift,
        team: currentSlot.team,
        triage: currentSlot.triage,
        other: currentSlot.other,
      }
    : null;

  const singleValidation = singleShiftData ? validateTriageStats(singleShiftData.triage) : null;
  const singleTotal = singleShiftData ? Number(singleShiftData.triage.total) || 0 : 0;
  const calcSinglePct = (count: number) => {
    if (!singleTotal) return '0.0%';
    return `${((count / singleTotal) * 100).toFixed(1)}%`;
  };

  const calcMultiPct = (count: number) => {
    if (totals.total === 0) return '0.0%';
    return `${((count / totals.total) * 100).toFixed(1)}%`;
  };

  const handleCopy = async () => {
    let textToCopy = '';
    if (isMultiShift) {
      if (activeTab === 'line') {
        textToCopy = generateCombinedLineText(data);
      } else {
        textToCopy = generateCombinedMultiShiftReport(data);
      }
    } else if (singleShiftData) {
      if (activeTab === 'line') {
        textToCopy = generateLineText(singleShiftData);
      } else {
        textToCopy = generateHandoverReport(singleShiftData, {
          showWarningBanner: singleValidation ? !singleValidation.isValid : false,
        });
      }
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onAttemptCopy();
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-7rem)] overflow-hidden">
      {/* Top Header & Tabs */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-red-400" />
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              {isMultiShift ? 'รายงานสรุปเวรแยกเวร เช้า/บ่าย/ดึก' : `รายงานสรุปเวร: เวร${data.activeShift}`}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMultiShift
              ? `ช่วงวันที่ ${data.dateFormatted} • รวม 3 เวร (${totals.total} ราย)`
              : `วันที่ ${data.dateFormatted} • ผู้ป่วยคัดกรอง ${singleValidation?.sum || 0} ราย`}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('official')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'official'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>แบบทางการ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'line'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ส่งไลน์ (LINE)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'plain'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ข้อความสรุป</span>
          </button>
        </div>
      </div>

      {/* Quick Shift View Switcher Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 text-xs no-print overflow-x-auto">
        <span className="text-slate-500 font-semibold shrink-0">มุมมองรายงาน:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSetActiveShift('เช้า')}
            className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
              data.activeShift === 'เช้า'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>เวรเช้า</span>
          </button>
          <button
            type="button"
            onClick={() => onSetActiveShift('บ่าย')}
            className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
              data.activeShift === 'บ่าย'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sunset className="w-3 h-3" />
            <span>เวรบ่าย</span>
          </button>
          <button
            type="button"
            onClick={() => onSetActiveShift('ดึก')}
            className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
              data.activeShift === 'ดึก'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>เวรดึก</span>
          </button>
          <button
            type="button"
            onClick={() => onSetActiveShift('ทุกเวร')}
            className={`px-2 py-0.5 rounded font-semibold transition flex items-center gap-1 ${
              data.activeShift === 'ทุกเวร'
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>รวม 3 เวร (แยกเวร)</span>
          </button>
        </div>
      </div>

      {/* Validation Warning Notice if Mismatch on Single Shift */}
      {!isMultiShift && singleValidation && !singleValidation.isValid && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 border-b border-amber-600 no-print">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-900" />
            <span>{singleValidation.message}</span>
          </div>
        </div>
      )}

      {/* Report Content Body */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 print:bg-white print:p-0">
        {/* ======================= TAB: OFFICIAL ======================= */}
        {activeTab === 'official' && (
          <div className="bg-white rounded-lg border border-slate-300 p-5 sm:p-7 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
            {isMultiShift ? (
              /* MULTI-SHIFT OFFICIAL REPORT (แยกเวร เช้า / บ่าย / ดึก) */
              <>
                {/* 1. หัวข้อ */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-red-600">
                    1. หัวข้อรายงาน
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                    สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช ช่วงวันที่ {data.dateFormatted} (แยกเวร เช้า/บ่าย/ดึก)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    หน่วยงานอุบัติเหตุ-ฉุกเฉินและนิติเวช (Emergency &amp; Forensic Department) • สรุปเปรียบเทียบ 3 กะ
                  </p>
                </div>

                {/* 2. รายชื่อทีมปฏิบัติงานแยกตามเวร */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      2. รายชื่อทีมปฏิบัติงานแยกตามเวร
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (ช่องว่างระบุ: ไม่ระบุ)
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    {(['เช้า', 'บ่าย', 'ดึก'] as const).map((sName) => {
                      const slot = data.shifts[sName];
                      const sColor = sName === 'เช้า' ? 'text-amber-800 bg-amber-50/70 border-amber-200' : sName === 'บ่าย' ? 'text-orange-800 bg-orange-50/70 border-orange-200' : 'text-indigo-800 bg-indigo-50/70 border-indigo-200';
                      return (
                        <div key={sName} className={`p-3.5 rounded-lg border ${sColor} space-y-1.5`}>
                          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200/80 pb-1">
                            <span className="flex items-center gap-1.5">
                              {sName === 'เช้า' ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : sName === 'บ่าย' ? <Sunset className="w-3.5 h-3.5 text-orange-600" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                              เวร{sName} ({sName === 'เช้า' ? '08:00 - 16:00' : sName === 'บ่าย' ? '16:00 - 24:00' : '00:00 - 08:00'} น.)
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              ผู้ป่วยคัดกรอง: {calculateTriageTotal(slot.triage)} ราย
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-800 text-xs">
                            <p><span className="font-semibold text-slate-600">• แพทย์เวร:</span> {formatValue(slot.team.doctor)}</p>
                            <p><span className="font-semibold text-slate-600">• Incharge:</span> {formatValue(slot.team.incharge)}</p>
                            <p><span className="font-semibold text-slate-600">• Leader:</span> {formatValue(slot.team.leader)}</p>
                            <p><span className="font-semibold text-slate-600">• Member 1:</span> {formatValue(slot.team.member1)}</p>
                            <p><span className="font-semibold text-slate-600">• Member 2:</span> {formatValue(slot.team.member2)}</p>
                            <p><span className="font-semibold text-slate-600">• AEMT:</span> {formatValue(slot.team.aemt)}</p>
                            <p><span className="font-semibold text-slate-600">• X-ray:</span> {formatValue(slot.team.xrays)}</p>
                            <p><span className="font-semibold text-slate-600">• Lab:</span> {formatValue(slot.team.lab)}</p>
                            <p className="sm:col-span-2"><span className="font-semibold text-slate-600">• พขร.:</span> 1) {formatValue(slot.team.driver1)}  2) {formatValue(slot.team.driver2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วนและแยกเวร (ตาราง) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วนและแยกเวร (ตาราง)
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ผู้รับบริการรวมทุกเวร: <span className="text-red-600 font-bold">{totals.total}</span> ราย
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3">ระดับ</th>
                          <th className="py-2.5 px-3">คำอธิบายความเร่งด่วน</th>
                          <th className="py-2.5 px-2 text-center text-amber-900 bg-amber-50">เช้า</th>
                          <th className="py-2.5 px-2 text-center text-orange-900 bg-orange-50">บ่าย</th>
                          <th className="py-2.5 px-2 text-center text-indigo-900 bg-indigo-50">ดึก</th>
                          <th className="py-2.5 px-3 text-right bg-slate-200/60">รวมทุกเวร</th>
                          <th className="py-2.5 px-3 text-right">สัดส่วน (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* R */}
                        <tr className="hover:bg-red-50/40">
                          <td className="py-2 px-3 font-bold text-red-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                            R
                          </td>
                          <td className="py-2 px-3 text-slate-700">Resuscitation (กู้ชีพทันที)</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-amber-50/30">{data.shifts.เช้า.triage.r}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-orange-50/30">{data.shifts.บ่าย.triage.r}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-indigo-50/30">{data.shifts.ดึก.triage.r}</td>
                          <td className="py-2 px-3 text-right font-bold text-red-600 bg-slate-100/50">{totals.r}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcMultiPct(totals.r)}</td>
                        </tr>
                        {/* E */}
                        <tr className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                            E
                          </td>
                          <td className="py-2 px-3 text-slate-700">Emergency (ฉุกเฉินวิกฤต)</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-amber-50/30">{data.shifts.เช้า.triage.e}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-orange-50/30">{data.shifts.บ่าย.triage.e}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-indigo-50/30">{data.shifts.ดึก.triage.e}</td>
                          <td className="py-2 px-3 text-right font-bold text-amber-600 bg-slate-100/50">{totals.e}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcMultiPct(totals.e)}</td>
                        </tr>
                        {/* U */}
                        <tr className="hover:bg-yellow-50/40">
                          <td className="py-2 px-3 font-bold text-yellow-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                            U
                          </td>
                          <td className="py-2 px-3 text-slate-700">Urgent (เร่งด่วน)</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-amber-50/30">{data.shifts.เช้า.triage.u}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-orange-50/30">{data.shifts.บ่าย.triage.u}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-indigo-50/30">{data.shifts.ดึก.triage.u}</td>
                          <td className="py-2 px-3 text-right font-bold text-yellow-600 bg-slate-100/50">{totals.u}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcMultiPct(totals.u)}</td>
                        </tr>
                        {/* S */}
                        <tr className="hover:bg-emerald-50/40">
                          <td className="py-2 px-3 font-bold text-emerald-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                            S
                          </td>
                          <td className="py-2 px-3 text-slate-700">Semi-urgent (กึ่งเร่งด่วน)</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-amber-50/30">{data.shifts.เช้า.triage.s}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-orange-50/30">{data.shifts.บ่าย.triage.s}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-indigo-50/30">{data.shifts.ดึก.triage.s}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600 bg-slate-100/50">{totals.s}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcMultiPct(totals.s)}</td>
                        </tr>
                        {/* N */}
                        <tr className="hover:bg-slate-100/60">
                          <td className="py-2 px-3 font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                            N
                          </td>
                          <td className="py-2 px-3 text-slate-700">Non-urgent (ไม่ฉุกเฉิน)</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-amber-50/30">{data.shifts.เช้า.triage.n}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-orange-50/30">{data.shifts.บ่าย.triage.n}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800 bg-indigo-50/30">{data.shifts.ดึก.triage.n}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700 bg-slate-100/50">{totals.n}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcMultiPct(totals.n)}</td>
                        </tr>
                      </tbody>
                      <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-100 text-slate-900">
                        <tr>
                          <td colSpan={2} className="py-2.5 px-3">
                            รวมผู้ป่วยคัดกรอง (R+E+U+S+N)
                          </td>
                          <td className="py-2.5 px-2 text-center text-amber-900 bg-amber-100/50">
                            {totals.byShift.เช้า}
                          </td>
                          <td className="py-2.5 px-2 text-center text-orange-900 bg-orange-100/50">
                            {totals.byShift.บ่าย}
                          </td>
                          <td className="py-2.5 px-2 text-center text-indigo-900 bg-indigo-100/50">
                            {totals.byShift.ดึก}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-700 font-extrabold bg-red-50">
                            {totals.total}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            100.0%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อแยกตามเวร */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    4. ข้อสังเกต / ประเด็นที่ต้องส่งต่อแยกตามเวร
                  </span>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-3">
                    <p className="font-bold text-red-700">
                      • ผู้ป่วย Refer รวมทุกเวร: {totals.referTotal} ราย
                    </p>
                    {(['เช้า', 'บ่าย', 'ดึก'] as const).map((sName) => {
                      const slot = data.shifts[sName];
                      return (
                        <div key={sName} className="pl-3 border-l-2 border-slate-300 space-y-1">
                          <p className="font-bold text-slate-800">
                            [ เวร{sName} ]
                          </p>
                          <p className="text-slate-700">
                            - Refer: {slot.other.referCount || 0} ราย {slot.other.referDetails?.trim() ? `(${slot.other.referDetails.trim()})` : ''}
                          </p>
                          <p className="text-slate-700">
                            - เหตุการณ์/อุปกรณ์ผิดปกติ: {formatIncidentOrNotes(slot.other.abnormalIncidents)}
                          </p>
                          <p className="text-slate-700">
                            - เรื่องส่งต่อ: {formatIncidentOrNotes(slot.other.handoverNotes)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : singleShiftData ? (
              /* SINGLE SHIFT OFFICIAL REPORT (เวรเช้า, เวรบ่าย, หรือ เวรดึก) */
              <>
                {/* 1. หัวข้อ */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-red-600">
                    1. หัวข้อรายงาน
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                    สรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช วันที่ {formatValue(singleShiftData.date)} เวร {singleShiftData.shift || 'ไม่ระบุ'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    หน่วยงานอุบัติเหตุ-ฉุกเฉินและนิติเวช (Emergency &amp; Forensic Department)
                  </p>
                </div>

                {/* 2. รายชื่อทีมปฏิบัติงาน 10 ตำแหน่ง */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      2. รายชื่อทีมปฏิบัติงาน
                    </span>
                    <span className="text-[11px] text-slate-500">
                      (ช่องว่างระบุ: ไม่ระบุ)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="space-y-1.5">
                      <p>
                        <span className="font-bold text-slate-700">• แพทย์เวร:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.doctor)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• Incharge:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.incharge)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• Leader:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.leader)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• Member 1:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.member1)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• Member 2:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.member2)}</span>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p>
                        <span className="font-bold text-slate-700">• AEMT:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.aemt)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• X-ray:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.xrays)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• Lab:</span>{' '}
                        <span className="text-slate-900 font-medium">{formatValue(singleShiftData.team.lab)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">• พขร. (พนักงานขับรถ):</span>{' '}
                        <span className="text-slate-900 font-medium">
                          1) {formatValue(singleShiftData.team.driver1)}  2) {formatValue(singleShiftData.team.driver2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (ตาราง) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      3. สรุปจำนวนผู้รับบริการแยกตามระดับความเร่งด่วน (ตาราง)
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ผู้รับบริการรวม: <span className="text-red-600 font-bold">{singleTotal}</span> ราย
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-lg">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3">ระดับ</th>
                          <th className="py-2.5 px-3">คำอธิบายความเร่งด่วน</th>
                          <th className="py-2.5 px-3 text-right">จำนวน (ราย)</th>
                          <th className="py-2.5 px-3 text-right">สัดส่วน (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* R */}
                        <tr className="hover:bg-red-50/40">
                          <td className="py-2 px-3 font-bold text-red-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                            R
                          </td>
                          <td className="py-2 px-3 text-slate-700">Resuscitation (กู้ชีพทันที)</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{singleShiftData.triage.r}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcSinglePct(singleShiftData.triage.r)}</td>
                        </tr>
                        {/* E */}
                        <tr className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                            E
                          </td>
                          <td className="py-2 px-3 text-slate-700">Emergency (ฉุกเฉินวิกฤต)</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{singleShiftData.triage.e}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcSinglePct(singleShiftData.triage.e)}</td>
                        </tr>
                        {/* U */}
                        <tr className="hover:bg-yellow-50/40">
                          <td className="py-2 px-3 font-bold text-yellow-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                            U
                          </td>
                          <td className="py-2 px-3 text-slate-700">Urgent (เร่งด่วน)</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{singleShiftData.triage.u}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcSinglePct(singleShiftData.triage.u)}</td>
                        </tr>
                        {/* S */}
                        <tr className="hover:bg-emerald-50/40">
                          <td className="py-2 px-3 font-bold text-emerald-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                            S
                          </td>
                          <td className="py-2 px-3 text-slate-700">Semi-urgent (กึ่งเร่งด่วน)</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{singleShiftData.triage.s}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcSinglePct(singleShiftData.triage.s)}</td>
                        </tr>
                        {/* N */}
                        <tr className="hover:bg-slate-100/60">
                          <td className="py-2 px-3 font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                            N
                          </td>
                          <td className="py-2 px-3 text-slate-700">Non-urgent (ไม่ฉุกเฉิน)</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{singleShiftData.triage.n}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{calcSinglePct(singleShiftData.triage.n)}</td>
                        </tr>
                      </tbody>
                      <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-100 text-slate-900">
                        <tr>
                          <td colSpan={2} className="py-2.5 px-3">
                            จำนวนผู้ป่วยคัดกรองรวม (R+E+U+S+N)
                          </td>
                          <td className="py-2.5 px-3 text-right text-sm">
                            {singleValidation?.sum || 0}
                          </td>
                          <td className="py-2.5 px-3 text-right text-sm">
                            100.0%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. ข้อสังเกต/ประเด็นที่ต้องส่งต่อเวรถัดไป */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    4. ข้อสังเกต / ประเด็นที่ต้องส่งต่อเวรถัดไป
                  </span>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-2.5">
                    <p>
                      <span className="font-bold text-slate-800">• ผู้ป่วย Refer:</span>{' '}
                      <span className="text-slate-900 font-medium">
                        {Number(singleShiftData.other.referCount) || 0} ราย
                        {singleShiftData.other.referDetails?.trim() ? ` (${singleShiftData.other.referDetails.trim()})` : ''}
                      </span>
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">• เหตุการณ์/อุปกรณ์ผิดปกติ:</span>{' '}
                      <span className="text-slate-900 font-medium">
                        {formatIncidentOrNotes(singleShiftData.other.abnormalIncidents)}
                      </span>
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">• เรื่องที่ต้องส่งต่อเวรถัดไป:</span>{' '}
                      <span className="text-slate-900 font-medium">
                        {formatIncidentOrNotes(singleShiftData.other.handoverNotes)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Fast shortcut button to view multi-shift */}
                <div className="pt-2 no-print">
                  <button
                    type="button"
                    onClick={() => onSetActiveShift('ทุกเวร')}
                    className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold transition flex items-center justify-between"
                  >
                    <span>📊 ดูตารางสรุปเปรียบเทียบรวม 3 เวร (เช้า/บ่าย/ดึก)</span>
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ======================= TAB: LINE ======================= */}
        {activeTab === 'line' && (
          <div className="bg-emerald-950/5 border border-emerald-200 rounded-lg p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800">
                พร้อมคัดลอกส่งเข้า LINE กลุ่มเวร ER &amp; นิติเวช
              </span>
              <span className="text-[11px] text-slate-500">รูปแบบอ่านง่ายบนมือถือ</span>
            </div>
            <pre className="bg-white p-4 rounded-lg border border-slate-300 text-xs sm:text-sm font-sans whitespace-pre-wrap text-slate-800 leading-relaxed select-all">
              {isMultiShift
                ? generateCombinedLineText(data)
                : singleShiftData
                ? generateLineText(singleShiftData)
                : ''}
            </pre>
          </div>
        )}

        {/* ======================= TAB: PLAIN ======================= */}
        {activeTab === 'plain' && (
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                ข้อความสรุปตามรูปแบบทางการ 4 หัวข้อ (ตาราง ASCII)
              </span>
              <span className="text-[11px] text-slate-500">คัดลอกส่งต่อรายงาน</span>
            </div>
            <pre className="bg-white p-4 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono whitespace-pre-wrap text-slate-900 leading-relaxed overflow-x-auto select-all">
              {isMultiShift
                ? generateCombinedMultiShiftReport(data)
                : singleShiftData
                ? generateHandoverReport(singleShiftData, { showWarningBanner: true })
                : ''}
            </pre>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveToHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 transition"
            title="บันทึกเวรนี้ลงประวัติของเครื่อง"
          >
            <BookmarkPlus className="w-4 h-4 text-slate-600" />
            <span>บันทึกประวัติ</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 transition"
            title="พิมพ์รายงานสรุปเวร หรือบันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ / PDF</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition ${
            copied
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4.5 h-4.5" />
              <span>คัดลอกเรียบร้อยแล้ว!</span>
            </>
          ) : (
            <>
              <Copy className="w-4.5 h-4.5" />
              <span>คัดลอกรายงานสรุปเวร</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
