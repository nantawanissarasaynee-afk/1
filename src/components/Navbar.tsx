import React, { useEffect, useState } from 'react';
import {
  Activity,
  Clock,
  FileText,
  ClipboardPaste,
  RotateCcw,
  Sparkles,
  BarChart3,
  FileEdit,
  FileCode,
} from 'lucide-react';
import { ShiftType, ShiftSelection, getCurrentShift, formatThaiDateString } from '../utils/shiftReport';

interface NavbarProps {
  currentShift: ShiftSelection;
  onSetShift: (shift: ShiftSelection) => void;
  onLoadSample: () => void;
  onOpenPasteModal: () => void;
  onReset: () => void;
  savedCount: number;
  onOpenHistory: () => void;
  currentView: 'form' | 'dashboard';
  onSetView: (view: 'form' | 'dashboard') => void;
  onOpenGasModal: () => void;
  totalPatients?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentShift,
  onSetShift,
  onLoadSample,
  onOpenPasteModal,
  onReset,
  savedCount,
  onOpenHistory,
  currentView,
  onSetView,
  onOpenGasModal,
  totalPatients = 0,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [recommendedShift, setRecommendedShift] = useState<ShiftType>('เช้า');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setRecommendedShift(getCurrentShift());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onSetView('dashboard')}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20 ring-2 ring-red-400/30 shrink-0 hover:scale-105 transition"
              title="ดูแดชบอร์ดภาพรวม"
            >
              <Activity className="h-6 w-6 text-white animate-pulse" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate font-heading">
                  ระบบสรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950 text-red-300 border border-red-800">
                  ER & Forensic
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                รายงานส่งเวรทางการ • แดชบอร์ดสรุปเวรรายวัน • เชื่อมต่อ Google Apps Script
              </p>
            </div>
          </div>

          {/* View Switcher Pills (Desktop & Tablet) */}
          <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => onSetView('form')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentView === 'form'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>1. บันทึกสรุปเวร</span>
            </button>

            <button
              type="button"
              onClick={() => onSetView('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentView === 'dashboard'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>2. แดชบอร์ดภาพรวมรายวัน</span>
              {totalPatients > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 text-[10px] font-mono">
                  {totalPatients}
                </span>
              )}
            </button>
          </div>

          {/* Current Live Time & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* GAS Code Button */}
            <button
              type="button"
              onClick={onOpenGasModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/40 transition"
              title="ดูและคัดลอกโค้ด Google Apps Script (Code.gs & index.html)"
            >
              <FileCode className="w-4 h-4 text-red-400" />
              <span className="hidden xl:inline">โค้ด Code.gs/HTML</span>
              <span className="xl:hidden">GAS</span>
            </button>

            {/* Quick Actions */}
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="วางข้อความสรุปเวรเพื่อแยกข้อมูลอัตโนมัติ"
              aria-label="วางข้อความอัตโนมัติ"
            >
              <ClipboardPaste className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">วางข้อความ</span>
            </button>

            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="โหลดข้อมูลตัวอย่างเพื่อทดสอบระบบ"
              aria-label="ตัวอย่างข้อมูล"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">ตัวอย่าง 3 เวร</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 relative transition"
              title="ดูประวัติการบันทึกสรุปเวร"
              aria-label="ประวัติเวร"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">ประวัติ</span>
              {savedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition"
              title="ล้างข้อมูลในฟอร์ม"
              aria-label="ล้างฟอร์ม"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden xl:inline">ล้างฟอร์ม</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
