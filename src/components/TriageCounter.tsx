import React from 'react';
import { AlertTriangle, CheckCircle2, Plus, Minus, ArrowRightLeft, Info } from 'lucide-react';
import { TriageStats, validateTriageStats } from '../utils/shiftReport';

interface TriageCounterProps {
  triage: TriageStats;
  onChange: (triage: TriageStats) => void;
  onSyncTotalWithSum: () => void;
}

interface TriageLevelConfig {
  key: keyof Omit<TriageStats, 'total'>;
  code: string;
  name: string;
  desc: string;
  thaiLevel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  bgLight: string;
  accentBar: string;
}

const TRIAGE_LEVELS: TriageLevelConfig[] = [
  {
    key: 'r',
    code: 'R',
    name: 'Resuscitation',
    desc: 'กู้ชีพ / ภาวะคุกคามชีวิตทันที',
    thaiLevel: 'ระดับ 1 (กู้ชีพ)',
    badgeBg: 'bg-red-600',
    badgeBorder: 'border-red-500',
    badgeText: 'text-white',
    bgLight: 'bg-red-50/70 border-red-200',
    accentBar: 'bg-red-600',
  },
  {
    key: 'e',
    code: 'E',
    name: 'Emergency',
    desc: 'ฉุกเฉินวิกฤต / เสี่ยงต่อชีวิตสูง',
    thaiLevel: 'ระดับ 2 (ฉุกเฉินวิกฤต)',
    badgeBg: 'bg-amber-600',
    badgeBorder: 'border-amber-500',
    badgeText: 'text-white',
    bgLight: 'bg-amber-50/70 border-amber-200',
    accentBar: 'bg-amber-600',
  },
  {
    key: 'u',
    code: 'U',
    name: 'Urgent',
    desc: 'ฉุกเฉินเร่งด่วน / อาการรุนแรง',
    thaiLevel: 'ระดับ 3 (เร่งด่วน)',
    badgeBg: 'bg-yellow-500',
    badgeBorder: 'border-yellow-400',
    badgeText: 'text-slate-900',
    bgLight: 'bg-yellow-50/70 border-yellow-200',
    accentBar: 'bg-yellow-500',
  },
  {
    key: 's',
    code: 'S',
    name: 'Semi-urgent',
    desc: 'กึ่งเร่งด่วน / ปลอดภัยชั่วคราว',
    thaiLevel: 'ระดับ 4 (กึ่งเร่งด่วน)',
    badgeBg: 'bg-emerald-600',
    badgeBorder: 'border-emerald-500',
    badgeText: 'text-white',
    bgLight: 'bg-emerald-50/70 border-emerald-200',
    accentBar: 'bg-emerald-600',
  },
  {
    key: 'n',
    code: 'N',
    name: 'Non-urgent',
    desc: 'ไม่เร่งด่วน / ตรวจรักษาทั่วไป',
    thaiLevel: 'ระดับ 5 (ไม่เร่งด่วน)',
    badgeBg: 'bg-slate-600',
    badgeBorder: 'border-slate-500',
    badgeText: 'text-white',
    bgLight: 'bg-slate-100/70 border-slate-300',
    accentBar: 'bg-slate-600',
  },
];

