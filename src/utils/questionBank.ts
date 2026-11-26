import {
  PatternType,
  QuestionDifficulty,
  QuestionItem,
  QuestionSource,
  UserStudyProgress,
} from '../data/types';
import { normalizeArabic } from './readerLogic';

export interface QuestionFilterOptions {
  sectionId?: string;
  sourceAuthor?: QuestionSource | 'all';
  patternType?: PatternType | 'all';
  difficulty?: QuestionDifficulty | 'all';
  searchQuery?: string;
  onlyBookmarked?: boolean;
  bookmarkedIds?: string[];
  onlyWrong?: boolean;
  wrongIds?: string[];
}

export function filterQuestions(
  questions: QuestionItem[],
  options: QuestionFilterOptions
): QuestionItem[] {
  const normQuery = options.searchQuery ? normalizeArabic(options.searchQuery) : '';
  const bookmarkSet = options.bookmarkedIds ? new Set(options.bookmarkedIds) : null;
  const wrongSet = options.wrongIds ? new Set(options.wrongIds) : null;

  return questions.filter((q) => {
    if (options.sectionId && options.sectionId !== 'all' && q.sectionId !== options.sectionId) {
      return false;
    }
    if (
      options.sourceAuthor &&
      options.sourceAuthor !== 'all' &&
      q.sourceAuthor !== options.sourceAuthor
    ) {
      return false;
    }
    if (
      options.patternType &&
      options.patternType !== 'all' &&
      q.patternType !== options.patternType
    ) {
      return false;
    }
    if (
      options.difficulty &&
      options.difficulty !== 'all' &&
      q.difficulty !== options.difficulty
    ) {
      return false;
    }
    if (options.onlyBookmarked && (!bookmarkSet || !bookmarkSet.has(q.id))) {
      return false;
    }
    if (options.onlyWrong && (!wrongSet || !wrongSet.has(q.id))) {
      return false;
    }
    if (normQuery) {
      const text = normalizeArabic(
        `${q.question} ${q.options.join(' ')} ${q.sourceQuote} ${q.explanation}`
      );
      if (!text.includes(normQuery)) {
        return false;
      }
    }
    return true;
  });
}

export interface QuizGradeBreakdown {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  accuracyPercent: number;
  wrongQuestionIds: string[];
  bySource: Record<QuestionSource, { total: number; correct: number }>;
  byPattern: Partial<Record<PatternType, { total: number; correct: number }>>;
}

export function gradeQuizSession(
  questions: QuestionItem[],
  answers: Record<string, number>
): QuizGradeBreakdown {
  let answered = 0;
  let correct = 0;
  let wrong = 0;
  const wrongQuestionIds: string[] = [];

  const bySource: Record<QuestionSource, { total: number; correct: number }> = {
    'النووي': { total: 0, correct: 0 },
    'الشيخ ياسر برهامي': { total: 0, correct: 0 },
    'كلاهما': { total: 0, correct: 0 },
  };
  const byPattern: Partial<Record<PatternType, { total: number; correct: number }>> = {};

  for (const q of questions) {
    bySource[q.sourceAuthor].total += 1;
    if (!byPattern[q.patternType]) {
      byPattern[q.patternType] = { total: 0, correct: 0 };
    }
    byPattern[q.patternType]!.total += 1;

    const chosen = answers[q.id];
    if (typeof chosen === 'number') {
      answered += 1;
      if (chosen === q.correctIndex) {
        correct += 1;
        bySource[q.sourceAuthor].correct += 1;
        byPattern[q.patternType]!.correct += 1;
      } else {
        wrong += 1;
        wrongQuestionIds.push(q.id);
      }
    }
  }

  const accuracyPercent =
    answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return {
    total: questions.length,
    answered,
    correct,
    wrong,
    accuracyPercent,
    wrongQuestionIds,
    bySource,
    byPattern,
  };
}

export function getDefaultProgress(defaultSectionId = 'intro-muslim'): UserStudyProgress {
  return {
    completedSectionIds: [],
    bookmarkedQuestionIds: [],
    wrongQuestionIds: [],
    lastSectionId: defaultSectionId,
  };
}

export function parseSavedProgress(
  raw: string | null,
  defaultSectionId = 'intro-muslim'
): UserStudyProgress {
  if (!raw) return getDefaultProgress(defaultSectionId);
  try {
    const parsed = JSON.parse(raw) as Partial<UserStudyProgress>;
    return {
      completedSectionIds: Array.isArray(parsed.completedSectionIds)
        ? parsed.completedSectionIds.filter((v): v is string => typeof v === 'string')
        : [],
      bookmarkedQuestionIds: Array.isArray(parsed.bookmarkedQuestionIds)
        ? parsed.bookmarkedQuestionIds.filter((v): v is string => typeof v === 'string')
        : [],
      wrongQuestionIds: Array.isArray(parsed.wrongQuestionIds)
        ? parsed.wrongQuestionIds.filter((v): v is string => typeof v === 'string')
        : [],
      lastSectionId:
        typeof parsed.lastSectionId === 'string' && parsed.lastSectionId.length > 0
          ? parsed.lastSectionId
          : defaultSectionId,
    };
  } catch {
    return getDefaultProgress(defaultSectionId);
  }
}

export function toggleIdInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
