import { useEffect, useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { BookIndexView } from './components/BookIndexView';
import { BookReadingView } from './components/BookReadingView';
import { StudyReaderView } from './components/StudyReaderView';
import { KnowledgeTreeView } from './components/KnowledgeTreeView';
import { QuestionBankMode, QuestionBankView } from './components/QuestionBankView';
import { PdfReferenceModal } from './components/PdfReferenceModal';
import { ALL_QUESTIONS, ALL_TREES, BOOK_SECTIONS } from './data';
import { AppView, PatternType, UserStudyProgress } from './data/types';
import { parseSavedProgress, toggleIdInList } from './utils/questionBank';

const PROGRESS_STORAGE_KEY = 'iman_study_progress_v1';
const THEME_STORAGE_KEY = 'iman_study_theme_v1';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('index');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    const saved = parseSavedProgress(
      typeof window !== 'undefined' ? window.localStorage.getItem(PROGRESS_STORAGE_KEY) : null,
      BOOK_SECTIONS[0].id
    );
    return saved.lastSectionId;
  });

  const [progress, setProgress] = useState<UserStudyProgress>(() =>
    parseSavedProgress(
      typeof window !== 'undefined' ? window.localStorage.getItem(PROGRESS_STORAGE_KEY) : null,
      BOOK_SECTIONS[0].id
    )
  );

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activePatterns, setActivePatterns] = useState<PatternType[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string>(ALL_TREES[0].id);
  const [questionBankMode, setQuestionBankMode] = useState<QuestionBankMode>('study');
  const [questionSectionFilter, setQuestionSectionFilter] = useState<string>('all');
  const [pdfModalPage, setPdfModalPage] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage quota errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setProgress((prev) => ({ ...prev, lastSectionId: sectionId }));
  };

  const handleOpenBookReading = (sectionId: string) => {
    handleSelectSection(sectionId);
    setActiveView('reading');
  };

  const handleOpenSectionReader = (sectionId: string, patternFilter?: PatternType) => {
    handleSelectSection(sectionId);
    setActivePatterns(patternFilter ? [patternFilter] : []);
    setActiveView('reader');
  };

  const handleOpenSectionQuestions = (sectionId: string) => {
    setQuestionSectionFilter(sectionId);
    setQuestionBankMode('study');
    setActiveView('bank');
  };

  const handleStartComprehensiveExam = () => {
    setQuestionSectionFilter('all');
    setQuestionBankMode('exam');
    setActiveView('bank');
  };

  const handleOpenTreesForSection = (sectionId: string) => {
    const match = ALL_TREES.find((t) => t.sectionId === sectionId);
    if (match) setSelectedTreeId(match.id);
    setActiveView('trees');
  };

  const handleToggleSectionComplete = (sectionId: string) => {
    setProgress((prev) => ({
      ...prev,
      completedSectionIds: toggleIdInList(prev.completedSectionIds, sectionId),
    }));
  };

  const handleToggleBookmark = (questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      bookmarkedQuestionIds: toggleIdInList(prev.bookmarkedQuestionIds, questionId),
    }));
  };

  const handleRecordWrongAnswers = (newWrongIds: string[]) => {
    if (newWrongIds.length === 0) return;
    setProgress((prev) => ({
      ...prev,
      wrongQuestionIds: Array.from(new Set([...prev.wrongQuestionIds, ...newWrongIds])),
    }));
  };

  const handleTogglePattern = (pattern: PatternType) => {
    setActivePatterns((prev) =>
      prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
    );
  };

  const currentSection =
    BOOK_SECTIONS.find((s) => s.id === selectedSectionId) ?? BOOK_SECTIONS[0];

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderBar
        activeView={activeView}
        onNavigate={setActiveView}
        onStartComprehensiveExam={handleStartComprehensiveExam}
      />

      <WorkspaceToolbar
        sections={BOOK_SECTIONS}
        selectedSectionId={selectedSectionId}
        onSelectSection={(secId) => {
          handleSelectSection(secId);
          if (activeView === 'index') {
            setActiveView('reader');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeView === 'index') {
            setActiveView('reader');
          }
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenPdfAtCurrentSection={() => setPdfModalPage(currentSection.pageStart)}
      />

      <main className="flex-1">
        {activeView === 'index' && (
          <BookIndexView
            sections={BOOK_SECTIONS}
            questions={ALL_QUESTIONS}
            treesCount={ALL_TREES.length}
            completedSectionIds={progress.completedSectionIds}
            lastSectionId={progress.lastSectionId}
            onOpenBookReading={handleOpenBookReading}
            onOpenSectionReader={handleOpenSectionReader}
            onOpenSectionQuestions={handleOpenSectionQuestions}
            onOpenTrees={() => setActiveView('trees')}
            onToggleSectionComplete={handleToggleSectionComplete}
          />
        )}

        {activeView === 'reading' && (
          <BookReadingView
            sections={BOOK_SECTIONS}
            activeSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            searchQuery={searchQuery}
            completedSectionIds={progress.completedSectionIds}
            onToggleSectionComplete={handleToggleSectionComplete}
            onOpenPdfAtPage={(page) => setPdfModalPage(page)}
            onSwitchToStudyMode={(secId) => handleOpenSectionReader(secId)}
          />
        )}

        {activeView === 'reader' && (
          <StudyReaderView
            sections={BOOK_SECTIONS}
            questions={ALL_QUESTIONS}
            activeSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            activePatterns={activePatterns}
            onTogglePattern={handleTogglePattern}
            onResetPatterns={() => setActivePatterns([])}
            searchQuery={searchQuery}
            completedSectionIds={progress.completedSectionIds}
            onToggleSectionComplete={handleToggleSectionComplete}
            onOpenPdfAtPage={(page) => setPdfModalPage(page)}
            onOpenSectionQuestions={handleOpenSectionQuestions}
            onOpenTreesForSection={handleOpenTreesForSection}
            onOpenBookReading={handleOpenBookReading}
          />
        )}

        {activeView === 'trees' && (
          <KnowledgeTreeView
            trees={ALL_TREES}
            selectedTreeId={selectedTreeId}
            onSelectTree={setSelectedTreeId}
            onOpenSectionReader={(secId) => handleOpenSectionReader(secId)}
            onOpenSectionQuestions={handleOpenSectionQuestions}
            onOpenPdfAtPage={(page) => setPdfModalPage(page)}
          />
        )}

        {activeView === 'bank' && (
          <QuestionBankView
            sections={BOOK_SECTIONS}
            questions={ALL_QUESTIONS}
            mode={questionBankMode}
            onModeChange={setQuestionBankMode}
            sectionFilter={questionSectionFilter}
            onSectionFilterChange={setQuestionSectionFilter}
            searchQuery={searchQuery}
            bookmarkedIds={progress.bookmarkedQuestionIds}
            wrongIds={progress.wrongQuestionIds}
            onToggleBookmark={handleToggleBookmark}
            onRecordWrongAnswers={handleRecordWrongAnswers}
            onOpenPdfAtPage={(page) => setPdfModalPage(page)}
            onOpenSectionReader={(secId) => handleOpenSectionReader(secId)}
          />
        )}
      </main>

      <footer className="border-t border-[#dfd5c0] dark:border-[#332c24] bg-[#fcf9f1] dark:bg-[#1a1612] mt-12 font-heading-tajawal">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#655b4e] dark:text-[#b0a491]">
          <span>
            المُعين في دراسة كتاب الإيمان — صحيح مسلم بشرح النووي وحواشي فضيلة الشيخ ياسر برهامي
          </span>
          <button
            type="button"
            onClick={() => setPdfModalPage(1)}
            className="text-[#1b4d3e] dark:text-[#7ec9ad] font-bold hover:underline cursor-pointer"
          >
            استعراض النسخة المصورة الكاملة (٣٠٩ صفحات)
          </button>
        </div>
      </footer>

      <PdfReferenceModal
        isOpen={pdfModalPage !== null}
        initialPage={pdfModalPage ?? 1}
        onClose={() => setPdfModalPage(null)}
      />
    </div>
  );
}
