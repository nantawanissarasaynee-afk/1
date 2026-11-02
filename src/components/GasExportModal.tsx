import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Globe, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react';

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeGsContent: string;
  indexHtmlContent: string;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({
  isOpen,
  onClose,
  codeGsContent,
  indexHtmlContent,
}) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'indexhtml' | 'guide'>('codegs');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => {
      setCopiedTab(null);
    }, 2500);
  };

  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg font-heading text-white">
                  โค้ด Google Apps Script (Code.gs &amp; index.html)
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  พร้อมใช้งาน
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ติดตั้งลง Google Sheets เพื่อใช้งานแดชบอร์ดสรุปเวรรายวันแบบ Web App เชื่อมโยงข้อมูลอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('codegs')}
              className={`px-3 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition ${
                activeTab === 'codegs'
                  ? 'bg-white text-red-700 border-slate-200 shadow-sm'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>1. Code.gs (สคริปต์เซิร์ฟเวอร์)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('indexhtml')}
              className={`px-3 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition ${
                activeTab === 'indexhtml'
                  ? 'bg-white text-red-700 border-slate-200 shadow-sm'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>2. index.html (หน้าเว็บแดชบอร์ด)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition ${
                activeTab === 'guide'
                  ? 'bg-white text-red-700 border-slate-200 shadow-sm'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>3. วิธีติดตั้ง (คู่มือขั้นตอน)</span>
            </button>
          </div>

          {/* Action buttons for active code tab */}
          {activeTab !== 'guide' && (
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeTab === 'codegs' ? codeGsContent : indexHtmlContent,
                    activeTab
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกโค้ด</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    activeTab === 'codegs' ? 'Code.gs' : 'index.html',
                    activeTab === 'codegs' ? codeGsContent : indexHtmlContent,
                    activeTab === 'codegs' ? 'text/javascript' : 'text/html'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'codegs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-mono font-medium">ไฟล์: Code.gs (Google Apps Script)</span>
                <span>ฟังก์ชัน: doGet, doPost, setupSheet, getDailyDashboardData, saveHandoverShift</span>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800 select-all">
                {codeGsContent}
              </pre>
            </div>
          )}

          {activeTab === 'indexhtml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-mono font-medium">ไฟล์: index.html (HTML/Tailwind CSS Web App)</span>
                <span>ส่วนประกอบ: KPI แดชบอร์ด, แถบ 5 Triage, เปรียบเทียบ 3 เวร, รายการส่งต่อ</span>
              </div>
              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800 select-all">
                {indexHtmlContent}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-5 text-sm text-slate-700 max-w-3xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
                <h4 className="font-bold text-base font-heading flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-600" />
                  ขั้นตอนการนำไปติดตั้งใช้งานใน Google Sheets (ใช้เวลาเพียง 2 นาที)
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  ระบบนี้จะเชื่อมต่อข้อมูลส่งเวรลงชีต <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono">Handover_Log</code> และแสดงแดชบอร์ดภาพรวมสรุปเวรรายวันผ่าน Web App ได้ทันที
                </p>
              </div>

              <ol className="space-y-4">
                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-heading">เปิด Google Sheets</strong>
                    <span className="text-xs text-slate-600 leading-relaxed">
                      สร้าง Google Sheets ใหม่ หรือใช้ไฟล์เทมเพลตเดิมของโรงพยาบาล จากนั้นไปที่เมนู <strong className="text-slate-800">ส่วนขยาย (Extensions)</strong> &gt; <strong className="text-slate-800">Apps Script</strong>
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-heading">วางโค้ดใน Code.gs</strong>
                    <span className="text-xs text-slate-600 leading-relaxed">
                      ลบโค้ดเดิมในแท็บ <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-xs">Code.gs</code> ออกทั้งหมด แล้วคัดลอกโค้ดจากแท็บ <strong className="text-red-700">1. Code.gs</strong> มาวางแทนที่ แล้วกดบันทึก (Ctrl+S หรือรูปแผ่นดิสก์)
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-heading">สร้างไฟล์ index.html</strong>
                    <span className="text-xs text-slate-600 leading-relaxed">
                      ในหน้า Apps Script ให้คลิกเครื่องหมายบวก <strong className="text-slate-800">+</strong> ข้างคำว่า Files (ไฟล์) &gt; เลือก <strong className="text-slate-800">HTML</strong> &gt; ตั้งชื่อว่า <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-xs">index</code> (พิมพ์ตัวเล็ก ไม่ต้องใส่นามสกุล .html) &gt; วางโค้ดจากแท็บ <strong className="text-red-700">2. index.html</strong> &gt; กดบันทึก
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-heading">เผยแพร่เป็นเว็บแอป (Deploy as Web App)</strong>
                    <span className="text-xs text-slate-600 leading-relaxed block mt-1">
                      คลิกปุ่มสีน้ำเงินมุมบนขวา <strong className="text-slate-800">การทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong className="text-slate-800">การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                    </span>
                    <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5 pl-2">
                      <li>เลือกประเภทการทำให้ใช้งานได้: <strong className="text-slate-800">เว็บแอป (Web app)</strong></li>
                      <li>การดำเนินการในชื่อ: <strong className="text-slate-800">ฉัน (Me)</strong></li>
                      <li>ผู้มีสิทธิ์เข้าถึง: <strong className="text-slate-800">ทุกคน (Anyone)</strong> (เพื่อให้บุคลากรในแผนกเปิดดูแดชบอร์ดได้)</li>
                    </ul>
                  </div>
                </li>

                <li className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </span>
                  <div>
                    <strong className="text-emerald-950 block font-heading">เสร็จสิ้น พร้อมใช้งาน!</strong>
                    <span className="text-xs text-emerald-800 leading-relaxed">
                      คัดลอก URL เว็บแอปที่ได้รับ ส่งให้ทีมงานห้องฉุกเฉิน หรือเปิดบนจอทีวีมอนิเตอร์ห้องเวรเพื่อดูแดชบอร์ดภาพรวมสรุปเวรรายวันแบบ Realtime ได้ทันที!
                    </span>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ระบบสรุปเวรงานอุบัติเหตุ-ฉุกเฉินและนิติเวช • Google Apps Script Template
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
