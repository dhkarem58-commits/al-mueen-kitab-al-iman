import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  BookText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Palette,
  Type,
} from 'lucide-react';
import { SHEIKH_YASSER_SEATED_PHOTO_URL } from '../data';
import { BookSection } from '../data/types';
import {
  clampPageNumber,
  findSectionForPage,
  fromArabicIndicNumber,
  getReadingTextSizeClass,
  getVerbatimAnchorDomId,
  getVerbatimFootnoteDomId,
  getVerbatimTokenClass,
  isIstidrakFootnote,
  ReadingColorScheme,
  ReadingFontScale,
  searchVerbatimPages,
  toArabicIndicNumber,
  tokenizeVerbatimText,
  VerbatimBookPage,
} from '../utils/bookReadingLogic';

interface BookReadingViewProps {
  sections: BookSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  searchQuery: string;
  completedSectionIds: string[];
  onToggleSectionComplete: (sectionId: string) => void;
  onOpenPdfAtPage: (page: number) => void;
  onSwitchToStudyMode: (sectionId: string) => void;
}

const COLOR_SCHEME_OPTIONS: Array<{ id: ReadingColorScheme; label: string }> = [
  { id: 'semantic', label: 'تلوين دلالي للنصين' },
  { id: 'bicolor', label: 'لون للمتن ولون للحاشية' },
  { id: 'print', label: 'ألوان الطباعة (أحمر وأسود)' },
];

const TOTAL_PDF_PAGES = 309;
let cachedVerbatimPages: VerbatimBookPage[] | null = null;

