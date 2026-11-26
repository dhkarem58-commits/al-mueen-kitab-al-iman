import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { PDF_ASSET_URL } from '../data';

interface PdfReferenceModalProps {
  isOpen: boolean;
  initialPage: number;
  onClose: () => void;
}

export const PdfReferenceModal: React.FC<PdfReferenceModalProps> = ({
  isOpen,
  initialPage,
  onClose,
}) => {
  const [page, setPage] = useState<number>(initialPage);

  React.useEffect(() => {
    setPage(Math.min(309, Math.max(1, initialPage)));
  }, [initialPage, isOpen]);

  if (!isOpen) return null;

  const pdfPageUrl = `${PDF_ASSET_URL}#page=${page}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عارض صفحات الكتاب الأصلي"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-5xl h-[88vh] bg-[#fcf9f1] dark:bg-[#1a1612] border border-[#cfc2a9] dark:border-[#3b332a] rounded-xl flex flex-col overflow-hidden shadow-xl">
        <div className="px-4 py-3 border-b border-[#dfd5c0] dark:border-[#332c24] flex flex-wrap items-center justify-between gap-3 bg-[#f1ead9] dark:bg-[#171410] font-heading-tajawal">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-bold text-[#1f1a14] dark:text-[#eee7d7]">
              الكتاب الأصلي المصوّر (ص {page} من ٣٠٩)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="الصفحة السابقة"
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 inline" />
            </button>

            <label htmlFor="pdf-page-number" className="sr-only">
              رقم الصفحة
            </label>
            <input
              id="pdf-page-number"
              type="number"
              min={1}
              max={309}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val)) {
                  setPage(Math.min(309, Math.max(1, val)));
                }
              }}
              className="w-16 px-2 py-1 text-center text-xs sm:text-sm tabular-nums rounded-lg border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7]"
            />

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(309, p + 1))}
              disabled={page >= 309}
              aria-label="الصفحة التالية"
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 inline" />
            </button>

            <a
              href={pdfPageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1b4d3e] dark:text-[#7ec9ad] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] whitespace-nowrap"
            >
              <span>فتح الملف مباشرة</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق عارض الكتاب الأصلي"
              className="p-1.5 rounded-lg text-[#564b3e] dark:text-[#ccc0ac] hover:bg-[#e5dcc8] dark:hover:bg-[#2a231c] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#ede6d6] dark:bg-[#12100d] relative">
          <iframe
            key={pdfPageUrl}
            src={pdfPageUrl}
            title={`صفحة ${page} من كتاب الإيمان`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
