import React from 'react';
import { AppView } from '../data/types';

interface HeaderBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onStartComprehensiveExam: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'index', label: 'فهرس الكتاب' },
  { id: 'reading', label: 'وضع القراءة' },
  { id: 'reader', label: 'المذكرة المحققة' },
  { id: 'trees', label: 'التشجيرات العلمية' },
  { id: 'bank', label: 'بنك الأسئلة' },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeView,
  onNavigate,
  onStartComprehensiveExam,
}) => {
  return (
    <header className="border-b border-[#dfd5c0] dark:border-[#332c24] bg-[#fcf9f1]/95 dark:bg-[#1a1612]/95">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 md:gap-8">
        <button
          type="button"
          onClick={() => onNavigate('index')}
          className="text-lg sm:text-2xl font-heading-tajawal font-bold text-[#1f1a14] dark:text-[#eee7d7] hover:text-[#1b4d3e] dark:hover:text-[#7ec9ad] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1b4d3e] rounded"
        >
          المُعين في كتاب الإيمان
        </button>

        <nav
          aria-label="التنقل الرئيسي"
          className="order-3 md:order-2 w-full md:w-auto flex items-center justify-between sm:justify-start gap-3 sm:gap-7 overflow-x-auto pb-0.5 md:pb-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1.5 font-heading-tajawal text-xs sm:text-[15px] whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1b4d3e] ${
                  isActive
                    ? 'border-[#1b4d3e] text-[#1b4d3e] dark:border-[#7ec9ad] dark:text-[#7ec9ad] font-bold'
                    : 'border-transparent text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14] dark:hover:text-[#eee7d7] hover:border-[#cfc2a9] dark:hover:border-[#4b4135] font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="order-2 md:order-3 shrink-0">
          <button
            type="button"
            onClick={onStartComprehensiveExam}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 font-heading-tajawal text-xs sm:text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b4d3e]"
          >
            اختبار شامل
          </button>
        </div>
      </div>
    </header>
  );
};