export const TriageCounter: React.FC<TriageCounterProps> = ({
  triage,
  onChange,
  onSyncTotalWithSum,
}) => {
  const validation = validateTriageStats(triage);

  const handleUpdate = (field: keyof Omit<TriageStats, 'total'>, delta: number) => {
    const current = Number(triage[field]) || 0;
    const next = Math.max(0, current + delta);
    const updated = {
      ...triage,
      [field]: next,
    };
    // Auto-calculate total from screened patients: R + E + U + S + N
    updated.total = updated.r + updated.e + updated.u + updated.s + updated.n;
    onChange(updated);
  };

  const handleDirectInput = (field: keyof Omit<TriageStats, 'total'>, value: string) => {
    const parsed = parseInt(value, 10);
    const updated = {
      ...triage,
      [field]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    };
    // Auto-calculate total from screened patients: R + E + U + S + N
    updated.total = updated.r + updated.e + updated.u + updated.s + updated.n;
    onChange(updated);
  };

  const total = validation.sum;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              บันทึกจำนวนผู้ป่วยคัดกรอง (Triage)
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
              5 ระดับสากล
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            ระบุเฉพาะจำนวนผู้ป่วยคัดกรองความเร่งด่วน (R, E, U, S, N) ระบบคำนวณยอดรวมให้อัตโนมัติ
          </p>
        </div>

        {/* Total Screened Patients Display */}
        <div className="flex items-center gap-3 bg-red-50/80 px-4 py-2 rounded-xl border border-red-200">
          <div>
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide block">
              จำนวนผู้ป่วยคัดกรองรวม
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-2xl text-red-900 font-heading">
                {validation.sum}
              </span>
              <span className="text-xs font-semibold text-red-700">ราย</span>
              <span className="text-[11px] text-red-600 font-medium">
                (R+E+U+S+N)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification / Alert Banner */}
      {validation.isValid ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold">ตรวจสอบสถิติผ่าน: </span>
              <span>
                ผลรวมระดับความเร่งด่วน (R+E+U+S+N = {validation.sum} ราย) ตรงกับจำนวนผู้รับบริการรวม ({triage.total} ราย)
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-emerald-200/80 text-emerald-900 rounded-md shrink-0">
            ถูกต้อง 100%
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-amber-50 border-2 border-amber-300 text-amber-900 text-sm shadow-sm animate-pulse">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>⚠️ แจ้งเตือนความคลาดเคลื่อนของข้อมูลสถิติ</span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                ผลรวม R+E+U+S+N คือ <strong>{validation.sum} ราย</strong> แต่ยอดรวมที่ระบุคือ <strong>{triage.total} ราย</strong> ({validation.diff > 0 ? `เกินอยู่ ${validation.diff} ราย` : `ขาดอยู่ ${Math.abs(validation.diff)} ราย`})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSyncTotalWithSum}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-sm self-end sm:self-auto shrink-0"
            title="ปรับจำนวนผู้รับบริการรวมให้เท่ากับผลรวม R+E+U+S+N ทันที"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>ปรับยอดรวมเป็น {validation.sum} ราย</span>
          </button>
        </div>
      )}

      {/* Visual Proportion Bar */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>สัดส่วนความเร่งด่วนในเวร</span>
            <span>{validation.sum} / {total} ราย ({total > 0 ? ((validation.sum / total) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {triage.r > 0 && (
              <div
                style={{ width: `${(triage.r / total) * 100}%` }}
                className="bg-red-600 h-full"
                title={`R: ${triage.r} ราย`}
              />
            )}
            {triage.e > 0 && (
              <div
                style={{ width: `${(triage.e / total) * 100}%` }}
                className="bg-amber-600 h-full"
                title={`E: ${triage.e} ราย`}
              />
            )}
            {triage.u > 0 && (
              <div
                style={{ width: `${(triage.u / total) * 100}%` }}
                className="bg-yellow-500 h-full"
                title={`U: ${triage.u} ราย`}
              />
            )}
            {triage.s > 0 && (
              <div
                style={{ width: `${(triage.s / total) * 100}%` }}
                className="bg-emerald-600 h-full"
                title={`S: ${triage.s} ราย`}
              />
            )}
            {triage.n > 0 && (
              <div
                style={{ width: `${(triage.n / total) * 100}%` }}
                className="bg-slate-600 h-full"
                title={`N: ${triage.n} ราย`}
              />
            )}
          </div>
        </div>
      )}

      {/* Triage Level Rows */}
      <div className="grid grid-cols-1 gap-2.5">
        {TRIAGE_LEVELS.map((level) => {
          const val = Number(triage[level.key]) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

          return (
            <div
              key={level.key}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition ${level.bgLight}`}
            >
              {/* Left Badge & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center text-sm shadow-sm ${level.badgeBg} ${level.badgeText}`}
                >
                  {level.code}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">
                      {level.code} ({level.name})
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {level.thaiLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{level.desc}</p>
                </div>
              </div>

              {/* Right Counter & Steppers */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block w-12 text-right">
                  {pct}%
                </span>

                <div className="flex items-center bg-white rounded-lg border border-slate-300 shadow-sm p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdate(level.key, -1)}
                    disabled={val <= 0}
                    className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label={`ลดจำนวน ${level.code}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={val === 0 ? '' : val}
                    placeholder="0"
                    onChange={(e) => handleDirectInput(level.key, e.target.value)}
                    className="w-12 sm:w-14 text-center font-bold text-slate-800 text-sm focus:outline-none"
                    aria-label={`จำนวนผู้ป่วย ${level.code}`}
                  />

                  <button
                    type="button"
                    onClick={() => handleUpdate(level.key, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition"
                    aria-label={`เพิ่มจำนวน ${level.code}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick +5 button */}
                <button
                  type="button"
                  onClick={() => handleUpdate(level.key, 5)}
                  className="hidden md:inline-flex px-2 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                  title="เพิ่ม 5 ราย"
                >
                  +5
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
