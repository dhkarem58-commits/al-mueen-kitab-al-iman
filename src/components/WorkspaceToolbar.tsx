import React from 'react';
import { BookOpen, Moon, Search, Sun, X } from 'lucide-react';
import { BookSection } from '../data/types';

interface WorkspaceToolbarProps {
  sections: BookSection[];
  selectedSectionId: string;
  onSelectSection: (sectionId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenPdfAtCurrentSection: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  sections,
  selectedSectionId,
  onSelectSection,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  onOpenPdfAtCurrentSection,
}) => {
  return (
    <div className="border-b border-[#dfd5c0] dark:border-[#332c24] bg-[#f1ead9]/85 dark:bg-[#171410]/90">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 basis-full sm:basis-auto min-w-0 sm:min-w-[260px]">
          <div className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto sm:min-w-[210px] sm:max-w-xs sm:flex-initial">
            <label htmlFor="quick-section-select" className="sr-only">
              الانتقال إلى باب
            </label>
            <select
              id="quick-section-select"
              value={selectedSectionId}
              onChange={(e) => onSelectSection(e.target.value)}
              className="w-full px-3 py-1.5 font-heading-tajawal text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.orderLabel}: {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px] sm:max-w-md">
            <Search
              className="w-4 h-4 text-[#7c705f] dark:text-[#9c8f7c] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="global-search-input" className="sr-only">
              البحث في نصوص الكتاب والشرح والأسئلة
            </label>
            <input
              id="global-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في كلام النووي أو حاشية الشيخ ياسر أو الأسئلة..."
              className="w-full pr-9 pl-8 py-1.5 font-heading-tajawal text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] placeholder:text-[#867a68] dark:placeholder:text-[#8c7f6c] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="مسح نص البحث"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c705f] hover:text-[#1f1a14] dark:hover:text-[#eee7d7] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 max-w-full">
          <button
            type="button"
            onClick={onOpenPdfAtCurrentSection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-heading-tajawal text-xs sm:text-sm font-medium rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
            <span>الكتاب الأصلي PDF</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'التبديل إلى وضع الورق الفاتح' : 'التبديل إلى الوضع الليلي'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-heading-tajawal text-xs sm:text-sm font-medium rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#e0b861]" aria-hidden="true" />
                <span>ورق فاتح</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#5c5042]" aria-hidden="true" />
                <span>داكن</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
