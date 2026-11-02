import React, { useState } from 'react';
import { ClipboardPaste, X, Check, Sparkles, AlertCircle } from 'lucide-react';
import { parseShiftText, ShiftData } from '../utils/shiftReport';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: Partial<ShiftData>) => void;
}

const SAMPLE_PASTE_TEXT = `ข้อมูลเวร
- วันที่: 2 พฤศจิกายน 2569
- เวร: เช้า
- รายชื่อแพทย์เวร: พญ.ขวัญชนก รักษ์ไทย
- incharge: พว.กมลทิพย์
- Leader: พว.ปิยะพร
- Member 1: พว.ศิริพร
- Member 2: พว.วรัญญา
- AEMT: นายธีระพงษ์
- X-ray: นายเกรียงไกร
- Lab: นางสาวสุพรรษา
- พขร 1 , 2: 1) นายสมศักดิ์ 2) นายบุญช่วย

จำนวนผู้รับบริการรวม: 28 ราย
- R (Resuscitation): 2 ราย
- E (Emergency): 5 ราย
- U (Urgent): 11 ราย
- S (Semi-urgent): 7 ราย
- N (Non-urgent): 3 ราย

ข้อมูลอื่น
- Refer: 1 ราย (Refer STEMI ไป รพ.มหาราชนครเชียงใหม่)
- เหตุการณ์/อุปกรณ์ผิดปกติ: เครื่อง Monitor ช่อง 3 ส่งศูนย์เครื่องมือแพทย์ซ่อม
- เรื่องที่ต้องส่งต่อเวรถัดไป: Case นิติเวชชันสูตรพลิกศพ รอญาติมาติดต่อช่วงบ่าย`;

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Partial<ShiftData> | null>(null);

  if (!isOpen) return null;

  const handleParse = (inputText: string) => {
    setText(inputText);
    if (!inputText.trim()) {
      setPreview(null);
      return;
    }
    const parsed = parseShiftText(inputText);
    setPreview(parsed);
  };

  const handleApply = () => {
    if (!preview) {
      const parsed = parseShiftText(text);
      onApplyParsedData(parsed);
    } else {
      onApplyParsedData(preview);
    }
    onClose();
  };

  const handleUseSample = () => {
    handleParse(SAMPLE_PASTE_TEXT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-lg">
              <ClipboardPaste className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                วางข้อความเพื่อแยกข้อมูลอัตโนมัติ (Smart Paste)
              </h3>
              <p className="text-xs text-slate-400">
                วางข้อความเวรจาก LINE หรือรายงานเดิม ระบบจะดึงข้อมูลลงช่องให้อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-center">
            <label htmlFor="paste-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              วางข้อความเวรที่นี่:
            </label>
            <button
              type="button"
              onClick={handleUseSample}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ลองใส่ข้อความตัวอย่าง
            </button>
          </div>

          <textarea
            id="paste-input"
            rows={8}
            value={text}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="วางข้อความสรุปเวร เช่น
ข้อมูลเวร
- วันที่: 02/11/2026
- เวร: เช้า
- แพทย์: นพ.ธนา
..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          {preview && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                ผลการตรวจจับข้อมูล:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">วันที่:</span>{' '}
                  {preview.date || 'ไม่พบ'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">เวร:</span>{' '}
                  {preview.shift || 'ไม่พบ'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">แพทย์:</span>{' '}
                  {preview.team?.doctor || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Incharge:</span>{' '}
                  {preview.team?.incharge || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">ผู้ป่วยรวม:</span>{' '}
                  {preview.triage?.total || 0} ราย
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Triage R/E/U/S/N:</span>{' '}
                  {preview.triage?.r || 0}/{preview.triage?.e || 0}/{preview.triage?.u || 0}/{preview.triage?.s || 0}/{preview.triage?.n || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>นำเข้าข้อมูลลงฟอร์ม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
