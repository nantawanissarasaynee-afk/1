import React from 'react';
import { X, Calendar, Clock, Trash2, ArrowUpRight, RotateCcw, AlertTriangle, Layers } from 'lucide-react';
import { MultiShiftReportData, ShiftData, formatValue, calculateMultiShiftTotals } from '../utils/shiftReport';

export type SavedReportItem = MultiShiftReportData | (ShiftData & { shifts?: never });

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedShifts: SavedReportItem[];
  onLoadShift: (shift: SavedReportItem) => void;
  onDeleteShift: (index: number) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedShifts,
  onLoadShift,
  onDeleteShift,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base sm:text-lg">ประวัติบันทึกสรุปเวร</h3>
            <p className="text-xs text-slate-400">
              บันทึกในอุปกรณ์ทั้งหมด {savedShifts.length} รายการ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedShifts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">ยังไม่มีประวัติสรุปเวรที่บันทึกไว้</p>
              <p className="text-xs text-slate-400">
                เมื่อกรอกข้อมูลเสร็จ สามารถกด "บันทึกประวัติ" เพื่อเก็บไว้เรียกดูภายหลังได้
              </p>
            </div>
          ) : (
            savedShifts.map((item, idx) => {
              const isMulti = 'shifts' in item && item.shifts !== undefined;

              if (isMulti) {
                const multiItem = item as MultiShiftReportData;
                const totals = calculateMultiShiftTotals(multiItem.shifts);

                return (
                  <div
                    key={multiItem.id || idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">
                        {multiItem.dateFormatted || 'ไม่ระบุวันที่'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>รวม 3 เวร</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-semibold">
                        <span>ยอดรวม 3 เวร: {totals.total} ราย</span>
                        <span className="text-[11px] text-slate-500">
                          เช้า:{totals.byShift.เช้า} บ่าย:{totals.byShift.บ่าย} ดึก:{totals.byShift.ดึก}
                        </span>
                      </div>
                      <p className="truncate">
                        • แพทย์: {multiItem.shifts.เช้า.team.doctor || 'ไม่ระบุ'} / {multiItem.shifts.บ่าย.team.doctor || 'ไม่ระบุ'} / {multiItem.shifts.ดึก.team.doctor || 'ไม่ระบุ'}
                      </p>
                      <p>• ผู้ป่วย Refer รวม: {totals.referTotal} ราย</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {multiItem.createdAt ? new Date(multiItem.createdAt).toLocaleTimeString('th-TH') : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadShift(multiItem);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                        >
                          <span>เปิดใช้งาน</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteShift(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Legacy single shift format
              const singleItem = item as ShiftData;
              const triageSum =
                Number(singleItem.triage.r || 0) +
                Number(singleItem.triage.e || 0) +
                Number(singleItem.triage.u || 0) +
                Number(singleItem.triage.s || 0) +
                Number(singleItem.triage.n || 0);
              const isMatch = triageSum === Number(singleItem.triage.total || 0);

              return (
                <div
                  key={singleItem.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      วันที่ {formatValue(singleItem.date)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                      เวร{singleItem.shift}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• แพทย์: {formatValue(singleItem.team.doctor)}</p>
                    <p>• Incharge: {formatValue(singleItem.team.incharge)}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-semibold text-slate-700">
                        ผู้รับบริการ: {singleItem.triage.total} ราย
                      </span>
                      <span className="text-slate-400">|</span>
                      <span>
                        Triage: R{singleItem.triage.r} E{singleItem.triage.e} U{singleItem.triage.u} S{singleItem.triage.s} N{singleItem.triage.n}
                      </span>
                    </div>
                  </div>

                  {!isMatch && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      ผลรวม ({triageSum}) ≠ ยอดรวม ({singleItem.triage.total})
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {singleItem.createdAt ? new Date(singleItem.createdAt).toLocaleTimeString('th-TH') : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadShift(singleItem);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                      >
                        <span>เปิดใช้งาน</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteShift(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedShifts.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              ล้างประวัติทั้งหมด
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
