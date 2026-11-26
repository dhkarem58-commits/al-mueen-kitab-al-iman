import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  BookSection,
  PATTERN_META,
  PATTERN_ORDER,
  PatternType,
  QuestionDifficulty,
  QuestionItem,
  QuestionSource,
} from '../data/types';
import { filterQuestions, gradeQuizSession } from '../utils/questionBank';
import { splitInlineTokens } from '../utils/readerLogic';

export type QuestionBankMode = 'study' | 'exam';

interface QuestionBankViewProps {
  sections: BookSection[];
  questions: QuestionItem[];
  mode: QuestionBankMode;
  onModeChange: (mode: QuestionBankMode) => void;
  sectionFilter: string;
  onSectionFilterChange: (sectionId: string) => void;
  searchQuery: string;
  bookmarkedIds: string[];
  wrongIds: string[];
  onToggleBookmark: (questionId: string) => void;
  onRecordWrongAnswers: (newWrongIds: string[]) => void;
  onOpenPdfAtPage: (page: number) => void;
  onOpenSectionReader: (sectionId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  sections,
  questions,
  mode,
  onModeChange,
  sectionFilter,
  onSectionFilterChange,
  searchQuery,
  bookmarkedIds,
  wrongIds,
  onToggleBookmark,
  onRecordWrongAnswers,
  onOpenPdfAtPage,
  onOpenSectionReader,
}) => {
  const [sourceFilter, setSourceFilter] = useState<QuestionSource | 'all'>('all');
  const [patternFilter, setPatternFilter] = useState<PatternType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | 'all'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [onlyWrong, setOnlyWrong] = useState(false);

  const [studySelected, setStudySelected] = useState<Record<string, number>>({});
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  const sectionLookup = useMemo(
    () => new Map(sections.map((s) => [s.id, s])),
    [sections]
  );

  const filteredQuestions = useMemo(
    () =>
      filterQuestions(questions, {
        sectionId: sectionFilter,
        sourceAuthor: sourceFilter,
        patternType: patternFilter,
        difficulty: difficultyFilter,
        searchQuery,
        onlyBookmarked,
        bookmarkedIds,
        onlyWrong,
        wrongIds,
      }),
    [
      questions,
      sectionFilter,
      sourceFilter,
      patternFilter,
      difficultyFilter,
      searchQuery,
      onlyBookmarked,
      bookmarkedIds,
      onlyWrong,
      wrongIds,
    ]
  );

  React.useEffect(() => {
    setExamIndex(0);
    setExamSubmitted(false);
  }, [
    sectionFilter,
    sourceFilter,
    patternFilter,
    difficultyFilter,
    onlyBookmarked,
    onlyWrong,
  ]);

  const resetAllFilters = () => {
    onSectionFilterChange('all');
    setSourceFilter('all');
    setPatternFilter('all');
    setDifficultyFilter('all');
    setOnlyBookmarked(false);
    setOnlyWrong(false);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinishExam = () => {
    const breakdown = gradeQuizSession(filteredQuestions, examAnswers);
    onRecordWrongAnswers(breakdown.wrongQuestionIds);
    setExamSubmitted(true);
  };

  const handleResetExam = () => {
    setExamAnswers({});
    setExamIndex(0);
    setExamSubmitted(false);
  };

  const currentExamQuestion =
    filteredQuestions[Math.min(examIndex, Math.max(0, filteredQuestions.length - 1))];
  const examBreakdown = gradeQuizSession(filteredQuestions, examAnswers);

  const renderQuoteWithFonts = (quote: string, patternType: PatternType) => {
    const tokens = splitInlineTokens({ type: patternType, text: quote });
    return (
      <p
        className={
          patternType === 'quran'
            ? 'font-quran-hafs text-[21px] sm:text-[23px] leading-[2.05]'
            : 'font-matn-majalla text-lg sm:text-[20px] leading-relaxed'
        }
      >
        «
        {tokens.map((tok, i) =>
          tok.isQuranic && patternType !== 'quran' ? (
            <span key={i} className="font-quran-hafs text-[20px] sm:text-[22px] px-1">
              {tok.text}
            </span>
          ) : (
            <span key={i}>{tok.text}</span>
          )
        )}
        »
      </p>
    );
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <section className="paper-stack rounded-2xl p-5 sm:p-6 space-y-5 font-heading-tajawal">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
              بنك الأسئلة الشامل — شرح النووي وتعليقات الشيخ ياسر برهامي
            </h1>
            <p className="text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491] tabular-nums mt-1">
              المعروض: {filteredQuestions.length} من أصل {questions.length} سؤالاً موثقاً ·
              المحفوظة: {bookmarkedIds.length} · الأخطاء المسجلة: {wrongIds.length}
            </p>
          </div>

          <div
            role="group"
            aria-label="وضع استخدام بنك الأسئلة"
            className="flex items-center gap-1 p-1 bg-[#f1ead9] dark:bg-[#171410] border border-[#dfd5c0] dark:border-[#332c24] rounded-lg"
          >
            <button
              type="button"
              onClick={() => onModeChange('study')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                mode === 'study'
                  ? 'bg-[#fcf9f1] dark:bg-[#2a231c] text-[#1f1a14] dark:text-[#eee7d7] shadow-xs font-bold'
                  : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14] dark:hover:text-[#eee7d7]'
              }`}
            >
              وضع المذاكرة والبطاقات
            </button>
            <button
              type="button"
              onClick={() => onModeChange('exam')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                mode === 'exam'
                  ? 'bg-[#1b4d3e] text-[#fcf9f1] dark:bg-[#2a6e59] shadow-xs font-bold'
                  : 'text-[#655b4e] dark:text-[#b0a491] hover:text-[#1f1a14] dark:hover:text-[#eee7d7]'
              }`}
            >
              وضع الاختبار التفاعلي
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="qb-section-filter"
              className="block text-xs font-medium text-[#655b4e] dark:text-[#b0a491] mb-1"
            >
              تصفية حسب الباب
            </label>
            <select
              id="qb-section-filter"
              value={sectionFilter}
              onChange={(e) => onSectionFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7]"
            >
              <option value="all">جميع أبواب الكتاب ({questions.length})</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.orderLabel}: {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="qb-source-filter"
              className="block text-xs font-medium text-[#655b4e] dark:text-[#b0a491] mb-1"
            >
              تصفية حسب القائل / المصدر
            </label>
            <select
              id="qb-source-filter"
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as QuestionSource | 'all')
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7]"
            >
              <option value="all">الجميع (النووي + الشيخ ياسر)</option>
              <option value="النووي">الإمام النووي</option>
              <option value="الشيخ ياسر برهامي">فضيلة الشيخ ياسر برهامي</option>
              <option value="كلاهما">كلاهما (اتفاق أو تقريب مشترك)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="qb-pattern-filter"
              className="block text-xs font-medium text-[#655b4e] dark:text-[#b0a491] mb-1"
            >
              النمط العلمي
            </label>
            <select
              id="qb-pattern-filter"
              value={patternFilter}
              onChange={(e) =>
                setPatternFilter(e.target.value as PatternType | 'all')
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7]"
            >
              <option value="all">جميع الأنماط العلمية</option>
              {PATTERN_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PATTERN_META[p].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="qb-difficulty-filter"
              className="block text-xs font-medium text-[#655b4e] dark:text-[#b0a491] mb-1"
            >
              المستوى
            </label>
            <select
              id="qb-difficulty-filter"
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as QuestionDifficulty | 'all')
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#d6cbb3] dark:border-[#3b332a] bg-[#fcf9f1] dark:bg-[#1d1915] text-[#1f1a14] dark:text-[#eee7d7]"
            >
              <option value="all">جميع المستويات</option>
              <option value="أساسي">أساسي</option>
              <option value="متوسط">متوسط</option>
              <option value="متقدم">متقدم</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#3d342a] dark:text-[#ccc0ac] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyBookmarked}
                onChange={(e) => setOnlyBookmarked(e.target.checked)}
                className="rounded border-[#cfc2a9] text-[#1b4d3e] focus:ring-[#1b4d3e]"
              />
              <span>الأسئلة المحفوظة فقط ({bookmarkedIds.length})</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#3d342a] dark:text-[#ccc0ac] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWrong}
                onChange={(e) => setOnlyWrong(e.target.checked)}
                className="rounded border-[#cfc2a9] text-[#1b4d3e] focus:ring-[#1b4d3e]"
              />
              <span>مراجعة الأخطاء السابقة ({wrongIds.length})</span>
            </label>
          </div>

          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#3d342a] dark:text-[#ccc0ac] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إعادة ضبط التصفية</span>
          </button>
        </div>
      </section>

      {filteredQuestions.length === 0 ? (
        <div className="paper-sheet rounded-2xl p-8 text-center space-y-3 font-heading-tajawal">
          <p className="text-base font-bold text-[#1f1a14] dark:text-[#eee7d7]">
            لا توجد أسئلة مطابقة لمعايير التصفية المختارة
          </p>
          <p className="text-xs sm:text-sm text-[#655b4e] dark:text-[#b0a491]">
            يمكنك إعادة ضبط الفلاتر لعرض جميع الأسئلة الموثقة من الكتاب.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] cursor-pointer"
          >
            عرض كافة الأسئلة
          </button>
        </div>
      ) : mode === 'study' ? (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const sec = sectionLookup.get(q.sectionId);
            const meta = PATTERN_META[q.patternType];
            const isBookmarked = bookmarkedIds.includes(q.id);
            const selectedOption = studySelected[q.id];
            const isRevealed = revealedIds.has(q.id) || typeof selectedOption === 'number';

            return (
              <article
                key={q.id}
                className="paper-sheet rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-heading-tajawal">
                  <div className="text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                    <span className="font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                      س{idx + 1}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{sec?.orderLabel ?? q.sectionId}</span>
                    <span aria-hidden="true"> · </span>
                    <span className={`font-bold ${meta.dotColorClass}`}>
                      [{meta.label}]
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{q.sourceAuthor}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{q.difficulty}</span>
                    <span aria-hidden="true"> · </span>
                    <span>ص {q.pageRef}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q.id)}
                      aria-pressed={isBookmarked}
                      aria-label={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ السؤال للمراجعة'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border cursor-pointer ${
                        isBookmarked
                          ? 'bg-[#faf2e3] border-[#d4b882] text-[#5c3d0e] dark:bg-[#292011] dark:border-[#574220] dark:text-[#ecd19d]'
                          : 'border-[#cfc2a9] dark:border-[#43392e] text-[#564b3e] dark:text-[#ccc0ac] hover:bg-[#efe6d3] dark:hover:bg-[#27211b]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isBookmarked ? 'محفوظ' : 'حفظ'}</span>
                    </button>
                  </div>
                </div>

                <h2 className="font-heading-tajawal text-base sm:text-lg font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-relaxed">
                  {q.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-heading-tajawal">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctIndex;
                    const isPicked = selectedOption === optIdx;
                    let optClass =
                      'border-[#dfd5c0] dark:border-[#3b332a] bg-[#f8f3e7] dark:bg-[#191612] text-[#1f1a14] dark:text-[#eee7d7] hover:border-[#1b4d3e]';

                    if (isRevealed) {
                      if (isCorrect) {
                        optClass =
                          'border-[#3c8c62] bg-[#eef5ef] dark:bg-[#13261b] dark:border-[#2c6b49] text-[#14472d] dark:text-[#a9dec0] font-bold';
                      } else if (isPicked) {
                        optClass =
                          'border-[#b84a57] bg-[#fbeff0] dark:bg-[#2c1619] dark:border-[#6e2d35] text-[#731d28] dark:text-[#f2b8bf]';
                      }
                    }

                    return (
                      <button
                        key={`${q.id}-opt-${optIdx}`}
                        type="button"
                        onClick={() =>
                          setStudySelected((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`text-right p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed transition-colors flex items-start gap-2.5 cursor-pointer ${optClass}`}
                      >
                        <span className="font-bold tabular-nums shrink-0">
                          {String.fromCharCode(1633 + optIdx)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isRevealed && isCorrect && (
                          <CheckCircle2
                            className="w-4 h-4 text-[#1b603d] dark:text-[#78c99d] shrink-0 mt-0.5"
                            aria-label="إجابة صحيحة"
                          />
                        )}
                        {isRevealed && isPicked && !isCorrect && (
                          <XCircle
                            className="w-4 h-4 text-[#8b2432] dark:text-[#ea929d] shrink-0 mt-0.5"
                            aria-label="إجابة خاطئة"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-heading-tajawal">
                  <button
                    type="button"
                    onClick={() => toggleReveal(q.id)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer"
                  >
                    {isRevealed ? 'إخفاء الشرح والتوثيق' : 'إظهار الإجابة والتوثيق'}
                  </button>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenSectionReader(q.sectionId)}
                      className="text-[#1b4d3e] dark:text-[#7ec9ad] font-bold hover:underline cursor-pointer"
                    >
                      قراءة في المذكرة
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPdfAtPage(q.pageRef)}
                      className="inline-flex items-center gap-1 text-[#564b3e] dark:text-[#ccc0ac] hover:underline tabular-nums cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>فتح ص {q.pageRef} PDF</span>
                    </button>
                  </div>
                </div>

                {isRevealed && (
                  <div className={`rounded-xl border p-4 space-y-2 ${meta.segmentClass}`}>
                    <div className="font-heading-tajawal text-xs font-bold">
                      الشاهد الموثق من الكتاب ({q.sourceAuthor} · ص {q.pageRef}):
                    </div>
                    {renderQuoteWithFonts(q.sourceQuote, q.patternType)}
                    <p className="font-matn-majalla text-base sm:text-[17px] leading-relaxed opacity-95 pt-1.5 border-t border-black/10 dark:border-white/10">
                      <span className="font-heading-tajawal text-xs font-bold ml-1">
                        التوضيح العلمي:
                      </span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : examSubmitted ? (
        <section
          aria-label="نتيجة الاختبار التفاعلي"
          className="paper-stack rounded-2xl p-6 sm:p-8 space-y-6 font-heading-tajawal"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5dcc8] dark:border-[#332c24] pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1f1a14] dark:text-[#eee7d7]">
                النتيجة النهائية للاختبار
              </h2>
              <p className="text-sm text-[#564b3e] dark:text-[#ccc0ac] tabular-nums mt-1">
                أجبت عن {examBreakdown.answered} من أصل {examBreakdown.total} سؤالاً · الصحيح:{' '}
                {examBreakdown.correct} · الخطأ: {examBreakdown.wrong}
              </p>
            </div>

            <div className="text-left space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-[#1b4d3e] dark:text-[#7ec9ad]">
                {examBreakdown.accuracyPercent}%
              </div>
              <div className="text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
                الدقة في المجاب · الإجمالي {examBreakdown.correct}/{examBreakdown.total} (
                {Math.round((examBreakdown.correct / Math.max(1, examBreakdown.total)) * 100)}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['النووي', 'الشيخ ياسر برهامي', 'كلاهما'] as QuestionSource[]).map(
              (src) => {
                const stat = examBreakdown.bySource[src];
                if (stat.total === 0) return null;
                return (
                  <div
                    key={src}
                    className="paper-hashiyah-sheet p-4 rounded-xl"
                  >
                    <div className="text-xs text-[#655b4e] dark:text-[#b0a491]">{src}</div>
                    <div className="text-lg font-bold tabular-nums text-[#1f1a14] dark:text-[#eee7d7] mt-1">
                      {stat.correct} / {stat.total} صحيح
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleResetExam}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] cursor-pointer"
            >
              إعادة الاختبار
            </button>
            {examBreakdown.wrongQuestionIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOnlyWrong(true);
                  onModeChange('study');
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] hover:bg-[#efe6d3] dark:hover:bg-[#27211b] cursor-pointer"
              >
                مراجعة الأسئلة الخاطئة مع التوثيق ({examBreakdown.wrongQuestionIds.length})
              </button>
            )}
          </div>
        </section>
      ) : (
        <section
          aria-label="الاختبار التفاعلي"
          className="paper-stack rounded-2xl p-6 sm:p-8 space-y-6 font-heading-tajawal"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dcc8] dark:border-[#332c24] pb-4">
            <div className="text-xs sm:text-sm text-[#564b3e] dark:text-[#ccc0ac] tabular-nums">
              السؤال <span className="font-bold">{examIndex + 1}</span> من{' '}
              <span className="font-bold">{filteredQuestions.length}</span>
              <span aria-hidden="true"> · </span>
              <span>تمت الإجابة على {Object.keys(examAnswers).length}</span>
              <span aria-hidden="true"> · </span>
              <span>{currentExamQuestion.sourceAuthor}</span>
            </div>

            <button
              type="button"
              onClick={handleFinishExam}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#1b4d3e] text-[#fcf9f1] hover:bg-[#143b2f] dark:bg-[#2a6e59] dark:hover:bg-[#33856b] cursor-pointer"
            >
              إنهاء الاختبار وعرض النتيجة
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[#655b4e] dark:text-[#b0a491] tabular-nums">
              {sectionLookup.get(currentExamQuestion.sectionId)?.orderLabel} ·{' '}
              [{PATTERN_META[currentExamQuestion.patternType].label}] · المستوى:{' '}
              {currentExamQuestion.difficulty} · ص {currentExamQuestion.pageRef}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#1f1a14] dark:text-[#eee7d7] leading-relaxed">
              {currentExamQuestion.question}
            </h2>

            <div className="space-y-2.5 pt-2">
              {currentExamQuestion.options.map((opt, optIdx) => {
                const selected = examAnswers[currentExamQuestion.id] === optIdx;
                return (
                  <button
                    key={`${currentExamQuestion.id}-ex-${optIdx}`}
                    type="button"
                    onClick={() =>
                      setExamAnswers((prev) => ({
                        ...prev,
                        [currentExamQuestion.id]: optIdx,
                      }))
                    }
                    className={`w-full text-right p-4 rounded-xl border text-sm leading-relaxed transition-colors cursor-pointer flex items-start gap-3 ${
                      selected
                        ? 'bg-[#eef5ef] dark:bg-[#13261b] border-[#1b4d3e] dark:border-[#3c8c62] text-[#14472d] dark:text-[#a9dec0] font-bold'
                        : 'bg-[#f8f3e7] dark:bg-[#191612] border-[#dfd5c0] dark:border-[#3b332a] text-[#1f1a14] dark:text-[#eee7d7] hover:border-[#1b4d3e]'
                    }`}
                  >
                    <span className="font-bold tabular-nums shrink-0">
                      {String.fromCharCode(1633 + optIdx)}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e5dcc8] dark:border-[#332c24]">
            <button
              type="button"
              onClick={() => setExamIndex((i) => Math.max(0, i - 1))}
              disabled={examIndex === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border border-[#cfc2a9] dark:border-[#43392e] text-[#1f1a14] dark:text-[#eee7d7] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
              <span>السؤال السابق</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setExamIndex((i) => Math.min(filteredQuestions.length - 1, i + 1))
              }
              disabled={examIndex >= filteredQuestions.length - 1}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[#1f1a14] dark:bg-[#eee7d7] text-[#fcf9f1] dark:text-[#1f1a14] disabled:opacity-40 cursor-pointer"
            >
              <span>السؤال التالي</span>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
