import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  GitBranch,
  HelpCircle,
} from 'lucide-react';
import {
  MANUSCRIPT_IMAGE_URL,
  SAHIH_MUSLIM_COVER_URL,
  SHEIKH_YASSER_STUDIO_PHOTO_URL,
} from '../data';
import {
  BookSection,
  PATTERN_META,
  PATTERN_ORDER,
  PatternType,
  QuestionItem,
} from '../data/types';
import { countSectionPatterns, formatArabicQuestionCount } from '../utils/readerLogic';

interface BookIndexViewProps {
  sections: BookSection[];
  questions: QuestionItem[];
  treesCount: number;
  completedSectionIds: string[];
  lastSectionId: string;
  onOpenBookReading: (sectionId: string) => void;
  onOpenSectionReader: (sectionId: string, patternFilter?: PatternType) => void;
  onOpenSectionQuestions: (sectionId: string) => void;
  onOpenTrees: () => void;
  onToggleSectionComplete: (sectionId: string) => void;
}

export const BookIndexView: React.FC<BookIndexViewProps> = ({
  sections,
  questions,
  treesCount,
  completedSectionIds,
  lastSectionId,
  onOpenBookReading,
  onOpenSectionReader,
  onOpenSectionQuestions,
  onOpenTrees,
  onToggleSectionComplete,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const completedSet = new Set(completedSectionIds);
  const lastSection = sections.find((s) => s.id === lastSectionId) ?? sections[0];
  const istidrakCount = questions.filter((q) => q.patternType === 'istidrak').length;

  const markImgError = (key: string) => {
    setImgErrors((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Stacked-Paper Manuscript Hero ("ورقة فوق ورقة") */}
      <section className="paper-stack rounded-2xl p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="font-heading-tajawal text-xs sm:text-sm font-bold text-[#1b4d3e] dark:text-[#7ec9ad]">
                صحيح مسلم بشرح الإمام النووي · حواشي واستدراكات فضيلة الشيخ ياسر برهامي
              </p>

              <h1 className="font-heading-tajawal text-2xl sm:text-4xl font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-snug text-balance">
                دراسة كتاب الإيمان — فصل كلام النووي عن الحاشية مع التلوين العلمي الكامل
              </h1>

              <p className="font-matn-majalla text-lg sm:text-[21px] text-[#4c4236] dark:text-[#ccc0ac] leading-[1.9] max-w-2xl">
                نسخة محققة على ورق المخطوط لعرض محتوى الكتاب كلمة بكلمة (ص ١–٣٠٩):
                كلام الإمام النووي في متن مستقل، وحواشي فضيلة الشيخ ياسر برهامي في
                حاشية منفصلة، وكلاهما ملوّن بدقة حسب المهمة العلمية مع التمييز بالخط
                العثماني للقرآن الكريم، والعناصر والتشجيرات وبنك الأسئلة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenBookReading(lastSection.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-heading-tajawal text-sm font-bold rounded-lg bg-[#8b2432] text-[#fcf9f1] hover:bg-[#701b27] dark:bg-[#a63443] dark:hover:bg-[#b83f4f] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>وضع القراءة (الكتاب والحاشية)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSectionReader(lastSection.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-heading-tajawal text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] transition-colors cursor-pointer"
              >
                <span>
                  {completedSectionIds.length > 0
                    ? `متابعة المذكرة: ${lastSection.orderLabel}`
                    : 'اقرأ المذكرة كلمة بكلمة'}
                </span>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenTrees}
                className="inline-flex items-center gap-2 px-4 py-2.5 font-heading-tajawal text-sm font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] bg-[#f1ead9] dark:bg-[#241f19] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#e7dec9] dark:hover:bg-[#2f2820] transition-colors cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-[#1b4d3e] dark:text-[#7ec9ad]" aria-hidden="true" />
                <span>تصفح التشجيرات العلمية</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <figure className="paper-hashiyah-sheet rounded-xl p-3 flex-1 flex flex-col justify-between gap-2.5">
              {!imgErrors.manuscript ? (
                <div className="rounded-lg overflow-hidden border border-[#d6cbb3] dark:border-[#3b332a] bg-[#e9dfc8] dark:bg-[#201b16] aspect-[4/3] lg:aspect-auto lg:h-full max-h-[300px]">
                  <img
                    src={MANUSCRIPT_IMAGE_URL}
                    alt="صفحة مخطوطة تاريخية نفيسة لكتاب صحيح الإمام الحافظ أبي الحسين مسلم بن الحجاج النيسابوري مع السماعات"
                    referrerPolicy="no-referrer"
                    onError={() => markImgError('manuscript')}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#ece3cf] dark:bg-[#211c16] h-56 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <BookOpen className="w-8 h-8 text-[#9a742b]" aria-hidden="true" />
                  <span className="font-heading-tajawal text-sm font-bold">
                    مخطوطة صحيح مسلم الأثرية
                  </span>
                </div>
              )}
              <figcaption className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491] text-center">
                نموذج مخطوطة تراثية لكتاب صحيح مسلم بالسماعات المتصلة — طبعة ورقية محققة
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Quantitative Strip */}
      <section aria-label="إحصاءات الكتاب العلمية" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="paper-sheet rounded-xl p-4 sm:p-5">
          <div className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491]">
            وحدات الكتاب الكامل
          </div>
          <div className="font-heading-tajawal text-xl sm:text-2xl font-bold tabular-nums text-[#1f1a14] dark:text-[#eee7d7] mt-1">
            {sections.length} وحدة (٣٠٩ ص)
          </div>
        </div>

        <div className="paper-sheet rounded-xl p-4 sm:p-5">
          <div className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491]">
            بنك الأسئلة الموثق
          </div>
          <div className="font-heading-tajawal text-xl sm:text-2xl font-bold tabular-nums text-[#1f1a14] dark:text-[#eee7d7] mt-1">
            {questions.length} سؤالاً
          </div>
        </div>

        <div className="paper-sheet rounded-xl p-4 sm:p-5">
          <div className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491]">
            استدراكات الشيخ ياسر
          </div>
          <div className="font-heading-tajawal text-xl sm:text-2xl font-bold tabular-nums text-[#8b2432] dark:text-[#ea929d] mt-1">
            {istidrakCount} مسألة محررة
          </div>
        </div>

        <div className="paper-sheet rounded-xl p-4 sm:p-5">
          <div className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491]">
            إنجاز المذاكرة والتشجيرات
          </div>
          <div className="font-heading-tajawal text-xl sm:text-2xl font-bold tabular-nums text-[#1b4d3e] dark:text-[#7ec9ad] mt-1">
            {completedSectionIds.length}/{sections.length} · {treesCount} تشجيرات
          </div>
        </div>
      </section>

      {/* Curated Scholarly Editions & Dual-Layer Architecture Showcase */}
      <section aria-label="منهج الفصل بين المتن والحاشية ومصادر التحقيق" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <article className="paper-sheet rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-stretch">
          <div className="sm:w-40 shrink-0">
            {!imgErrors.muslimCover ? (
              <div className="w-full h-52 sm:h-full rounded-lg overflow-hidden border border-[#d6cbb3] dark:border-[#3b332a] bg-[#201a14] p-1">
                <img
                  src={SAHIH_MUSLIM_COVER_URL}
                  alt="غلاف صحيح الإمام أبي الحسين مسلم بن الحجاج القشيري النيسابوري"
                  referrerPolicy="no-referrer"
                  onError={() => markImgError('muslimCover')}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-48 sm:h-full rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#2a231c] flex items-center justify-center text-[#e6d5a8] font-heading-tajawal text-xs font-bold p-3 text-center">
                صحيح مسلم
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="font-heading-tajawal text-xs font-bold text-[#9a742b] dark:text-[#dfba6b]">
                الطبقة الأولى · المتن الأعلى
              </div>
              <h2 className="font-heading-tajawal text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                كلام الإمام النووي والشرح الأصلي منفصلاً
              </h2>
              <p className="font-matn-majalla text-base sm:text-lg text-[#564b3e] dark:text-[#c7baa5] leading-relaxed">
                يُعرض متن صحيح مسلم وشرح الإمام النووي رحمه الله في ورقة مستقلة بخط
                SAKKAL MAJALLA، مع تلوين كل جملة بحسب وظيفتها: الآيات بالخط العثماني
                الحفصي، والأحاديث، وحكاية الخلاف، والترجيح، والإسناد واللغة.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onOpenSectionReader('bab-01')}
                className="font-heading-tajawal text-xs font-bold text-[#1b4d3e] dark:text-[#7ec9ad] hover:underline cursor-pointer"
              >
                معاينة متن النووي في الباب الأول ←
              </button>
            </div>
          </div>
        </article>

        <article className="paper-hashiyah-sheet rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-stretch">
          <div className="sm:w-40 shrink-0">
            {!imgErrors.sheikhYasser ? (
              <figure className="h-full flex flex-col gap-1.5">
                <div className="w-full h-52 sm:h-full rounded-lg overflow-hidden border border-[#d6cbb3] dark:border-[#3b332a] bg-[#1e1914]">
                  <img
                    src={SHEIKH_YASSER_STUDIO_PHOTO_URL}
                    alt="فضيلة الشيخ الدكتور ياسر برهامي صاحب الحاشية والاستدراكات على شرح النووي لصحيح مسلم"
                    referrerPolicy="no-referrer"
                    onError={() => markImgError('sheikhYasser')}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <figcaption className="font-heading-tajawal text-[11px] font-medium text-[#655b4e] dark:text-[#b0a491] text-center">
                  فضيلة الشيخ د. ياسر برهامي
                </figcaption>
              </figure>
            ) : (
              <div className="w-full h-48 sm:h-full rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#e5dcc9] flex items-center justify-center text-[#4a3e2e] font-heading-tajawal text-xs font-bold p-3 text-center">
                فضيلة الشيخ ياسر برهامي
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="font-heading-tajawal text-xs font-bold text-[#8b2432] dark:text-[#ea929d]">
                الطبقة الثانية · الحاشية المفصلة
              </div>
              <h2 className="font-heading-tajawal text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                حاشية واستدراكات فضيلة الشيخ ياسر برهامي
              </h2>
              <p className="font-matn-majalla text-base sm:text-lg text-[#564b3e] dark:text-[#c7baa5] leading-relaxed">
                تُفصل الحاشية أسفل المتن مربوطةً بأرقام الحواشي (١)، (٢)، مع تلوين
                نصوص الحاشية والمتن معاً؛ سواءً في وضع القراءة المتصل للكتاب بالحاشية
                أو في المذكرة التحليلية المقسّمة بالعناصر والتشجيرات.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenBookReading('intro-nawawi')}
                className="font-heading-tajawal text-xs font-bold text-[#8b2432] dark:text-[#ea929d] hover:underline cursor-pointer"
              >
                فتح وضع القراءة بالحاشية ←
              </button>
              <button
                type="button"
                onClick={() => onOpenSectionReader('intro-nawawi', 'istidrak')}
                className="font-heading-tajawal text-xs font-bold text-[#1b4d3e] dark:text-[#7ec9ad] hover:underline cursor-pointer"
              >
                استعراض الاستدراكات المصنفة ←
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* 8-Pattern Color Legend */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-heading-tajawal text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
              دليل الألوان العلمية في المتن والحاشية
            </h2>
            <p className="font-heading-tajawal text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491] mt-1">
              اضغط على أي لون لفتح مواضعه داخل المتن المنفصل والحاشية المنفصلة مباشرة:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PATTERN_ORDER.map((patternId) => {
            const meta = PATTERN_META[patternId];
            return (
              <button
                key={patternId}
                type="button"
                onClick={() => onOpenSectionReader(lastSection.id, patternId)}
                className={`text-right p-4 rounded-xl border transition-transform hover:-translate-y-0.5 cursor-pointer ${meta.chipClass}`}
              >
                <div className="flex items-center justify-between gap-2 font-heading-tajawal">
                  <span className="text-sm font-bold">{meta.label}</span>
                  <span className="text-xs font-medium opacity-80">[{meta.shortTag}]</span>
                </div>
                <p className="font-heading-tajawal text-xs mt-1.5 opacity-90 leading-relaxed">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Complete 24-Unit Index */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading-tajawal text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
            فهرس الكتاب الكامل (المقدمتان والأبواب ١–٢٢)
          </h2>
          <p className="font-heading-tajawal text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491] tabular-nums">
            إجمالي الوحدات: {sections.length} · من ص ٢ إلى ص ٣٠٩
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => {
            const isCompleted = completedSet.has(section.id);
            const sectionQuestionsCount = questions.filter(
              (q) => q.sectionId === section.id
            ).length;
            const patternCounts = countSectionPatterns(section);
            const activeTags = PATTERN_ORDER.filter((p) => patternCounts[p] > 0)
              .map((p) => PATTERN_META[p].shortTag)
              .join(' · ');

            return (
              <article
                key={section.id}
                className="paper-sheet rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 font-heading-tajawal">
                    <div className="flex items-center gap-2 text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                      <span className="font-bold text-[#1b4d3e] dark:text-[#7ec9ad]">
                        {section.orderLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        ص {section.pageStart}–{section.pageEnd}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatArabicQuestionCount(sectionQuestionsCount)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSectionComplete(section.id)}
                      aria-label={
                        isCompleted
                          ? `إلغاء علامة إتمام ${section.orderLabel}`
                          : `تحديد ${section.orderLabel} كمكتمل`
                      }
                      className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer whitespace-nowrap ${
                        isCompleted
                          ? 'text-[#1b4d3e] dark:text-[#7ec9ad]'
                          : 'text-[#867a68] dark:text-[#8c7f6c] hover:text-[#1f1a14] dark:hover:text-[#eee7d7]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>{isCompleted ? 'مُنجز' : 'تعليم كمُنجز'}</span>
                    </button>
                  </div>

                  <h3 className="font-heading-tajawal text-base sm:text-lg font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-snug">
                    {section.title}
                  </h3>

                  <p className="font-matn-majalla text-base text-[#564b3e] dark:text-[#c7baa5] leading-relaxed">
                    {section.overview}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e5dcc8] dark:border-[#332c24] flex flex-wrap items-center justify-between gap-3">
                  <span className="font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491] truncate max-w-[260px]">
                    {activeTags}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 font-heading-tajawal">
                    <button
                      type="button"
                      onClick={() => onOpenSectionQuestions(section.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>الأسئلة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBookReading(section.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#8b2432]/40 bg-[#fbeff0] dark:bg-[#2d171b] text-[#8b2432] dark:text-[#f5acb4] hover:bg-[#f6dfe2] dark:hover:bg-[#3a1d22] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>وضع القراءة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSectionReader(section.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>المذكرة</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
