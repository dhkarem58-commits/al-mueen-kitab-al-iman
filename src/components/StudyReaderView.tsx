import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns2,
  GitBranch,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { PDF_ASSET_URL } from '../data';
import {
  BookSection,
  PATTERN_META,
  PATTERN_ORDER,
  PatternType,
  QuestionItem,
} from '../data/types';
import {
  calculateBookProgress,
  formatArabicQuestionCount,
  searchBookSections,
  splitParagraphLayers,
} from '../utils/readerLogic';
import { ColoredTextRenderer } from './ColoredTextRenderer';

type ReaderDisplayMode =
  | 'full_study'
  | 'word_pdf_split'
  | 'text_only'
  | 'summary_elements';

type SegmentStyle = 'continuous' | 'blocks';

interface StudyReaderViewProps {
  sections: BookSection[];
  questions: QuestionItem[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  activePatterns: PatternType[];
  onTogglePattern: (pattern: PatternType) => void;
  onResetPatterns: () => void;
  searchQuery: string;
  completedSectionIds: string[];
  onToggleSectionComplete: (sectionId: string) => void;
  onOpenPdfAtPage: (page: number) => void;
  onOpenSectionQuestions: (sectionId: string) => void;
  onOpenTreesForSection: (sectionId: string) => void;
  onOpenBookReading?: (sectionId: string) => void;
}

export const StudyReaderView: React.FC<StudyReaderViewProps> = ({
  sections,
  questions,
  activeSectionId,
  onSelectSection,
  activePatterns,
  onTogglePattern,
  onResetPatterns,
  searchQuery,
  completedSectionIds,
  onToggleSectionComplete,
  onOpenPdfAtPage,
  onOpenSectionQuestions,
  onOpenTreesForSection,
  onOpenBookReading,
}) => {
  const [displayMode, setDisplayMode] = useState<ReaderDisplayMode>('full_study');
  const [segmentStyle, setSegmentStyle] = useState<SegmentStyle>('continuous');
  const [splitPdfPage, setSplitPdfPage] = useState<number | null>(null);

  const currentIdx = Math.max(
    0,
    sections.findIndex((s) => s.id === activeSectionId)
  );
  const currentSection = sections[currentIdx] ?? sections[0];
  const prevSection = currentIdx > 0 ? sections[currentIdx - 1] : null;
  const nextSection = currentIdx < sections.length - 1 ? sections[currentIdx + 1] : null;
  const isCompleted = completedSectionIds.includes(currentSection.id);

  React.useEffect(() => {
    setSplitPdfPage(currentSection.pageStart);
  }, [currentSection.id, currentSection.pageStart]);

  const isPatternFiltering = activePatterns.length > 0;
  const activePatternSet = new Set(activePatterns);

  const searchHits = searchQuery.trim()
    ? searchBookSections(sections, searchQuery, isPatternFiltering ? activePatterns : undefined)
    : [];

  const sectionQuestionsCount = questions.filter(
    (q) => q.sectionId === currentSection.id
  ).length;

  const progressStats = calculateBookProgress(sections, currentSection.id);
  const effectivePdfPage = splitPdfPage ?? currentSection.pageStart;
  const isPdfSplit = displayMode === 'word_pdf_split';

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 pb-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {!isPdfSplit && (
          <aside
            aria-label="فهرس أبواب المذكرة"
            className="hidden lg:block lg:col-span-3 paper-sheet rounded-xl p-4 max-h-[82vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e5dcc8] dark:border-[#332c24] font-heading-tajawal">
              <h2 className="text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                أقسام الكتاب ({sections.length})
              </h2>
              <span className="text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                {completedSectionIds.length}/{sections.length}
              </span>
            </div>

            <ul className="space-y-1 font-heading-tajawal">
              {sections.map((sec) => {
                const active = sec.id === currentSection.id;
                const done = completedSectionIds.includes(sec.id);
                return (
                  <li key={sec.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSection(sec.id)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        active
                          ? 'bg-[#e7f0ea] dark:bg-[#193026] text-[#14472d] dark:text-[#98dbc0] font-bold border border-[#b9d3c2] dark:border-[#2a5943]'
                          : 'text-[#3d342a] dark:text-[#ccc0ac] hover:bg-[#f1ead9] dark:hover:bg-[#26201a] border border-transparent'
                      }`}
                    >
                      <span className="leading-snug">
                        <span className="block font-bold">{sec.orderLabel}</span>
                        <span className="block text-[11px] opacity-80 line-clamp-1">
                          {sec.title}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums opacity-75">
                        {done ? '✓' : `ص${sec.pageStart}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}

        <div className={isPdfSplit ? 'lg:col-span-12 space-y-6' : 'lg:col-span-9 space-y-6'}>
          {/* Filter & Display Mode Controls */}
          <div className="paper-sheet rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 font-heading-tajawal">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                <Layers className="w-4 h-4 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
                <span>تلوين المتن والحاشية وتصفية الأنماط:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {displayMode !== 'summary_elements' && (
                  <div
                    role="group"
                    aria-label="نمط عرض التلوين"
                    className="flex items-center gap-1 p-1 bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24] rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={() => setSegmentStyle('continuous')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                        segmentStyle === 'continuous'
                          ? 'bg-[#fcf9f1] dark:bg-[#2a231c] text-[#1f1a14] dark:text-[#eee7d7] font-bold shadow-xs'
                          : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14]'
                      }`}
                    >
                      كلمة بكلمة متصل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSegmentStyle('blocks')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                        segmentStyle === 'blocks'
                          ? 'bg-[#fcf9f1] dark:bg-[#2a231c] text-[#1f1a14] dark:text-[#eee7d7] font-bold shadow-xs'
                          : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14]'
                      }`}
                    >
                      بطاقات موثقة
                    </button>
                  </div>
                )}

                <div
                  role="group"
                  aria-label="طريقة عرض المذكرة"
                  className="flex flex-wrap items-center gap-1 p-1 bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24] rounded-lg"
                >
                  {(
                    [
                      { id: 'full_study', label: 'المتن + الحاشية + الملخص' },
                      { id: 'word_pdf_split', label: 'مقارنة كلمة بكلمة مع PDF' },
                      { id: 'text_only', label: 'المتن والحاشية فقط' },
                      { id: 'summary_elements', label: 'العناصر والملخصات' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setDisplayMode(mode.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                        displayMode === mode.id
                          ? 'bg-[#1b4d3e] text-[#fcf9f1] dark:bg-[#2a6e59] font-bold shadow-xs'
                          : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14] dark:hover:text-[#eee7d7]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-heading-tajawal">
              <button
                type="button"
                onClick={onResetPatterns}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                  !isPatternFiltering
                    ? 'bg-[#1f1a14] text-[#fcf9f1] border-[#1f1a14] dark:bg-[#eee7d7] dark:text-[#1f1a14] dark:border-[#eee7d7] font-bold'
                    : 'bg-[#fcf9f1] dark:bg-[#1d1915] text-[#4c4236] dark:text-[#ccc0ac] border-[#d6cbb3] dark:border-[#3b332a] hover:bg-[#f1ead9]'
                }`}
              >
                عرض جميع الأنماط
              </button>

              {PATTERN_ORDER.map((patternId) => {
                const meta = PATTERN_META[patternId];
                const selected = activePatternSet.has(patternId);
                return (
                  <button
                    key={patternId}
                    type="button"
                    onClick={() => onTogglePattern(patternId)}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                      selected
                        ? `${meta.chipClass} ring-2 ring-offset-1 ring-[#1b4d3e]/70 dark:ring-[#7ec9ad]/70 font-bold`
                        : `${meta.chipClass} opacity-90 hover:opacity-100`
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {searchQuery.trim() && (
            <section
              aria-label="نتائج البحث في الكتاب"
              className="paper-hashiyah-sheet rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 font-heading-tajawal">
                <h2 className="text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                  نتائج البحث عن «{searchQuery}» ({searchHits.length} فقرة)
                </h2>
              </div>
              {searchHits.length === 0 ? (
                <p className="font-heading-tajawal text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491]">
                  لم يتم العثور على فقرات مطابقة لهذا البحث مع التصفية اللونية الحالية.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                  {searchHits.map((hit) => (
                    <button
                      key={hit.paragraph.id}
                      type="button"
                      onClick={() => onSelectSection(hit.sectionId)}
                      className="text-right p-3 rounded-lg bg-[#fcf9f1] dark:bg-[#1d1915] border border-[#d6cbb3] dark:border-[#3b332a] hover:border-[#1b4d3e] transition-colors cursor-pointer"
                    >
                      <div className="font-heading-tajawal text-xs text-[#1b4d3e] dark:text-[#7ec9ad] font-bold">
                        {hit.sectionTitle} · ص {hit.paragraph.pageStart}
                      </div>
                      <div className="font-heading-tajawal text-xs font-bold text-[#1f1a14] dark:text-[#eee7d7] mt-0.5">
                        {hit.paragraph.title}
                      </div>
                      <p className="font-matn-majalla text-sm text-[#655b4e] dark:text-[#b0a491] mt-1 line-clamp-2">
                        {hit.paragraph.summary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Main Reader Workspace (Split PDF Comparison vs Stacked Manuscript) */}
          <div className={isPdfSplit ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start' : ''}>
            <article
              className={`${
                isPdfSplit ? 'xl:col-span-7' : ''
              } paper-stack rounded-2xl p-5 sm:p-8 space-y-8`}
            >
              <header className="border-b border-[#e5dcc8] dark:border-[#332c24] pb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 font-heading-tajawal">
                  <div className="text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                    <span className="font-bold text-[#1b4d3e] dark:text-[#7ec9ad]">
                      {currentSection.orderLabel}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      الصفحات {currentSection.pageStart}–{currentSection.pageEnd}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{formatArabicQuestionCount(sectionQuestionsCount)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenBookReading && (
                      <button
                        type="button"
                        onClick={() => onOpenBookReading(currentSection.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[#8b2432]/40 bg-[#fbeff0] dark:bg-[#2d171b] text-[#8b2432] dark:text-[#f5acb4] hover:bg-[#f6dfe2] dark:hover:bg-[#3a1d22] cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>وضع القراءة بالحاشية</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenPdfAtPage(currentSection.pageStart)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
                      <span>صفحة {currentSection.pageStart} PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenTreesForSection(currentSection.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
                      <span>التشجير العلمي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSectionQuestions(currentSection.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] cursor-pointer whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>أسئلة الباب</span>
                    </button>
                  </div>
                </div>

                <h1 className="font-heading-tajawal text-2xl sm:text-3xl font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-snug text-balance">
                  {currentSection.title}
                </h1>

                <p className="font-matn-majalla text-lg sm:text-[19px] text-[#564b3e] dark:text-[#c7baa5] leading-relaxed">
                  {currentSection.overview}
                </p>
              </header>

              <div className="space-y-10">
                {(() => {
                  const matchingParagraphs = currentSection.paragraphs.filter((para) =>
                    !isPatternFiltering
                      ? true
                      : para.segments.some((seg) => activePatternSet.has(seg.type))
                  );

                  if (matchingParagraphs.length === 0) {
                    return (
                      <div className="paper-hashiyah-sheet rounded-xl p-6 text-center space-y-3 font-heading-tajawal">
                        <p className="text-sm font-medium text-[#4c4236] dark:text-[#ccc0ac]">
                          لا يحتوي هذا الباب على مقاطع مستقلة من النمط اللوني المحدد حالياً.
                        </p>
                        <button
                          type="button"
                          onClick={onResetPatterns}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] cursor-pointer"
                        >
                          عرض جميع الأنماط في هذا الباب
                        </button>
                      </div>
                    );
                  }

                  return matchingParagraphs.map((para) => {
                    const idx = currentSection.paragraphs.indexOf(para);
                    const { matnSegments, hashiyahSegments } = splitParagraphLayers(
                      para,
                      isPatternFiltering ? activePatternSet : undefined
                    );

                    return (
                      <section
                        key={para.id}
                        className="space-y-5 pb-9 border-b border-[#dfd5c0] dark:border-[#332c24] last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 font-heading-tajawal">
                          <h2 className="text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                            {String(idx + 1).padStart(2, '0')}. {para.title}
                          </h2>
                          <div className="flex items-center gap-3">
                            {isPdfSplit && (
                              <button
                                type="button"
                                onClick={() => setSplitPdfPage(para.pageStart)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#9a742b] dark:text-[#dfba6b] hover:underline tabular-nums cursor-pointer"
                              >
                                <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>تزامن PDF ص {para.pageStart}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenPdfAtPage(para.pageStart)}
                              className="text-xs font-bold text-[#1b4d3e] dark:text-[#7ec9ad] hover:underline tabular-nums cursor-pointer"
                            >
                              عرض الأصل ص {para.pageStart}–{para.pageEnd}
                            </button>
                          </div>
                        </div>

                        {displayMode !== 'summary_elements' && (
                          <div className="space-y-4">
                            {/* Upper Layer: Separated Matn (كلام الإمام النووي والحديث والآيات) */}
                            {matnSegments.length > 0 && (
                              <div
                                aria-label="متن كلام الإمام النووي والشرح الأصلي"
                                className="rounded-xl border border-[#dfd5c0] dark:border-[#3b332a] bg-[#fffdf7] dark:bg-[#221d18] p-4 sm:p-6 space-y-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#ebe2cf] dark:border-[#332c24] font-heading-tajawal">
                                  <span className="text-xs font-bold text-[#1b4d3e] dark:text-[#7ec9ad]">
                                    متن كلام الإمام النووي والشرح الأصلي (منفصل)
                                  </span>
                                  <span className="text-[11px] text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                                    ص {para.pageStart}–{para.pageEnd}
                                  </span>
                                </div>

                                <ColoredTextRenderer
                                  segments={matnSegments}
                                  layout={segmentStyle}
                                  paragraphId={`${para.id}-matn`}
                                />
                              </div>
                            )}

                            {/* Archival Manuscript Rule separating Matn from Hashiyah */}
                            {matnSegments.length > 0 && hashiyahSegments.length > 0 && (
                              <div className="flex items-center gap-3 px-2" aria-hidden="true">
                                <span className="h-px flex-1 bg-[#d6cbb3] dark:bg-[#3b332a]" />
                                <span className="font-heading-tajawal text-[11px] font-bold text-[#867a68] dark:text-[#9c8f7c]">
                                  الحاشية والتعليقات
                                </span>
                                <span className="h-px flex-1 bg-[#d6cbb3] dark:bg-[#3b332a]" />
                              </div>
                            )}

                            {/* Lower Layer: Separated Hashiyah (حاشية فضيلة الشيخ ياسر برهامي ملونة حسب المهمة) */}
                            {hashiyahSegments.length > 0 && (
                              <div
                                aria-label="الحاشية المنفصلة — تعليقات واستدراكات فضيلة الشيخ ياسر برهامي"
                                className="paper-hashiyah-sheet rounded-xl p-4 sm:p-6 space-y-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#dfd5c0] dark:border-[#332c24] font-heading-tajawal">
                                  <span className="text-xs font-bold text-[#8b2432] dark:text-[#ea929d]">
                                    الحاشية المنفصلة — تعليقات واستدراكات فضيلة الشيخ ياسر برهامي
                                  </span>
                                  <span className="text-[11px] text-[#655b4e] dark:text-[#b0a491]">
                                    ملونة حسب المهمة العلمية
                                  </span>
                                </div>

                                <ColoredTextRenderer
                                  segments={hashiyahSegments}
                                  layout={segmentStyle}
                                  paragraphId={`${para.id}-hashiyah`}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {displayMode !== 'text_only' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                            <div className="md:col-span-7 rounded-xl border border-[#dfd5c0] dark:border-[#332c24] bg-[#f8f3e7] dark:bg-[#191612] p-4 space-y-2.5">
                              <h3 className="font-heading-tajawal text-xs sm:text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                                العناصر العلمية للفقرة
                              </h3>
                              <ol className="space-y-2 font-matn-majalla text-base sm:text-[17px] text-[#3d342a] dark:text-[#ccc0ac] leading-relaxed">
                                {para.elements.map((el, eIdx) => (
                                  <li key={`${para.id}-el-${eIdx}`} className="flex gap-2">
                                    <span className="font-heading-tajawal text-xs font-bold text-[#1b4d3e] dark:text-[#7ec9ad] tabular-nums shrink-0 mt-1">
                                      {eIdx + 1}.
                                    </span>
                                    <span>{el}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div className="md:col-span-5 rounded-xl border border-[#c5DEC9] dark:border-[#254B35] bg-[#eef5ef]/75 dark:bg-[#122219]/75 p-4 space-y-2">
                              <h3 className="font-heading-tajawal text-xs sm:text-sm font-bold text-[#14472D] dark:text-[#a9dec0]">
                                ملخص الفقرة لتقريب المعنى
                              </h3>
                              <p className="font-matn-majalla text-base sm:text-[17px] text-[#1f3b2b] dark:text-[#cbead7] leading-relaxed">
                                {para.summary}
                              </p>
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  });
                })()}
              </div>

              <footer className="pt-6 border-t border-[#dfd5c0] dark:border-[#332c24] flex flex-wrap items-center justify-between gap-4 font-heading-tajawal">
                <button
                  type="button"
                  onClick={() => onToggleSectionComplete(currentSection.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg border transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-[#1b4d3e] text-[#fcf9f1] border-[#1b4d3e] dark:bg-[#2a6e59] dark:border-[#2a6e59]'
                      : 'bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7] border-[#cfc2a9] dark:border-[#43392e] hover:bg-[#efe6d3]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{isCompleted ? 'تم إتمام مذاكرة هذا الباب' : 'تحديد الباب كمُنجز'}</span>
                </button>

                <div className="flex items-center gap-2.5">
                  {prevSection && (
                    <button
                      type="button"
                      onClick={() => onSelectSection(prevSection.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      <span>{prevSection.orderLabel}</span>
                    </button>
                  )}

                  {nextSection && (
                    <button
                      type="button"
                      onClick={() => onSelectSection(nextSection.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#1f1a14] dark:bg-[#eee7d7] text-[#fcf9f1] dark:text-[#1f1a14] hover:opacity-90 cursor-pointer whitespace-nowrap"
                    >
                      <span>{nextSection.orderLabel}</span>
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </footer>
            </article>

            {isPdfSplit && (
              <aside
                aria-label="مقارنة كلمة بكلمة مع الأصل المصور PDF"
                className="xl:col-span-5 xl:sticky xl:top-4 paper-sheet rounded-2xl overflow-hidden flex flex-col h-[76vh]"
              >
                <div className="px-4 py-3 border-b border-[#dfd5c0] dark:border-[#332c24] bg-[#f1ead9] dark:bg-[#171410] flex flex-wrap items-center justify-between gap-2 font-heading-tajawal">
                  <span className="text-xs font-bold text-[#1f1a14] dark:text-[#eee7d7] tabular-nums">
                    صفحة الكتاب الأصلية PDF (ص {effectivePdfPage})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSplitPdfPage(Math.max(1, effectivePdfPage - 1))}
                      disabled={effectivePdfPage <= 1}
                      aria-label="الصفحة السابقة في PDF"
                      className="px-2 py-1 text-xs rounded border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitPdfPage(Math.min(309, effectivePdfPage + 1))}
                      disabled={effectivePdfPage >= 309}
                      aria-label="الصفحة التالية في PDF"
                      className="px-2 py-1 text-xs rounded border border-[#cfc2a9] dark:border-[#43392e] bg-[#fcf9f1] dark:bg-[#1d1915] disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-[#ede6d6] dark:bg-[#12100d]">
                  <iframe
                    key={`${PDF_ASSET_URL}#page=${effectivePdfPage}`}
                    src={`${PDF_ASSET_URL}#page=${effectivePdfPage}`}
                    title={`صفحة ${effectivePdfPage} من كتاب الإيمان المصور`}
                    className="w-full h-full border-0"
                  />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Compact Bottom Reading Progress Track ("البار اللي بيتقدم تحت") — ~28px tall */}
      <div
        aria-label="مؤشر التقدم في قراءة الكتاب"
        className="fixed bottom-0 inset-x-0 z-30 h-7 bg-[#fcf9f1]/95 dark:bg-[#1a1612]/95 border-t border-[#dfd5c0] dark:border-[#332c24] px-4 sm:px-6 flex items-center justify-between gap-4 font-heading-tajawal text-[11px]"
      >
        <div className="flex items-center gap-2 truncate text-[#4c4236] dark:text-[#ccc0ac]">
          <span className="font-bold text-[#1b4d3e] dark:text-[#7ec9ad] shrink-0">
            {currentSection.orderLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{currentSection.title}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          <div
            role="progressbar"
            aria-valuenow={progressStats.pagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="نسبة التقدم في الكتاب"
            className="w-24 sm:w-40 h-1.5 rounded-full bg-[#e3d9c3] dark:bg-[#332c24] overflow-hidden"
          >
            <div
              className="h-full bg-[#1b4d3e] dark:bg-[#7ec9ad] transition-[width] duration-200"
              style={{ width: `${progressStats.pagePercent}%` }}
            />
          </div>
          <span className="font-bold text-[#1f1a14] dark:text-[#eee7d7]">
            ص {progressStats.currentPageEnd} / ٣٠٩ ({progressStats.pagePercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};
