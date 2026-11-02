/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ShiftForm } from './components/ShiftForm';
import { ReportPreview } from './components/ReportPreview';
import { DiscrepancyModal } from './components/DiscrepancyModal';
import { SmartPasteModal } from './components/SmartPasteModal';
import { HistoryDrawer, SavedReportItem } from './components/HistoryDrawer';
import { DailyDashboard } from './components/DailyDashboard';
import { GasExportModal } from './components/GasExportModal';
import { CODE_GS_SOURCE, INDEX_HTML_SOURCE } from './utils/gasSource';
import {
  MultiShiftReportData,
  ShiftSelection,
  ShiftType,
  ShiftData,
  getCurrentShift,
  createDefaultMultiShiftData,
  getSampleMultiShiftData,
  calculateMultiShiftTotals,
  validateTriageStats,
  formatThaiDateString,
  getTodayISODate,
} from './utils/shiftReport';
import { Check, ShieldAlert, Sparkles, Layers, CalendarRange, BarChart3, FileEdit } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<MultiShiftReportData>(() => {
    return createDefaultMultiShiftData();
  });

  const [savedShifts, setSavedShifts] = useState<SavedReportItem[]>(() => {
    try {
      const stored = localStorage.getItem('er_shifts_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [mainView, setMainView] = useState<'form' | 'dashboard'>('form');
  const [isDiscrepancyModalOpen, setIsDiscrepancyModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview' | 'dashboard'>('form');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('er_shifts_history', JSON.stringify(savedShifts));
    } catch (e) {
      console.error(e);
    }
  }, [savedShifts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const totals = calculateMultiShiftTotals(data.shifts);

  const handleLoadSample = () => {
    const sample = getSampleMultiShiftData();
    setData(sample);
    showToast('โหลดข้อมูลตัวอย่างแยกเวร เช้า/บ่าย/ดึก เรียบร้อยแล้ว');
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลเวรทั้งหมดใช่หรือไม่?')) {
      setData(createDefaultMultiShiftData());
      showToast('ล้างข้อมูลฟอร์มเรียบร้อย');
    }
  };

  const handleSaveToHistory = () => {
    const itemToSave: MultiShiftReportData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSavedShifts((prev) => [itemToSave, ...prev]);
    showToast('บันทึกรายงานสรุปเวรลงประวัติเรียบร้อยแล้ว');
  };

  const handleDeleteShift = (index: number) => {
    setSavedShifts((prev) => prev.filter((_, i) => i !== index));
    showToast('ลบรายการบันทึกแล้ว');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการบันทึกทั้งหมด?')) {
      setSavedShifts([]);
      showToast('ล้างประวัติทั้งหมดแล้ว');
    }
  };

  const handleApplyParsed = (parsed: Partial<ShiftData>) => {
    const targetShift: ShiftType = parsed.shift || (data.activeShift === 'ทุกเวร' ? 'เช้า' : data.activeShift);

    setData((prev) => {
      const currentSlot = prev.shifts[targetShift];
      const updatedSlot = {
        team: {
          doctor: parsed.team?.doctor !== undefined && parsed.team.doctor !== '' ? parsed.team.doctor : currentSlot.team.doctor,
          incharge: parsed.team?.incharge !== undefined && parsed.team.incharge !== '' ? parsed.team.incharge : currentSlot.team.incharge,
          leader: parsed.team?.leader !== undefined && parsed.team.leader !== '' ? parsed.team.leader : currentSlot.team.leader,
          member1: parsed.team?.member1 !== undefined && parsed.team.member1 !== '' ? parsed.team.member1 : currentSlot.team.member1,
          member2: parsed.team?.member2 !== undefined && parsed.team.member2 !== '' ? parsed.team.member2 : currentSlot.team.member2,
          aemt: parsed.team?.aemt !== undefined && parsed.team.aemt !== '' ? parsed.team.aemt : currentSlot.team.aemt,
          driver1: parsed.team?.driver1 !== undefined && parsed.team.driver1 !== '' ? parsed.team.driver1 : currentSlot.team.driver1,
          driver2: parsed.team?.driver2 !== undefined && parsed.team.driver2 !== '' ? parsed.team.driver2 : currentSlot.team.driver2,
          xrays: parsed.team?.xrays !== undefined && parsed.team.xrays !== '' ? parsed.team.xrays : currentSlot.team.xrays,
          lab: parsed.team?.lab !== undefined && parsed.team.lab !== '' ? parsed.team.lab : currentSlot.team.lab,
        },
        triage: {
          total: parsed.triage?.total !== undefined ? parsed.triage.total : currentSlot.triage.total,
          r: parsed.triage?.r !== undefined ? parsed.triage.r : currentSlot.triage.r,
          e: parsed.triage?.e !== undefined ? parsed.triage.e : currentSlot.triage.e,
          u: parsed.triage?.u !== undefined ? parsed.triage.u : currentSlot.triage.u,
          s: parsed.triage?.s !== undefined ? parsed.triage.s : currentSlot.triage.s,
          n: parsed.triage?.n !== undefined ? parsed.triage.n : currentSlot.triage.n,
        },
        other: {
          referCount: parsed.other?.referCount !== undefined ? parsed.other.referCount : currentSlot.other.referCount,
          referDetails: parsed.other?.referDetails !== undefined ? parsed.other.referDetails : currentSlot.other.referDetails,
          abnormalIncidents: parsed.other?.abnormalIncidents !== undefined ? parsed.other.abnormalIncidents : currentSlot.other.abnormalIncidents,
          handoverNotes: parsed.other?.handoverNotes !== undefined ? parsed.other.handoverNotes : currentSlot.other.handoverNotes,
        },
      };

      return {
        ...prev,
        dateFormatted: parsed.date || prev.dateFormatted,
        activeShift: targetShift,
        shifts: {
          ...prev.shifts,
          [targetShift]: updatedSlot,
        },
      };
    });

    showToast(`นำเข้าข้อมูลลงในเวร${targetShift} เรียบร้อยแล้ว`);
  };

  const handleLoadSavedItem = (item: SavedReportItem) => {
    if ('shifts' in item && item.shifts !== undefined) {
      setData(item as MultiShiftReportData);
      showToast(`โหลดประวัติช่วงวันที่ ${item.dateFormatted} แล้ว`);
    } else {
      // Legacy single shift convert to multi-shift format
      const single = item as ShiftData;
      const defaultMulti = createDefaultMultiShiftData();
      defaultMulti.dateFormatted = single.date;
      defaultMulti.activeShift = single.shift;
      defaultMulti.shifts[single.shift] = {
        team: single.team,
        triage: single.triage,
        other: single.other,
      };
      setData(defaultMulti);
      showToast(`โหลดประวัติวันที่ ${single.date} เวร${single.shift} แล้ว`);
    }
  };

  // Validation for active shift if single
  const activeShiftValidation =
    data.activeShift !== 'ทุกเวร'
      ? validateTriageStats(data.shifts[data.activeShift].triage)
      : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 pb-16 lg:pb-0">
      {/* Navbar */}
      <Navbar
        currentShift={data.activeShift}
        onSetShift={(shift: ShiftSelection) => setData({ ...data, activeShift: shift })}
        onLoadSample={handleLoadSample}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onReset={handleReset}
        savedCount={savedShifts.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        currentView={mainView}
        onSetView={setMainView}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        totalPatients={totals.total}
      />

      {/* Mobile Sticky Tab Selector */}
      <div className="md:hidden sticky top-16 z-20 bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-center gap-1.5 no-print shadow-sm">
        <button
          type="button"
          onClick={() => {
            setMainView('form');
            setMobileTab('form');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            mainView === 'form' && mobileTab === 'form'
              ? 'bg-red-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>1. กรอกเวร</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMainView('form');
            setMobileTab('preview');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            mainView === 'form' && mobileTab === 'preview'
              ? 'bg-red-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <span>2. รายงาน ({data.activeShift === 'ทุกเวร' ? totals.total : activeShiftValidation?.sum || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMainView('dashboard');
            setMobileTab('dashboard');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            mainView === 'dashboard'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
          <span>3. แดชบอร์ด</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* VIEW 1: Daily Overview Dashboard */}
        {mainView === 'dashboard' ? (
          <DailyDashboard
            data={data}
            onSwitchToShift={(shift: ShiftType) => {
              setData({ ...data, activeShift: shift });
              setMainView('form');
              setMobileTab('form');
              showToast(`เปิดแก้ไขเวร${shift}`);
            }}
            onLoadSample={handleLoadSample}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            savedShifts={savedShifts}
            onSelectHistoricalShift={handleLoadSavedItem}
          />
        ) : (
          /* VIEW 2: Form & Live Report Preview */
          <>
            {/* Helper Banner for Emergency Room & Forensic Team */}
            <section
              aria-label="คำแนะนำการใช้งาน"
              className={`no-print bg-gradient-to-r from-red-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-red-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                mobileTab === 'preview' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-600/30 rounded-xl border border-red-500/30 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-sm sm:text-base text-white font-heading">
                      ระบบผู้ช่วยสรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-600/60 text-white border border-red-400/40">
                      <CalendarRange className="w-3 h-3" />
                      เลือกช่วงวันที่ &amp; แยกเวร เช้า/บ่าย/ดึก
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    เลือกช่วงวันที่ปฏิทิน แยกเวร เช้า (08:00-16:00), บ่าย (16:00-24:00), ดึก (00:00-08:00) และสรุปรวม 3 เวร
                    บันทึกเฉพาะจำนวนผู้ป่วยคัดกรอง (R, E, U, S, N) พร้อมระบบตรวจสอบความถูกต้องอัตโนมัติ (ช่องว่าง = "ไม่ระบุ")
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMainView('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold shadow-sm transition"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>ดูแดชบอร์ดรายวัน</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>โหลดตัวอย่าง 3 เวร</span>
                </button>
              </div>
            </section>

            {/* Form and Preview Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Input Forms (7 Cols on LG) */}
              <div className={`lg:col-span-7 space-y-6 no-print ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                <ShiftForm
                  data={data}
                  onChange={setData}
                />
              </div>

              {/* Right Column: Live Official Handover Report Preview (5 Cols on LG) */}
              <div className={`lg:col-span-5 sticky top-24 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
                <ReportPreview
                  data={data}
                  onSetActiveShift={(shift) => setData({ ...data, activeShift: shift })}
                  onAttemptCopy={() => showToast('คัดลอกรายงานสรุปเวรเรียบร้อยแล้ว')}
                  onSaveToHistory={handleSaveToHistory}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Discrepancy Alert Modal if User Confirms Mismatch */}
      {activeShiftValidation && (
        <DiscrepancyModal
          isOpen={isDiscrepancyModalOpen}
          onClose={() => setIsDiscrepancyModalOpen(false)}
          validation={activeShiftValidation}
          onSyncAndProceed={() => {
            if (data.activeShift !== 'ทุกเวร') {
              setData((prev) => ({
                ...prev,
                shifts: {
                  ...prev.shifts,
                  [prev.activeShift]: {
                    ...prev.shifts[prev.activeShift as ShiftType],
                    triage: {
                      ...prev.shifts[prev.activeShift as ShiftType].triage,
                      total: activeShiftValidation.sum,
                    },
                  },
                },
              }));
            }
            setIsDiscrepancyModalOpen(false);
          }}
          onProceedAnyway={() => {
            setIsDiscrepancyModalOpen(false);
            showToast('ดำเนินการต่อโดยมีหมายเหตุแจ้งเตือน');
          }}
        />
      )}

      {/* Smart Paste Modal */}
      <SmartPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onApplyParsedData={handleApplyParsed}
      />

      {/* Shift History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedShifts={savedShifts}
        onLoadShift={handleLoadSavedItem}
        onDeleteShift={handleDeleteShift}
        onClearAll={handleClearAllHistory}
      />

      {/* Google Apps Script Modal */}
      <GasExportModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        codeGsContent={CODE_GS_SOURCE}
        indexHtmlContent={INDEX_HTML_SOURCE}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-sm font-semibold animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
