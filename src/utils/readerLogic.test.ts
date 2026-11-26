import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBookProgress,
  collectTreeNodeIds,
  countSectionPatterns,
  countTreeNodes,
  findTreeNode,
  formatArabicQuestionCount,
  normalizeArabic,
  resolveSegmentLayer,
  searchBookSections,
  splitInlineTokens,
  splitParagraphLayers,
} from './readerLogic';
import { ALL_TREES, BOOK_SECTIONS } from '../data';

test('normalizeArabic strips diacritics and unifies hamza/taa marbuta', () => {
  assert.equal(normalizeArabic('الإِيمَانُ وَالإِسْلَامُ'), 'الايمان والاسلام');
  assert.equal(normalizeArabic('زكاةُ الحُلِيِّ'), 'زكاه الحلي');
});

test('BOOK_SECTIONS covers all 24 units spanning pages 2 to 309', () => {
  assert.equal(BOOK_SECTIONS.length, 24);
  assert.equal(BOOK_SECTIONS[0].pageStart, 2);
  assert.equal(BOOK_SECTIONS[BOOK_SECTIONS.length - 1].pageEnd, 309);
  for (const section of BOOK_SECTIONS) {
    assert.ok(section.paragraphs.length >= 1, `Missing paragraphs in ${section.id}`);
    for (const para of section.paragraphs) {
      assert.ok(para.elements.length >= 2, `Missing elements in ${para.id}`);
      assert.ok(para.summary.length > 20, `Short summary in ${para.id}`);
      assert.ok(para.segments.length >= 2, `Missing segments in ${para.id}`);
    }
  }
});

test('splitParagraphLayers separates Nawawi matn from Sheikh Yasser hashiyah cleanly', () => {
  for (const section of BOOK_SECTIONS) {
    for (const para of section.paragraphs) {
      const { matnSegments, hashiyahSegments } = splitParagraphLayers(para);
      assert.ok(
        matnSegments.length >= 1,
        `Expected matn segments in ${para.id}`
      );
      assert.ok(
        hashiyahSegments.length >= 1,
        `Expected hashiyah segments in ${para.id}`
      );
      for (const m of matnSegments) {
        assert.equal(resolveSegmentLayer(m), 'matn');
      }
      for (const h of hashiyahSegments) {
        assert.equal(resolveSegmentLayer(h), 'hashiyah');
      }
    }
  }
});

test('splitInlineTokens highlights embedded Quranic verses inside any matn or hashiyah segment', () => {
  const sample = BOOK_SECTIONS[2].paragraphs[2].segments[2]; // bab-01-p3 istidrak citing Surah Al-Takwir
  const tokens = splitInlineTokens(sample);
  const quranTokens = tokens.filter((t) => t.isQuranic);
  assert.ok(quranTokens.length >= 1, 'Expected embedded Quranic verse token');
  assert.equal(quranTokens[0].pattern, 'quran');
});

test('calculateBookProgress tracks page completion accurately', () => {
  const first = calculateBookProgress(BOOK_SECTIONS, BOOK_SECTIONS[0].id);
  const last = calculateBookProgress(
    BOOK_SECTIONS,
    BOOK_SECTIONS[BOOK_SECTIONS.length - 1].id
  );
  assert.equal(first.currentIndex, 1);
  assert.equal(last.currentIndex, 24);
  assert.equal(last.pagePercent, 100);
});

test('searchBookSections locates Sheikh Yasser critiques and Arabic terms without diacritics', () => {
  const istidrakHits = searchBookSections(BOOK_SECTIONS, 'الكسب', ['istidrak']);
  assert.ok(istidrakHits.length >= 1);
  assert.equal(istidrakHits[0].sectionId, 'bab-01');

  const goldHits = searchBookSections(BOOK_SECTIONS, 'عيار ٢١');
  assert.ok(goldHits.length >= 1);
  assert.equal(goldHits[0].sectionId, 'bab-08');
});

test('countSectionPatterns counts semantic segments accurately', () => {
  const counts = countSectionPatterns(BOOK_SECTIONS[2]); // bab-01
  assert.ok(counts.hadith >= 1);
  assert.ok(counts.istidrak >= 1);
  assert.ok(counts.khilaf >= 1);
});

test('ALL_TREES link to valid section IDs and have discoverable nodes', () => {
  const sectionIds = new Set(BOOK_SECTIONS.map((s) => s.id));
  assert.equal(ALL_TREES.length, 8);
  for (const tree of ALL_TREES) {
    assert.ok(sectionIds.has(tree.sectionId), `Invalid tree sectionId: ${tree.sectionId}`);
    const ids = collectTreeNodeIds(tree.root);
    assert.equal(ids.length, countTreeNodes(tree.root));
    assert.ok(ids.length >= 4);
    const lastNode = findTreeNode(tree.root, ids[ids.length - 1]);
    assert.ok(lastNode !== null);
  }
});

test('formatArabicQuestionCount formats singular, dual, 3-10, and 11+ properly', () => {
  assert.equal(formatArabicQuestionCount(1), 'سؤال واحد');
  assert.equal(formatArabicQuestionCount(2), 'سؤالان');
  assert.equal(formatArabicQuestionCount(5), '5 أسئلة');
  assert.equal(formatArabicQuestionCount(24), '24 سؤالاً');
});
