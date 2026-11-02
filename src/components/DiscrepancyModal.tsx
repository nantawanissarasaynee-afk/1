import React from 'react';
import { AlertTriangle, ArrowRightLeft, X, Check } from 'lucide-react';
import { ValidationResult } from '../utils/shiftReport';

interface DiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  validation: ValidationResult;
  onSyncAndProceed: () => void;
  onProceedAnyway: () => void;
}

export const DiscrepancyModal: React.FC<DiscrepancyModalProps> = ({
  isOpen,
  onClose,
  validation,
  onSyncAndProceed,
  onProceedAnyway,
}) => {
  if (!isOpen) return null;

  const { sum, total, diff } = validation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 text-slate-950 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                แจ้งเตือน: ตรวจพบความคลาดเคลื่อนของสถิติ
              </h3>
              <p className="text-xs text-amber-950 font-medium">
                ผลรวมการคัดกรอง Triage ไม่ตรงกับจำนวนผู้รับบริการรวม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-950 hover:bg-amber-600/30 p-1.5 rounded-lg transition"
            aria-label="ปิดกล่องข้อความ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600 font-semibold border-b border-amber-200 pb-2">
              <span>ข้อมูลสถิติที่ตรวจพบ:</span>
              <span className="text-amber-700 font-bold">
                {diff > 0 ? `เกินอยู่ +${diff} ราย` : `ขาดอยู่ ${diff} ราย`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <span className="block text-xs text-slate-500 font-medium">ผลรวม R+E+U+S+N</span>
                <span className="text-xl font-bold text-amber-700">{sum} ราย</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <span className="block text-xs text-slate-500 font-medium">ยอดรวมที่ระบุ</span>
                <span className="text-xl font-bold text-slate-700">{total} ราย</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 pt-1 text-center">
              ตามหลักเวชระเบียนฉุกเฉิน ยอดผู้รับบริการรวมควรเท่ากับผลรวมของผู้ป่วยทุกระดับ
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              โปรดเลือกแนวทางดำเนินการ:
            </p>

            {/* Option 1: Sync total to sum */}
            <button
              type="button"
              onClick={onSyncAndProceed}
              className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    ปรับยอดรวมเป็น {sum} ราย ให้ตรงกับผลรวม
                  </div>
                  <div className="text-xs text-emerald-700">
                    แนะนำ: แก้ไขจำนวนรวมเป็น {sum} ราย แล้วดำเนินการต่อทันที
                  </div>
                </div>
              </div>
            </button>

            {/* Option 2: Proceed anyway */}
            <button
              type="button"
              onClick={onProceedAnyway}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    ดำเนินการต่อโดยคงตัวเลขเดิมไว้
                  </div>
                  <div className="text-xs text-slate-500">
                    รายงานจะแสดงหมายเหตุแจ้งเตือนความต่าง {Math.abs(diff)} ราย
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            กลับไปแก้ไขตัวเลขในฟอร์ม
          </button>
        </div>
      </div>
    </div>
  );
};