export const BookReadingView: React.FC<BookReadingViewProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  searchQuery,
  completedSectionIds,
  onToggleSectionComplete,
  onOpenPdfAtPage,
  onSwitchToStudyMode,
}) => {
  const [pages, setPages] = useState<VerbatimBookPage[] | null>(cachedVerbatimPages);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<ReadingColorScheme>('semantic');
  const [fontScale, setFontScale] = useState<ReadingFontScale>('normal');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [portraitError, setPortraitError] = useState<boolean>(false);

  const initialSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? sections[0],
    [sections, activeSectionId]
  );

  const [currentPageNum, setCurrentPageNum] = useState<number>(() =>
    clampPageNumber(initialSection.pageStart, TOTAL_PDF_PAGES)
  );
  const [pageInput, setPageInput] = useState<string>(() =>
    String(clampPageNumber(initialSection.pageStart, TOTAL_PDF_PAGES))
  );

  // Track external section selection changes (e.g. clicking a section in toolbar or TOC)
  const lastSyncedSectionIdRef = useRef<string>(activeSectionId);
  useEffect(() => {
    if (activeSectionId !== lastSyncedSectionIdRef.current) {
      lastSyncedSectionIdRef.current = activeSectionId;
      const targetSec = sections.find((s) => s.id === activeSectionId);
      if (targetSec) {
        const nextPage = clampPageNumber(targetSec.pageStart, TOTAL_PDF_PAGES);
        setCurrentPageNum(nextPage);
        setPageInput(String(nextPage));
      }
    }
  }, [activeSectionId, sections]);

  // Fetch verbatim PDF pages once and cache in memory
  useEffect(() => {
    if (cachedVerbatimPages) {
      setPages(cachedVerbatimPages);
      return;
    }
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/pdf_book_pages.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<VerbatimBookPage[]>;
      })
      .then((data) => {
        cachedVerbatimPages = data;
        if (!cancelled) {
          setPages(data);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('تعذّر تحميل نص صفحات الكتاب. يرجى إعادة المحاولة.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSection = useMemo(
    () => findSectionForPage(sections, currentPageNum),
    [sections, currentPageNum]
  );

  const navigateToPage = (targetPage: number, shouldScrollTop = true) => {
    const safePage = clampPageNumber(targetPage, TOTAL_PDF_PAGES);
    setCurrentPageNum(safePage);
    setPageInput(String(safePage));
    const matchedSec = findSectionForPage(sections, safePage);
    if (matchedSec.id !== lastSyncedSectionIdRef.current) {
      lastSyncedSectionIdRef.current = matchedSec.id;
      onSelectSection(matchedSec.id);
    }
    if (shouldScrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTocSection = (sec: BookSection) => {
    lastSyncedSectionIdRef.current = sec.id;
    onSelectSection(sec.id);
    const safePage = clampPageNumber(sec.pageStart, TOTAL_PDF_PAGES);
    setCurrentPageNum(safePage);
    setPageInput(String(safePage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = fromArabicIndicNumber(pageInput);
    if (parsed !== null) {
      navigateToPage(parsed);
    } else {
      setPageInput(String(currentPageNum));
    }
  };

  // Keyboard page flipping in RTL (ArrowLeft = next page, ArrowRight = previous page)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && currentPageNum < TOTAL_PDF_PAGES) {
        navigateToPage(currentPageNum + 1, false);
      } else if (e.key === 'ArrowRight' && currentPageNum > 1) {
        navigateToPage(currentPageNum - 1, false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPageNum, sections]);

  const currentPageData = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return pages[currentPageNum - 1] ?? pages[1] ?? pages[0];
  }, [pages, currentPageNum]);

  const availableMarkers = useMemo(() => {
    const set = new Set<string>();
    if (!currentPageData) return set;
    for (const fn of currentPageData.footnotes) {
      if (fn.marker) set.add(fn.marker);
    }
    return set;
  }, [currentPageData]);

  const searchHits = useMemo(() => {
    if (!pages || !searchQuery.trim()) return [];
    return searchVerbatimPages(pages, sections, searchQuery, 40);
  }, [pages, sections, searchQuery]);

  const isCompleted = completedSectionIds.includes(currentSection.id);
  const sizeClasses = getReadingTextSizeClass(fontScale);
  const pagePercent = Math.round((currentPageNum / TOTAL_PDF_PAGES) * 100);

  const jumpToElement = (elementId: string) => {
    setHighlightedId(elementId);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.setTimeout(() => {
      setHighlightedId((curr) => (curr === elementId ? null : curr));
    }, 1800);
  };

  const renderVerbatimTokens = (
    text: string,
    layer: 'matn' | 'hashiyah',
    keyPrefix: string,
    isIstidrakCtx = false
  ) => {
    const tokens = tokenizeVerbatimText(
      text,
      layer,
      layer === 'matn' ? availableMarkers : undefined
    );

    return tokens.map((tok, idx) => {
      const key = `${keyPrefix}-t-${idx}`;
      if (tok.kind === 'footnoteRef' && tok.footnoteMarker && currentPageData) {
        const fnIdx = currentPageData.footnotes.findIndex(
          (f) => f.marker === tok.footnoteMarker
        );
        const fnDomId = getVerbatimFootnoteDomId(
          currentPageData.page,
          tok.footnoteMarker,
          Math.max(0, fnIdx)
        );
        const anchorDomId = getVerbatimAnchorDomId(currentPageData.page, tok.footnoteMarker);
        const isAnchorHighlighted = highlightedId === anchorDomId;

        return (
          <sup
            key={key}
            id={anchorDomId}
            className="inline-block align-super mx-0.5 select-none"
          >
            <button
              type="button"
              onClick={() => jumpToElement(fnDomId)}
              aria-label={`الانتقال إلى الحاشية ${tok.footnoteMarker}`}
              className={`inline-flex items-center justify-center font-heading-tajawal text-[12px] sm:text-[13px] leading-none font-bold text-[#9b1c2c] dark:text-[#f87171] hover:bg-[#8b2432]/10 dark:hover:bg-[#ea929d]/15 hover:underline rounded px-1 py-0.5 cursor-pointer ${
                isAnchorHighlighted
                  ? 'ring-2 ring-[#8b2432] dark:ring-[#ea929d] bg-[#f8eaec] dark:bg-[#2d171b]'
                  : ''
              }`}
            >
              {tok.text}
            </button>
          </sup>
        );
      }

      const cls = getVerbatimTokenClass(layer, tok.kind, colorScheme, isIstidrakCtx);
      if (tok.kind === 'quran') {
        return (
          <span key={key} className={`font-quran-hafs text-[1.06em] mx-0.5 ${cls}`}>
            {tok.text}
          </span>
        );
      }

      return (
        <span key={key} className={cls}>
          {tok.text}
        </span>
      );
    });
  };

  const scholarAttributionCard = (
    <section
      aria-label="التعريف بمُحشّي الكتاب"
      className="paper-hashiyah-sheet rounded-xl p-4 space-y-3"
    >
      <figure className="space-y-2.5">
        {!portraitError ? (
          <div className="rounded-lg overflow-hidden border border-[#d6cbb3] dark:border-[#3b332a] bg-[#e5dcc9] dark:bg-[#241f19] aspect-[4/3]">
            <img
              src={SHEIKH_YASSER_SEATED_PHOTO_URL}
              alt="فضيلة الشيخ الدكتور ياسر برهامي مُحرّر الحاشية والاستدراكات على شرح النووي لصحيح مسلم"
              referrerPolicy="no-referrer"
              onError={() => setPortraitError(true)}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#e5dcc9] dark:bg-[#241f19] h-36 flex items-center justify-center p-3 text-center font-heading-tajawal text-xs font-bold text-[#4a3e2e] dark:text-[#ccc0ac]">
            فضيلة الشيخ الدكتور ياسر برهامي
          </div>
        )}
        <figcaption className="font-heading-tajawal space-y-0.5">
          <div className="text-xs font-bold text-[#8b2432] dark:text-[#ea929d]">
            مُحرّر الحاشية والاستدراكات
          </div>
          <div className="text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
            فضيلة الشيخ د. ياسر برهامي
          </div>
        </figcaption>
      </figure>

      <p className="font-matn-majalla text-base text-[#4c4236] dark:text-[#ccc0ac] leading-relaxed">
        عرضٌ حرفي مطابق لصفحات الكتاب المطبوع (١–٣٠٩): نص الكتاب والشرح في الأعلى،
        وتحته الحاشية السفلية بنصها الكامل كما وردت في النسخة المصورة مع تلوين النصين.
      </p>
    </section>
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 pb-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar: Sheikh Yasser Scholarly Card + Book TOC */}
        <aside
          aria-label="فهرس وضع القراءة والتعريف بالمحشي"
          className="hidden lg:block lg:col-span-3 space-y-5 lg:sticky lg:top-4"
        >
          {scholarAttributionCard}

          <nav
            aria-label="أبواب الكتاب في وضع القراءة"
            className="paper-sheet rounded-xl p-4 max-h-[54vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e5dcc8] dark:border-[#332c24] font-heading-tajawal">
              <h2 className="text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                أبواب الكتاب ({sections.length})
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
                      onClick={() => handleSelectTocSection(sec)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        active
                          ? 'bg-[#f8eaec] dark:bg-[#2d171b] text-[#8b2432] dark:text-[#f5acb4] font-bold border border-[#e3bfc5] dark:border-[#5e2a31]'
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
                        {done ? '✓' : `ص${toArabicIndicNumber(sec.pageStart)}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Book Reading Column */}
        <div className="lg:col-span-9 min-w-0 space-y-5">
          {/* Reading Mode Controls Bar: Color Modes, Font Scale, and Direct Page Navigation */}
          <div className="paper-sheet rounded-xl p-3.5 sm:p-4 space-y-3.5 font-heading-tajawal">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                <Palette
                  className="w-4 h-4 text-[#8b2432] dark:text-[#ea929d] shrink-0"
                  aria-hidden="true"
                />
                <span>تلوين النص العلوي والحاشية السفلية:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <div
                  role="group"
                  aria-label="نمط تلوين الكتاب والحاشية"
                  className="flex flex-wrap items-center gap-1 p-1 max-w-full bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24] rounded-lg"
                >
                  {COLOR_SCHEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setColorScheme(opt.id)}
                      aria-pressed={colorScheme === opt.id}
                      className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        colorScheme === opt.id
                          ? 'bg-[#8b2432] text-[#fcf9f1] dark:bg-[#a63443] font-bold shadow-xs'
                          : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14] dark:hover:text-[#eee7d7]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div
                  role="group"
                  aria-label="حجم خط القراءة"
                  className="flex items-center gap-1 p-1 bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24] rounded-lg"
                >
                  <Type
                    className="w-3.5 h-3.5 text-[#655b4e] dark:text-[#b0a491] mx-1"
                    aria-hidden="true"
                  />
                  {(
                    [
                      { id: 'normal', label: 'أ' },
                      { id: 'large', label: 'أ+' },
                      { id: 'xlarge', label: 'أ++' },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setFontScale(sz.id)}
                      aria-pressed={fontScale === sz.id}
                      aria-label={`حجم الخط ${sz.label}`}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                        fontScale === sz.id
                          ? 'bg-[#fcf9f1] dark:bg-[#2a231c] text-[#1f1a14] dark:text-[#eee7d7] shadow-xs'
                          : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14]'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Color Key Strip */}
            {colorScheme === 'semantic' && (
              <div className="pt-2.5 border-t border-[#e5dcc8] dark:border-[#332c24] flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                <span className="font-bold text-[#655b4e] dark:text-[#b0a491]">
                  دليل تلوين النصين:
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#231b13] dark:text-[#f0e8d8] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#231b13] dark:bg-[#f0e8d8]"
                    aria-hidden="true"
                  />
                  نص الكتاب (الأعلى)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#0f5734] dark:text-[#86e3b3] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#115e38] dark:bg-[#7ee2ad]"
                    aria-hidden="true"
                  />
                  الآيات القرآنية
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#133d73] dark:text-[#95c4f8] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#133d73] dark:bg-[#95c4f8]"
                    aria-hidden="true"
                  />
                  الأحاديث والمنقولات
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#5b380b] dark:text-[#edd09c] font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#5b380b] dark:bg-[#edd09c]"
                    aria-hidden="true"
                  />
                  الحاشية السفلية (التعليقات)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#7a1926] dark:text-[#f4b0b9] font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#7a1926] dark:bg-[#f4b0b9]"
                    aria-hidden="true"
                  />
                  استدراكات وتحقيقات الحاشية
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#1b546b] dark:text-[#8ac8e3] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#1b546b] dark:bg-[#8ac8e3]"
                    aria-hidden="true"
                  />
                  التخريج والإحالات
                </span>
              </div>
            )}

            {colorScheme === 'bicolor' && (
              <div className="pt-2.5 border-t border-[#e5dcc8] dark:border-[#332c24] flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                <span className="font-bold text-[#655b4e] dark:text-[#b0a491]">
                  التلوين الثنائي:
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#163a66] dark:text-[#9ec7f5] font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#163a66] dark:bg-[#9ec7f5]"
                    aria-hidden="true"
                  />
                  نص الكتاب الأصلي (الأعلى)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#6e2f12] dark:text-[#f0c095] font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#6e2f12] dark:bg-[#f0c095]"
                    aria-hidden="true"
                  />
                  الحاشية السفلية كما في الكتاب
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#0e5a36] dark:text-[#7ee2ad] font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#0e5a36] dark:bg-[#7ee2ad]"
                    aria-hidden="true"
                  />
                  الآيات القرآنية
                </span>
              </div>
            )}
          </div>

          {/* Verbatim Full-Text Search Results across all 309 PDF pages */}
          {searchQuery.trim() && (
            <section
              aria-label="نتائج البحث في وضع القراءة"
              className="paper-hashiyah-sheet rounded-xl p-4 space-y-3"
            >
              <h2 className="font-heading-tajawal text-sm font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                نتائج البحث النصي عن «{searchQuery}» ({toArabicIndicNumber(searchHits.length)}{' '}
                صفحة مطابقة)
              </h2>
              {searchHits.length === 0 ? (
                <p className="font-heading-tajawal text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491]">
                  لم يتم العثور على مواضع مطابقة في نص الكتاب أو الحاشية.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                  {searchHits.map((hit, idx) => (
                    <button
                      key={`${hit.page}-${hit.layer}-${idx}`}
                      type="button"
                      onClick={() => navigateToPage(hit.page)}
                      className="text-right p-3 rounded-lg bg-[#fcf9f1] dark:bg-[#1d1915] border border-[#d6cbb3] dark:border-[#3b332a] hover:border-[#8b2432] transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 font-heading-tajawal text-xs">
                        <span className="text-[#8b2432] dark:text-[#ea929d] font-bold">
                          ص {toArabicIndicNumber(hit.page)} · {hit.sectionOrderLabel}
                        </span>
                        <span className="text-[11px] font-bold text-[#655b4e] dark:text-[#b0a491]">
                          {hit.layer === 'hashiyah' ? 'في الحاشية' : 'في المتن'}
                        </span>
                      </div>
                      <p className="font-matn-majalla text-sm text-[#2c241b] dark:text-[#dfd5c4] line-clamp-2 leading-relaxed">
                        {hit.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Authentic Book Page Sheet Matching PDF Page-for-Page */}
          <article
            aria-label={`صفحة ${toArabicIndicNumber(currentPageNum)} من الكتاب بنصه وتحته الحاشية`}
            className="paper-stack rounded-2xl p-5 sm:p-9 lg:p-11 space-y-7"
          >
            {/* Book Running Header + Page Turn Controls */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b-2 border-[#8b2432]/75 dark:border-[#ea929d]/60 font-heading-tajawal text-xs sm:text-sm">
                <span className="font-bold text-[#8b2432] dark:text-[#f2a7af]">
                  صحيح مسلم شرح النووي
                </span>
                <span className="font-bold text-[#8b2432] dark:text-[#f2a7af]">
                  كتاب الإيمان
                </span>
              </div>

              {/* Section context + Direct Page Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="space-y-1 min-w-0">
                  <div className="font-heading-tajawal text-xs font-bold text-[#8b2432] dark:text-[#ea929d]">
                    {currentSection.orderLabel} · صفحة {toArabicIndicNumber(currentPageNum)} من{' '}
                    {toArabicIndicNumber(TOTAL_PDF_PAGES)}
                  </div>
                  <h1 className="font-heading-tajawal text-lg sm:text-2xl font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-snug text-balance">
                    {currentSection.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-heading-tajawal max-w-full">
                  {/* Page Stepper & Jump Input */}
                  <div className="flex flex-wrap items-center gap-1 p-1 max-w-full rounded-lg bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24]">
                    <button
                      type="button"
                      onClick={() => navigateToPage(currentPageNum - 1)}
                      disabled={currentPageNum <= 1}
                      aria-label="الصفحة السابقة"
                      className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-bold rounded-md text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#fcf9f1] dark:hover:bg-[#2a231c] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>السابقة</span>
                    </button>

                    <form onSubmit={handlePageSubmit} className="flex items-center gap-1 px-1">
                      <label htmlFor="reading-page-jump" className="sr-only">
                        الانتقال إلى رقم الصفحة
                      </label>
                      <span className="text-[11px] text-[#655b4e] dark:text-[#b0a491]">ص</span>
                      <input
                        id="reading-page-jump"
                        type="text"
                        inputMode="numeric"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={() => {
                          const parsed = fromArabicIndicNumber(pageInput);
                          if (parsed !== null && parsed !== currentPageNum) {
                            navigateToPage(parsed);
                          } else {
                            setPageInput(String(currentPageNum));
                          }
                        }}
                        aria-label="رقم الصفحة في الكتاب"
                        className="w-12 text-center py-0.5 px-1 text-xs font-bold tabular-nums rounded bg-[#fcf9f1] dark:bg-[#241f19] border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] focus:outline-none focus:ring-2 focus:ring-[#8b2432]/40"
                      />
                      <span className="text-[11px] text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                        / {toArabicIndicNumber(TOTAL_PDF_PAGES)}
                      </span>
                    </form>

                    <button
                      type="button"
                      onClick={() => navigateToPage(currentPageNum + 1)}
                      disabled={currentPageNum >= TOTAL_PDF_PAGES}
                      aria-label="الصفحة التالية"
                      className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-bold rounded-md bg-[#8b2432] dark:bg-[#a63443] text-[#fcf9f1] hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>التالية</span>
                      <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPdfAtPage(currentPageNum)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen
                      className="w-3.5 h-3.5 text-[#8b2432] dark:text-[#ea929d]"
                      aria-hidden="true"
                    />
                    <span>مطابقة PDF ص {toArabicIndicNumber(currentPageNum)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchToStudyMode(currentSection.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1b4d3e] dark:text-[#7ec9ad] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer whitespace-nowrap"
                  >
                    <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>المذكرة التحليلية</span>
                  </button>
                </div>
              </div>
            </header>

            {loadError && (
              <div
                role="alert"
                className="rounded-xl border border-[#e3bfc5] dark:border-[#5e2a31] bg-[#fbeff0] dark:bg-[#2c1519] p-4 font-heading-tajawal text-sm text-[#821826] dark:text-[#f7a8b2]"
              >
                {loadError}
              </div>
            )}

            {!currentPageData && !loadError && (
              <div className="py-12 text-center font-heading-tajawal text-sm text-[#655b4e] dark:text-[#b0a491]">
                جاري تحميل نص صفحات الكتاب المطبوع...
              </div>
            )}

            {currentPageData && (
              <>
                {/* UPPER SECTION: Verbatim Main Book Text (النص العلوي كما هو في الـ PDF) */}
                {currentPageData.body.length > 0 ? (
                  <section
                    aria-label="نص الكتاب الأصلي كما في النسخة المصورة"
                    className={`font-matn-majalla ${sizeClasses.matn} max-w-[78ch] space-y-4`}
                  >
                    {currentPageData.body.map((block, bIdx) => {
                      if (block.kind === 'bismillah') {
                        return (
                          <div
                            key={`p${currentPageData.page}-b-${bIdx}`}
                            className="text-center text-2xl sm:text-4xl py-1 text-[#1b4d3e] dark:text-[#86e3b3] break-words"
                          >
                            {block.text}
                          </div>
                        );
                      }

                      if (block.kind === 'heading') {
                        return (
                          <h2
                            key={`p${currentPageData.page}-b-${bIdx}`}
                            className="font-heading-tajawal text-base sm:text-xl font-bold text-[#8b2432] dark:text-[#f2a7af] pt-2 leading-relaxed"
                          >
                            {renderVerbatimTokens(
                              block.text,
                              'matn',
                              `p${currentPageData.page}-bh-${bIdx}`
                            )}
                          </h2>
                        );
                      }

                      return (
                        <p
                          key={`p${currentPageData.page}-b-${bIdx}`}
                          className="text-justify sm:text-right"
                        >
                          {renderVerbatimTokens(
                            block.text,
                            'matn',
                            `p${currentPageData.page}-bp-${bIdx}`
                          )}
                        </p>
                      );
                    })}
                  </section>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#d6cbb3] dark:border-[#3b332a] bg-[#f8f3e7]/70 dark:bg-[#191511]/70 px-4 py-3 font-heading-tajawal text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491]">
                    هذه الصفحة مخصّصة بالكامل لتتمة الحاشية السفلية الممتدة من الصفحة السابقة
                    (ص {toArabicIndicNumber(Math.max(1, currentPageData.page - 1))}).
                  </div>
                )}

                {/* LOWER SECTION: Verbatim PDF Footnotes Directly Beneath (الحاشية السفلية كما هي في الـ PDF) */}
                {currentPageData.footnotes.length > 0 ? (
                  <div className="pt-3 space-y-4">
                    {/* Authentic Printed Book Footnote Rule */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3" aria-hidden="true">
                        <span
                          className={
                            currentPageData.hasContinuationFromPrev
                              ? 'w-full h-[1.5px] bg-[#8b2432]/65 dark:bg-[#ea929d]/60'
                              : 'w-40 sm:w-56 h-[2px] bg-[#8b2432]/75 dark:bg-[#ea929d]/65'
                          }
                        />
                        {!currentPageData.hasContinuationFromPrev && (
                          <span className="flex-1 h-px bg-[#dfd5c0] dark:bg-[#332c24]" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 font-heading-tajawal">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#8b2432] dark:text-[#ea929d]">
                          <BookText className="w-4 h-4" aria-hidden="true" />
                          <span>
                            الحاشية السفلية (مطابقة للكتاب — ص{' '}
                            {toArabicIndicNumber(currentPageData.page)})
                          </span>
                        </div>
                        <span className="text-[11px] text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                          {currentPageData.footnotes.filter((f) => f.marker).length > 0
                            ? `${toArabicIndicNumber(
                                currentPageData.footnotes.filter((f) => f.marker).length
                              )} حواشٍ في هذه الصفحة`
                            : 'تتمة حاشية الصفحة السابقة'}
                        </span>
                      </div>
                    </div>

                    <section
                      aria-label={`الحاشية السفلية لصفحة ${toArabicIndicNumber(currentPageData.page)} كما في الكتاب`}
                      className="rounded-xl border border-[#dfd5c0] dark:border-[#3b332a] bg-[#f4ede0]/80 dark:bg-[#17130f]/85 p-4 sm:p-6 space-y-3"
                    >
                      <div className={`space-y-3 font-matn-majalla ${sizeClasses.hashiyah}`}>
                        {currentPageData.footnotes.map((fn, fnIdx) => {
                          const fnDomId = getVerbatimFootnoteDomId(
                            currentPageData.page,
                            fn.marker,
                            fnIdx
                          );
                          const isFnHighlighted = highlightedId === fnDomId;
                          const istidrak = isIstidrakFootnote(fn.text);
                          const subParagraphs = fn.text.split('\n').filter((p) => p.trim());

                          return (
                            <div
                              key={fnDomId}
                              id={fnDomId}
                              className={`rounded-lg p-2.5 sm:p-3 transition-all duration-300 ${
                                isFnHighlighted
                                  ? 'ring-2 ring-[#8b2432]/75 dark:ring-[#ea929d]/75 bg-[#fcf9f1] dark:bg-[#241e18]'
                                  : colorScheme === 'semantic' && istidrak
                                    ? 'bg-[#fbeff0]/55 dark:bg-[#2a1518]/55 border-r-2 border-[#8b2432]/55 dark:border-[#ea929d]/55'
                                    : 'bg-[#fcf9f1]/60 dark:bg-[#1e1914]/60'
                              }`}
                            >
                              {fn.marker === null && (
                                <div className="font-heading-tajawal text-[11px] font-bold text-[#8b2432] dark:text-[#ea929d] mb-1">
                                  تتمة الحاشية من صفحة{' '}
                                  {toArabicIndicNumber(Math.max(1, currentPageData.page - 1))}:
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                {fn.marker && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      jumpToElement(
                                        getVerbatimAnchorDomId(currentPageData.page, fn.marker!)
                                      )
                                    }
                                    title="العودة إلى موضعها في النص العلوي"
                                    aria-label={`الحاشية ${fn.marker} — العودة إلى موضعها في النص العلوي`}
                                    className="font-heading-tajawal text-xs sm:text-sm font-bold text-[#9b1c2c] dark:text-[#f87171] hover:underline shrink-0 mt-1 cursor-pointer tabular-nums"
                                  >
                                    {fn.marker}
                                  </button>
                                )}

                                <div className="flex-1 space-y-2 leading-[1.95]">
                                  {subParagraphs.map((subPara, sIdx) => (
                                    <p key={`${fnDomId}-sub-${sIdx}`}>
                                      {renderVerbatimTokens(
                                        subPara,
                                        'hashiyah',
                                        `${fnDomId}-p${sIdx}`,
                                        istidrak
                                      )}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-[#e5dcc8] dark:border-[#332c24] font-heading-tajawal text-xs text-[#655b4e] dark:text-[#b0a491]">
                    لا توجد حاشية سفلية في هذه الصفحة من الكتاب المطبوع.
                  </div>
                )}
              </>
            )}

            {/* Book Page Navigation Footer */}
            <footer className="pt-5 border-t border-[#dfd5c0] dark:border-[#332c24] flex flex-wrap items-center justify-between gap-4 font-heading-tajawal">
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
                <span>
                  {isCompleted
                    ? `تمت قراءة ${currentSection.orderLabel}`
                    : `تحديد ${currentSection.orderLabel} كمقروء`}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5 max-w-full">
                <button
                  type="button"
                  onClick={() => navigateToPage(currentPageNum - 1)}
                  disabled={currentPageNum <= 1}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  <span>
                    الصفحة السابقة ({toArabicIndicNumber(Math.max(1, currentPageNum - 1))})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToPage(currentPageNum + 1)}
                  disabled={currentPageNum >= TOTAL_PDF_PAGES}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#8b2432] dark:bg-[#a63443] text-[#fcf9f1] hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span>
                    الصفحة التالية (
                    {toArabicIndicNumber(Math.min(TOTAL_PDF_PAGES, currentPageNum + 1))})
                  </span>
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </footer>
          </article>

          {/* Mobile/Tablet Scholar Attribution Card (visible below book sheet on < lg) */}
          <div className="lg:hidden">{scholarAttributionCard}</div>
        </div>
      </div>

      {/* Compact Opaque Bottom Reading Progress Track */}
      <div
        aria-label="مؤشر التقدم في وضع القراءة"
        className="fixed bottom-0 inset-x-0 z-30 h-7 bg-[#f8f3e7] dark:bg-[#181410] border-t border-[#dfd5c0] dark:border-[#332c24] px-4 sm:px-6 flex items-center justify-between gap-4 font-heading-tajawal text-[11px]"
      >
        <div className="flex items-center gap-2 min-w-0 truncate text-[#4c4236] dark:text-[#ccc0ac]">
          <span className="font-bold text-[#8b2432] dark:text-[#ea929d] shrink-0">
            وضع القراءة · {currentSection.orderLabel}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline truncate">{currentSection.title}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          <div
            role="progressbar"
            aria-valuenow={pagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="نسبة التقدم في الكتاب"
            className="w-24 sm:w-40 h-1.5 rounded-full bg-[#e3d9c3] dark:bg-[#332c24] overflow-hidden"
          >
            <div
              className="h-full bg-[#8b2432] dark:bg-[#ea929d] transition-[width] duration-200"
              style={{ width: `${pagePercent}%` }}
            />
          </div>
          <span className="font-bold text-[#1f1a14] dark:text-[#eee7d7]">
            ص {toArabicIndicNumber(currentPageNum)} / ٣٠٩ ({pagePercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};
