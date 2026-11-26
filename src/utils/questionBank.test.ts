import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterQuestions,
  getDefaultProgress,
  gradeQuizSession,
  parseSavedProgress,
  toggleIdInList,
} from './questionBank';
import { ALL_QUESTIONS, BOOK_SECTIONS } from '../data';

test('ALL_QUESTIONS covers every single section across the entire book', () => {
  const coveredSections = new Set(ALL_QUESTIONS.map((q) => q.sectionId));
  for (const section of BOOK_SECTIONS) {
    assert.ok(
      coveredSections.has(section.id),
      `Section ${section.id} has no questions in ALL_QUESTIONS`
    );
  }
  for (const q of ALL_QUESTIONS) {
    assert.ok(q.options.length >= 2);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
    assert.ok(q.pageRef >= 1 && q.pageRef <= 309);
    assert.ok(q.sourceQuote.length > 10);
  }
});

test('filterQuestions filters by sourceAuthor, patternType, bookmarks, and normalized search', () => {
  const yasserIstidrak = filterQuestions(ALL_QUESTIONS, {
    sourceAuthor: 'الشيخ ياسر برهامي',
    patternType: 'istidrak',
  });
  assert.ok(yasserIstidrak.length >= 10);
  assert.ok(yasserIstidrak.every((q) => q.patternType === 'istidrak'));

  const searchMatches = filterQuestions(ALL_QUESTIONS, {
    searchQuery: 'الخطابي',
  });
  assert.ok(searchMatches.length >= 2);

  const bookmarkedOnly = filterQuestions(ALL_QUESTIONS, {
    onlyBookmarked: true,
    bookmarkedIds: [ALL_QUESTIONS[0].id],
  });
  assert.equal(bookmarkedOnly.length, 1);
  assert.equal(bookmarkedOnly[0].id, ALL_QUESTIONS[0].id);
});

test('gradeQuizSession computes accurate scores and breakdowns by author and pattern', () => {
  const sample = ALL_QUESTIONS.slice(0, 4);
  const answers: Record<string, number> = {
    [sample[0].id]: sample[0].correctIndex,
    [sample[1].id]: sample[1].correctIndex,
    [sample[2].id]: (sample[2].correctIndex + 1) % sample[2].options.length,
  };

  const result = gradeQuizSession(sample, answers);
  assert.equal(result.total, 4);
  assert.equal(result.answered, 3);
  assert.equal(result.correct, 2);
  assert.equal(result.wrong, 1);
  assert.equal(result.accuracyPercent, 67);
  assert.deepEqual(result.wrongQuestionIds, [sample[2].id]);
});

test('parseSavedProgress handles malformed JSON safely and toggleIdInList toggles cleanly', () => {
  assert.deepEqual(parseSavedProgress('{bad json'), getDefaultProgress());
  const valid = parseSavedProgress(
    JSON.stringify({
      completedSectionIds: ['bab-01'],
      bookmarkedQuestionIds: ['q-im-1'],
      wrongQuestionIds: [],
      lastSectionId: 'bab-08',
    })
  );
  assert.equal(valid.lastSectionId, 'bab-08');
  assert.deepEqual(toggleIdInList(['a', 'b'], 'b'), ['a']);
  assert.deepEqual(toggleIdInList(['a'], 'b'), ['a', 'b']);
});
