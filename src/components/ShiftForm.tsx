import React from 'react';
import {
  Calendar,
  CalendarRange,
  Sun,
  Sunset,
  Moon,
  Layers,
  UserCheck,
  Users,
  HeartPulse,
  Stethoscope,
  Truck,
  FileScan,
  FlaskConical,
  Ambulance,
  AlertOctagon,
  ArrowRightCircle,
  HelpCircle,
  Copy,
  Edit3,
} from 'lucide-react';
import {
  MultiShiftReportData,
  ShiftType,
  ShiftSelection,
  ShiftSlot,
  formatThaiDateString,
  getTodayISODate,
  getYesterdayISODate,
  formatThaiDateRange,
  calculateTriageTotal,
  validateTriageStats,
  calculateMultiShiftTotals,
} from '../utils/shiftReport';
import { TriageCounter } from './TriageCounter';

interface ShiftFormProps {
  data: MultiShiftReportData;
  onChange: (updated: MultiShiftReportData) => void;
  onSyncTotalWithSum?: (shiftKey: ShiftType) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({ data, onChange }) => {
  const dateType = data.dateType || 'single';
  const startDate = data.startDate || getTodayISODate();
  const endDate = data.endDate || getTodayISODate();
  const activeShift = data.activeShift || 'เช้า';

  // Date selection handlers
  const handleDateTypeChange = (newType: 'single' | 'range') => {
    let formatted = '';
    if (newType === 'single') {
      formatted = formatThaiDateString(startDate);
    } else {
      formatted = formatThaiDateRange(startDate, endDate);
    }
    onChange({
      ...data,
      dateType: newType,
      startDate,
      endDate: newType === 'single' ? startDate : endDate,
      dateFormatted: formatted,
    });
  };

  const handleStartDateChange = (val: string) => {
    let formatted = '';
    if (dateType === 'single') {
      formatted = formatThaiDateString(val);
      onChange({
        ...data,
        startDate: val,
        endDate: val,
        dateFormatted: formatted,
      });
    } else {
      formatted = formatThaiDateRange(val, endDate);
      onChange({
        ...data,
        startDate: val,
        dateFormatted: formatted,
      });
    }
  };

  const handleEndDateChange = (val: string) => {
    const formatted = formatThaiDateRange(startDate, val);
    onChange({
      ...data,
      endDate: val,
      dateFormatted: formatted,
    });
  };

  const handleSetToday = () => {
    const today = getTodayISODate();
    const formatted = formatThaiDateString(today);
    onChange({
      ...data,
      dateType: 'single',
      startDate: today,
      endDate: today,
      dateFormatted: formatted,
    });
  };

  const handleSetYesterday = () => {
    const yest = getYesterdayISODate();
    const formatted = formatThaiDateString(yest);
    onChange({
      ...data,
      dateType: 'single',
      startDate: yest,
      endDate: yest,
      dateFormatted: formatted,
    });
  };

  const handleSetNightShiftCrossDay = () => {
    const yest = getYesterdayISODate();
    const today = getTodayISODate();
    const formatted = formatThaiDateRange(yest, today);
    onChange({
      ...data,
      dateType: 'range',
      startDate: yest,
      endDate: today,
      activeShift: 'ดึก',
      dateFormatted: formatted,
    });
  };

  const handleSetPast3Days = () => {
    const end = getTodayISODate();
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const start = `${y}-${m}-${day}`;
    const formatted = formatThaiDateRange(start, end);
    onChange({
      ...data,
      dateType: 'range',
      startDate: start,
      endDate: end,
      dateFormatted: formatted,
    });
  };

  // Active shift updater
  const updateActiveSlot = (updater: (slot: ShiftSlot) => ShiftSlot) => {
    if (activeShift === 'ทุกเวร') return;
    const currentSlot = data.shifts[activeShift];
    const updatedSlot = updater(currentSlot);
    onChange({
      ...data,
      shifts: {
        ...data.shifts,
        [activeShift]: updatedSlot,
      },
    });
  };

  const updateTeamField = (field: keyof ShiftSlot['team'], val: string) => {
    updateActiveSlot((slot) => ({
      ...slot,
      team: {
        ...slot.team,
        [field]: val,
      },
    }));
  };

  const updateOtherField = (field: keyof ShiftSlot['other'], val: any) => {
    updateActiveSlot((slot) => ({
      ...slot,
      other: {
        ...slot.other,
        [field]: val,
      },
    }));
  };

  const updateTriage = (triage: ShiftSlot['triage']) => {
    updateActiveSlot((slot) => ({
      ...slot,
      triage,
    }));
  };

  const handleCopyTeamFrom = (fromShift: ShiftType) => {
    if (activeShift === 'ทุกเวร' || fromShift === activeShift) return;
    const sourceTeam = data.shifts[fromShift].team;
    updateActiveSlot((slot) => ({
      ...slot,
      team: { ...sourceTeam },
    }));
  };

  const updateSpecificShiftTriage = (
    shiftKey: ShiftType,
    field: keyof Omit<ShiftSlot['triage'], 'total'>,
    val: number
  ) => {
    const cur = data.shifts[shiftKey].triage;
    const nextVal = Math.max(0, val);
    const updated = {
      ...cur,
      [field]: nextVal,
    };
    updated.total = updated.r + updated.e + updated.u + updated.s + updated.n;
    onChange({
      ...data,
      shifts: {
        ...data.shifts,
        [shiftKey]: {
          ...data.shifts[shiftKey],
          triage: updated,
        },
      },
    });
  };

  const totals = calculateMultiShiftTotals(data.shifts);

  const SHIFT_TABS: { key: ShiftSelection; label: string; time: string; icon: any; color: string }[] = [
    {
      key: 'เช้า',
      label: 'เวรเช้า',
      time: '08:00 - 16:00 น.',
      icon: Sun,
      color: 'text-amber-600',
    },
    {
      key: 'บ่าย',
      label: 'เวรบ่าย',
      time: '16:00 - 24:00 น.',
      icon: Sunset,
      color: 'text-orange-600',
    },
    {
      key: 'ดึก',
      label: 'เวรดึก',
      time: '00:00 - 08:00 น.',
      icon: Moon,
      color: 'text-indigo-600',
    },
    {
      key: 'ทุกเวร',
      label: 'สรุปรวม 3 เวร',
      time: 'แยกเวร เช้า/บ่าย/ดึก',
      icon: Layers,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. เลือกช่วงวันที่ และ ปฏิทิน */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              เลือกวันที่ / ช่วงเวลาระหว่างวันที่
            </h2>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            ปฏิทินเลือกวัน
          </span>
        </div>

        {/* Date Selector Mode: วันที่เดียว vs ช่วงเวลาระหว่างวันที่ */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-1.5 bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleDateTypeChange('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  dateType === 'single'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-red-600" />
                <span>เลือกวันที่เดียว</span>
              </button>
              <button
                type="button"
                onClick={() => handleDateTypeChange('range')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  dateType === 'range'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-red-600" />
                <span>ช่วงเวลาระหว่างวันที่</span>
              </button>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-[11px] font-semibold px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="text-[11px] font-semibold px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition"
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={handleSetPast3Days}
                className="text-[11px] font-semibold px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition"
              >
                3 วันย้อนหลัง
              </button>
              <button
                type="button"
                onClick={handleSetNightShiftCrossDay}
                className="text-[11px] font-semibold px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md transition"
                title="เวรดึกคาบเกี่ยว เมื่อวาน - วันนี้"
              >
                🌙 เวรดึกข้ามวัน
              </button>
            </div>
          </div>

          {/* Calendar Picker Inputs */}
          {dateType === 'single' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label htmlFor="calendar-single" className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกวันที่จากปฏิทิน:
                </label>
                <input
                  id="calendar-single"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                />
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  วันที่แสดงในรายงาน:
                </span>
                <span className="text-sm font-bold text-red-800 font-heading">
                  {data.dateFormatted || 'ไม่ระบุ'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label htmlFor="calendar-start" className="block text-xs font-bold text-slate-700 mb-1">
                    ตั้งแต่วันที่ (เริ่มต้น):
                  </label>
                  <input
                    id="calendar-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="calendar-end" className="block text-xs font-bold text-slate-700 mb-1">
                    ถึงวันที่ (สิ้นสุด):
                  </label>
                  <input
                    id="calendar-end"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                  />
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  ช่วงเวลาที่แสดงในรายงาน:
                </span>
                <span className="text-sm font-bold text-red-800 font-heading">
                  {data.dateFormatted || 'ไม่ระบุ'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Shift Selection: แยกเวร เช้า / บ่าย / ดึก / รวม 3 เวร */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              แยกเวร เช้า / บ่าย / ดึก <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              ยอดรวม 3 เวร: <strong className="text-red-600 font-bold">{totals.total}</strong> ราย
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SHIFT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeShift === tab.key;
              const shiftCount =
                tab.key === 'ทุกเวร'
                  ? totals.total
                  : calculateTriageTotal(data.shifts[tab.key as ShiftType].triage);

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChange({ ...data, activeShift: tab.key })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition relative ${
                    isSelected
                      ? 'border-red-600 bg-red-50/80 text-red-950 font-bold shadow-sm ring-2 ring-red-500'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : tab.color}`} />
                    <span className="text-xs font-bold">{tab.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{tab.time}</span>
                  <span className={`text-[11px] mt-1 px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {shiftCount} ราย
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* When "สรุปรวม 3 เวร" is active: Show Executive Overview and Matrix Editor */}
      {activeShift === 'ทุกเวร' ? (
        <div className="space-y-6">
          {/* 3 Shifts Overview Cards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  ภาพรวมสถิติแยกตามเวร (เช้า / บ่าย / ดึก)
                </h3>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                รวม 3 เวร: {totals.total} ราย
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* เช้า Card */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span>เวรเช้า (08:00 - 16:00)</span>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    {totals.byShift.เช้า} ราย
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><span className="font-semibold text-slate-600">แพทย์:</span> {data.shifts.เช้า.team.doctor || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Incharge:</span> {data.shifts.เช้า.team.incharge || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Refer:</span> {data.shifts.เช้า.other.referCount || 0} ราย</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold pt-1 border-t border-amber-200/60">
                  <span className="text-red-600">R:{data.shifts.เช้า.triage.r}</span>
                  <span className="text-amber-600">E:{data.shifts.เช้า.triage.e}</span>
                  <span className="text-yellow-600">U:{data.shifts.เช้า.triage.u}</span>
                  <span className="text-emerald-600">S:{data.shifts.เช้า.triage.s}</span>
                  <span className="text-slate-600">N:{data.shifts.เช้า.triage.n}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, activeShift: 'เช้า' })}
                  className="w-full py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลเวรเช้า</span>
                </button>
              </div>

              {/* บ่าย Card */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-orange-900 text-sm">
                    <Sunset className="w-4 h-4 text-orange-600" />
                    <span>เวรบ่าย (16:00 - 24:00)</span>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-orange-200 text-orange-900">
                    {totals.byShift.บ่าย} ราย
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><span className="font-semibold text-slate-600">แพทย์:</span> {data.shifts.บ่าย.team.doctor || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Incharge:</span> {data.shifts.บ่าย.team.incharge || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Refer:</span> {data.shifts.บ่าย.other.referCount || 0} ราย</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold pt-1 border-t border-orange-200/60">
                  <span className="text-red-600">R:{data.shifts.บ่าย.triage.r}</span>
                  <span className="text-amber-600">E:{data.shifts.บ่าย.triage.e}</span>
                  <span className="text-yellow-600">U:{data.shifts.บ่าย.triage.u}</span>
                  <span className="text-emerald-600">S:{data.shifts.บ่าย.triage.s}</span>
                  <span className="text-slate-600">N:{data.shifts.บ่าย.triage.n}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, activeShift: 'บ่าย' })}
                  className="w-full py-1.5 rounded-lg bg-white border border-orange-300 hover:bg-orange-100/70 text-orange-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลเวรบ่าย</span>
                </button>
              </div>

              {/* ดึก Card */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-sm">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>เวรดึก (00:00 - 08:00)</span>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
                    {totals.byShift.ดึก} ราย
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><span className="font-semibold text-slate-600">แพทย์:</span> {data.shifts.ดึก.team.doctor || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Incharge:</span> {data.shifts.ดึก.team.incharge || 'ไม่ระบุ'}</p>
                  <p><span className="font-semibold text-slate-600">Refer:</span> {data.shifts.ดึก.other.referCount || 0} ราย</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold pt-1 border-t border-indigo-200/60">
                  <span className="text-red-600">R:{data.shifts.ดึก.triage.r}</span>
                  <span className="text-amber-600">E:{data.shifts.ดึก.triage.e}</span>
                  <span className="text-yellow-600">U:{data.shifts.ดึก.triage.u}</span>
                  <span className="text-emerald-600">S:{data.shifts.ดึก.triage.s}</span>
                  <span className="text-slate-600">N:{data.shifts.ดึก.triage.n}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, activeShift: 'ดึก' })}
                  className="w-full py-1.5 rounded-lg bg-white border border-indigo-300 hover:bg-indigo-100/70 text-indigo-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลเวรดึก</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Matrix Input Table: Triage across 3 shifts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  ตารางบันทึกจำนวนผู้ป่วยคัดกรองแยกตามเวร (Triage Matrix)
                </h3>
                <p className="text-xs text-slate-500">
                  สามารถกรอกจำนวนผู้ป่วยคัดกรอง (R, E, U, S, N) ได้โดยตรงในแต่ละเวร
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3">ระดับ Triage</th>
                    <th className="py-2.5 px-3 text-center text-amber-900 bg-amber-50/80">🌅 เช้า</th>
                    <th className="py-2.5 px-3 text-center text-orange-900 bg-orange-50/80">☀️ บ่าย</th>
                    <th className="py-2.5 px-3 text-center text-indigo-900 bg-indigo-50/80">🌙 ดึก</th>
                    <th className="py-2.5 px-3 text-right bg-slate-200/70">รวมทุกเวร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* R */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-red-600">
                      R (Resuscitation - กู้ชีพ)
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.เช้า.triage.r === 0 ? '' : data.shifts.เช้า.triage.r}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('เช้า', 'r', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.บ่าย.triage.r === 0 ? '' : data.shifts.บ่าย.triage.r}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('บ่าย', 'r', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.ดึก.triage.r === 0 ? '' : data.shifts.ดึก.triage.r}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('ดึก', 'r', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-red-600 bg-slate-100/50">
                      {totals.r}
                    </td>
                  </tr>

                  {/* E */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-amber-600">
                      E (Emergency - ฉุกเฉิน)
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.เช้า.triage.e === 0 ? '' : data.shifts.เช้า.triage.e}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('เช้า', 'e', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.บ่าย.triage.e === 0 ? '' : data.shifts.บ่าย.triage.e}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('บ่าย', 'e', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.ดึก.triage.e === 0 ? '' : data.shifts.ดึก.triage.e}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('ดึก', 'e', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-600 bg-slate-100/50">
                      {totals.e}
                    </td>
                  </tr>

                  {/* U */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-yellow-600">
                      U (Urgent - เร่งด่วน)
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.เช้า.triage.u === 0 ? '' : data.shifts.เช้า.triage.u}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('เช้า', 'u', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.บ่าย.triage.u === 0 ? '' : data.shifts.บ่าย.triage.u}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('บ่าย', 'u', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.ดึก.triage.u === 0 ? '' : data.shifts.ดึก.triage.u}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('ดึก', 'u', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-yellow-600 bg-slate-100/50">
                      {totals.u}
                    </td>
                  </tr>

                  {/* S */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-emerald-600">
                      S (Semi-urgent - กึ่งเร่งด่วน)
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.เช้า.triage.s === 0 ? '' : data.shifts.เช้า.triage.s}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('เช้า', 's', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.บ่าย.triage.s === 0 ? '' : data.shifts.บ่าย.triage.s}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('บ่าย', 's', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.ดึก.triage.s === 0 ? '' : data.shifts.ดึก.triage.s}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('ดึก', 's', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 bg-slate-100/50">
                      {totals.s}
                    </td>
                  </tr>

                  {/* N */}
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-600">
                      N (Non-urgent - ไม่ฉุกเฉิน)
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.เช้า.triage.n === 0 ? '' : data.shifts.เช้า.triage.n}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('เช้า', 'n', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-orange-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.บ่าย.triage.n === 0 ? '' : data.shifts.บ่าย.triage.n}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('บ่าย', 'n', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center bg-indigo-50/30">
                      <input
                        type="number"
                        min="0"
                        value={data.shifts.ดึก.triage.n === 0 ? '' : data.shifts.ดึก.triage.n}
                        placeholder="0"
                        onChange={(e) => updateSpecificShiftTriage('ดึก', 'n', parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-bold bg-white border border-slate-300 rounded py-1 px-1.5 text-xs focus:ring-2 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-700 bg-slate-100/50">
                      {totals.n}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-100 text-slate-900">
                  <tr>
                    <td className="py-2.5 px-3">รวมผู้ป่วยคัดกรองแต่ละเวร</td>
                    <td className="py-2.5 px-3 text-center text-amber-900 bg-amber-100/60 font-extrabold">
                      {totals.byShift.เช้า}
                    </td>
                    <td className="py-2.5 px-3 text-center text-orange-900 bg-orange-100/60 font-extrabold">
                      {totals.byShift.บ่าย}
                    </td>
                    <td className="py-2.5 px-3 text-center text-indigo-900 bg-indigo-100/60 font-extrabold">
                      {totals.byShift.ดึก}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-700 font-extrabold bg-red-50">
                      {totals.total} ราย
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* When an individual shift (เช้า, บ่าย, or ดึก) is selected: Show its Full Detailed Form */
        <>
          {/* Active Shift Indicator & Quick Copy Staff Toolbar */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base font-heading">
                    กำลังกรอกข้อมูล: เวร{activeShift}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                    {activeShift === 'เช้า' ? '08:00 - 16:00' : activeShift === 'บ่าย' ? '16:00 - 24:00' : '00:00 - 08:00'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  วันที่: {data.dateFormatted}
                </p>
              </div>
            </div>

            {/* Quick Copy staff from other shifts */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
              <span className="text-xs text-slate-400">คัดลอกทีมจาก:</span>
              {activeShift !== 'เช้า' && (
                <button
                  type="button"
                  onClick={() => handleCopyTeamFrom('เช้า')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-semibold transition"
                  title="คัดลอกรายชื่อทีมจากเวรเช้า"
                >
                  <Copy className="w-3 h-3" />
                  <span>เวรเช้า</span>
                </button>
              )}
              {activeShift !== 'บ่าย' && (
                <button
                  type="button"
                  onClick={() => handleCopyTeamFrom('บ่าย')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-semibold transition"
                  title="คัดลอกรายชื่อทีมจากเวรบ่าย"
                >
                  <Copy className="w-3 h-3" />
                  <span>เวรบ่าย</span>
                </button>
              )}
              {activeShift !== 'ดึก' && (
                <button
                  type="button"
                  onClick={() => handleCopyTeamFrom('ดึก')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-semibold transition"
                  title="คัดลอกรายชื่อทีมจากเวรดึก"
                >
                  <Copy className="w-3 h-3" />
                  <span>เวรดึก</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. รายชื่อทีมปฏิบัติงาน 10 ตำแหน่ง */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  รายชื่อทีมปฏิบัติงาน (เวร{activeShift})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                ช่องว่าง = "ไม่ระบุ"
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* รายชื่อแพทย์เวร */}
              <div>
                <label htmlFor="team-doctor" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Stethoscope className="w-3.5 h-3.5 text-red-500" />
                  รายชื่อแพทย์เวร
                </label>
                <input
                  id="team-doctor"
                  type="text"
                  value={data.shifts[activeShift].team.doctor}
                  onChange={(e) => updateTeamField('doctor', e.target.value)}
                  placeholder="เช่น นพ.สมเกียรติ / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* Incharge */}
              <div>
                <label htmlFor="team-incharge" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  Incharge (พยาบาลหัวหน้าเวร)
                </label>
                <input
                  id="team-incharge"
                  type="text"
                  value={data.shifts[activeShift].team.incharge}
                  onChange={(e) => updateTeamField('incharge', e.target.value)}
                  placeholder="เช่น พว.วิภาดา / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* Leader */}
              <div>
                <label htmlFor="team-leader" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-500" />
                  Leader (พยาบาล Leader)
                </label>
                <input
                  id="team-leader"
                  type="text"
                  value={data.shifts[activeShift].team.leader}
                  onChange={(e) => updateTeamField('leader', e.target.value)}
                  placeholder="เช่น พว.ณัฐนนท์ / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* Member 1 */}
              <div>
                <label htmlFor="team-member1" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Member 1
                </label>
                <input
                  id="team-member1"
                  type="text"
                  value={data.shifts[activeShift].team.member1}
                  onChange={(e) => updateTeamField('member1', e.target.value)}
                  placeholder="เช่น พว.สุภาพร / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* Member 2 */}
              <div>
                <label htmlFor="team-member2" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Member 2
                </label>
                <input
                  id="team-member2"
                  type="text"
                  value={data.shifts[activeShift].team.member2}
                  onChange={(e) => updateTeamField('member2', e.target.value)}
                  placeholder="เช่น พว.อนุสรณ์ / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* AEMT */}
              <div>
                <label htmlFor="team-aemt" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  AEMT (เวชกรฉุกเฉิน)
                </label>
                <input
                  id="team-aemt"
                  type="text"
                  value={data.shifts[activeShift].team.aemt}
                  onChange={(e) => updateTeamField('aemt', e.target.value)}
                  placeholder="เช่น นายธีระเดช (AEMT) / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* X-ray */}
              <div>
                <label htmlFor="team-xrays" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <FileScan className="w-3.5 h-3.5 text-purple-500" />
                  X-ray (เจ้าหน้าที่เอกซเรย์)
                </label>
                <input
                  id="team-xrays"
                  type="text"
                  value={data.shifts[activeShift].team.xrays}
                  onChange={(e) => updateTeamField('xrays', e.target.value)}
                  placeholder="เช่น นายเอกชัย / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* Lab */}
              <div>
                <label htmlFor="team-lab" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
                  Lab (เจ้าหน้าที่ห้องปฏิบัติการ)
                </label>
                <input
                  id="team-lab"
                  type="text"
                  value={data.shifts[activeShift].team.lab}
                  onChange={(e) => updateTeamField('lab', e.target.value)}
                  placeholder="เช่น น.ส.มุกดา / ว่าง = 'ไม่ระบุ'"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                />
              </div>

              {/* พขร 1 , 2 */}
              <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  พขร. (พนักงานขับรถพยาบาล) 1 , 2
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="team-driver1" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      พขร 1:
                    </label>
                    <input
                      id="team-driver1"
                      type="text"
                      value={data.shifts[activeShift].team.driver1}
                      onChange={(e) => updateTeamField('driver1', e.target.value)}
                      placeholder="เช่น นายสมบัติ / ว่าง = 'ไม่ระบุ'"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="team-driver2" className="text-[11px] font-semibold text-slate-600 block mb-1">
                      พขร 2:
                    </label>
                    <input
                      id="team-driver2"
                      type="text"
                      value={data.shifts[activeShift].team.driver2}
                      onChange={(e) => updateTeamField('driver2', e.target.value)}
                      placeholder="เช่น นายวิชัย / ว่าง = 'ไม่ระบุ'"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Triage Counter for Active Shift */}
          <TriageCounter
            triage={data.shifts[activeShift].triage}
            onChange={updateTriage}
            onSyncTotalWithSum={() => {
              const val = validateTriageStats(data.shifts[activeShift].triage);
              updateTriage({
                ...data.shifts[activeShift].triage,
                total: val.sum,
              });
            }}
          />

          {/* 4. ข้อมูลอื่น: Refer, เหตุการณ์/อุปกรณ์, เรื่องส่งต่อ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-red-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  ข้อมูลอื่น & ประเด็นส่งต่อ (เวร{activeShift})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                ว่าง = "ไม่มี"
              </span>
            </div>

            {/* Refer */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="refer-count" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Ambulance className="w-4 h-4 text-rose-600" />
                  ผู้ป่วย Refer (ส่งต่อสถานพยาบาลอื่น):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="refer-count"
                    type="number"
                    min="0"
                    value={data.shifts[activeShift].other.referCount === 0 ? '' : data.shifts[activeShift].other.referCount}
                    placeholder="0"
                    onChange={(e) => updateOtherField('referCount', parseInt(e.target.value, 10) || 0)}
                    className="w-16 text-center font-bold text-sm bg-white border border-slate-300 rounded-md py-1 px-2 focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-xs font-medium text-slate-600">ราย</span>
                </div>
              </div>
              <input
                type="text"
                value={data.shifts[activeShift].other.referDetails || ''}
                onChange={(e) => updateOtherField('referDetails', e.target.value)}
                placeholder="รายละเอียดการส่งต่อ (ถ้ามี) เช่น Refer รพ.ศูนย์ 1 ราย (Acute MI)"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* เหตุการณ์/อุปกรณ์ผิดปกติ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="incident-notes" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  เหตุการณ์/อุปกรณ์ผิดปกติ:
                </label>
                <button
                  type="button"
                  onClick={() => updateOtherField('abnormalIncidents', 'ไม่มี')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium underline"
                >
                  ระบุว่า "ไม่มี"
                </button>
              </div>
              <textarea
                id="incident-notes"
                rows={2}
                value={data.shifts[activeShift].other.abnormalIncidents}
                onChange={(e) => updateOtherField('abnormalIncidents', e.target.value)}
                placeholder="ระบุเหตุการณ์หรืออุปกรณ์ชำรุด (หากไม่มี ให้เว้นว่างหรือพิมพ์ 'ไม่มี')"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              />
            </div>

            {/* เรื่องที่ต้องส่งต่อเวรถัดไป */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="handover-notes" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-sky-600" />
                  เรื่องที่ต้องส่งต่อเวรถัดไป:
                </label>
                <button
                  type="button"
                  onClick={() => updateOtherField('handoverNotes', 'ไม่มี')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium underline"
                >
                  ระบุว่า "ไม่มี"
                </button>
              </div>
              <textarea
                id="handover-notes"
                rows={2}
                value={data.shifts[activeShift].other.handoverNotes}
                onChange={(e) => updateOtherField('handoverNotes', e.target.value)}
                placeholder="ระบุข้อสังเกต เคสค้างตรวจ นิติเวชชันสูตร หรือประเด็นส่งต่อ (หากไม่มี ให้เว้นว่างหรือพิมพ์ 'ไม่มี')"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
