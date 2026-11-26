import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BOOK_SECTIONS } from '../data';
import {
  buildBookReadingComposition,
  clampPageNumber,
  findSectionForPage,
  formatFootnoteMarker,
  fromArabicIndicNumber,
  getBookReadingInkClass,
  getHashiyahRoleLabel,
  getReadingTextSizeClass,
  getVerbatimTokenClass,
  isIstidrakFootnote,
  searchVerbatimPages,
  toArabicIndicNumber,
  tokenizeVerbatimText,
  VerbatimBookPage,
} from './bookReadingLogic';

const PDF_PAGES_JSON_PATH = path.resolve(process.cwd(), 'public/data/pdf_book_pages.json');
const PDF_PAGES: VerbatimBookPage[] = JSON.parse(fs.readFileSync(PDF_PAGES_JSON_PATH, 'utf-8'));

test('verbatim PDF dataset contains all 309 pages and exact PDF opening footnotes on page 2', () => {
  assert.equal(PDF_PAGES.length, 309);
  assert.equal(PDF_PAGES[0].page, 1);
  assert.equal(PDF_PAGES[308].page, 309);

  // Page 2 must match the user-specified PDF lower footnotes verbatim
  const page2 = PDF_PAGES[1];
  assert.equal(page2.page, 2);
  assert.ok(page2.body.length >= 4, 'Page 2 should contain verbatim book text blocks');
  assert.equal(page2.footnotes.length, 3, 'Page 2 should contain 3 verbatim footnotes');

  assert.equal(page2.footnotes[0].marker, '(١)');
  assert.ok(
    page2.footnotes[0].text.includes('تهذيب الأسماء واللغات'),
    `Expected first footnote to start with تهذيب الأسماء واللغات, got: ${page2.footnotes[0].text}`
  );

  assert.equal(page2.footnotes[1].marker, '(٢)');
  assert.ok(
    page2.footnotes[1].text.includes('نيسابور') && page2.footnotes[1].text.includes('بلاد'),
    `Expected second footnote to contain نيسابور : بلاد..., got: ${page2.footnotes[1].text}`
  );

  assert.equal(page2.footnotes[2].marker, '(٣)');
  assert.ok(
    page2.footnotes[2].text.includes('إبراهيم بن محمد بن سفيان'),
    `Expected third footnote to mention إبراهيم بن محمد بن سفيان, got: ${page2.footnotes[2].text}`
  );

  // Verify no unmapped glyph placeholders leaked into any of the 309 pages
  for (const pg of PDF_PAGES) {
    for (const blk of pg.body) {
      assert.ok(!blk.text.includes('[?'), `Unmapped glyph placeholder in body p.${pg.page}`);
    }
    for (const fn of pg.footnotes) {
      assert.ok(!fn.text.includes('[?'), `Unmapped glyph placeholder in footnote p.${pg.page}`);
    }
  }
});

test('toArabicIndicNumber, fromArabicIndicNumber, and clampPageNumber handle numerals cleanly', () => {
  assert.equal(toArabicIndicNumber(1), '١');
  assert.equal(toArabicIndicNumber(14), '١٤');
  assert.equal(toArabicIndicNumber(309), '٣٠٩');
  assert.equal(formatFootnoteMarker(2), '(٢)');
  assert.equal(fromArabicIndicNumber('١٩'), 19);
  assert.equal(fromArabicIndicNumber('309'), 309);
  assert.equal(fromArabicIndicNumber('abc'), null);
  assert.equal(clampPageNumber(0), 1);
  assert.equal(clampPageNumber(999), 309);
  assert.equal(clampPageNumber(19), 19);
});

test('findSectionForPage maps PDF pages accurately to the 24 BOOK_SECTIONS', () => {
  assert.equal(findSectionForPage(BOOK_SECTIONS, 2).id, 'intro-muslim');
  assert.equal(findSectionForPage(BOOK_SECTIONS, 7).id, 'intro-nawawi');
  assert.equal(findSectionForPage(BOOK_SECTIONS, 14).id, 'bab-01');
  assert.equal(findSectionForPage(BOOK_SECTIONS, 309).id, 'bab-22');
});

test('tokenizeVerbatimText is non-destructive and detects Quran, Hadith, footnote refs, and citations', () => {
  const sample =
    'قوله تعالى: ﴿إن الدين عند الله الإسلام﴾ وحديث «ثم افعل ذلك في صلاتك كلها»(١) [رواه البخاري (٣٠٤)] ﷺ.';
  const markers = new Set(['(١)']);
  const tokens = tokenizeVerbatimText(sample, 'matn', markers);

  // Non-destructive round-trip: rejoining every token must reproduce the exact PDF string
  assert.equal(
    tokens.map((t) => t.text).join(''),
    sample
  );

  assert.ok(tokens.some((t) => t.kind === 'quran' && t.text.includes('إن الدين')));
  assert.ok(tokens.some((t) => t.kind === 'hadith' && t.text.includes('صلاتك')));
  assert.ok(tokens.some((t) => t.kind === 'footnoteRef' && t.footnoteMarker === '(١)'));
  assert.ok(tokens.some((t) => t.kind === 'citation' && t.text.includes('رواه البخاري')));
  assert.ok(tokens.some((t) => t.kind === 'honorific' && t.text === 'ﷺ'));
});

test('searchVerbatimPages finds exact matches in verbatim PDF lower footnotes', () => {
  const hits1 = searchVerbatimPages(PDF_PAGES, BOOK_SECTIONS, 'تهذيب الأسماء واللغات');
  assert.ok(hits1.some((h) => h.page === 2));

  const hits2 = searchVerbatimPages(PDF_PAGES, BOOK_SECTIONS, 'نيسابور');
  assert.ok(hits2.some((h) => h.page === 2));
});

test('getVerbatimTokenClass and isIstidrakFootnote differentiate upper matn and lower hashiyah colors', () => {
  assert.equal(isIstidrakFootnote('والصحيح أن يقال ولا لأن التصديق بالقلب'), true);
  assert.equal(isIstidrakFootnote('تهذيب الأسماء واللغات (٢/٨٩:٩٢).'), false);

  const semanticMatn = getVerbatimTokenClass('matn', 'normal', 'semantic', false);
  const semanticFn = getVerbatimTokenClass('hashiyah', 'normal', 'semantic', false);
  const semanticIstidrak = getVerbatimTokenClass('hashiyah', 'normal', 'semantic', true);
  assert.notEqual(semanticMatn, semanticFn);
  assert.notEqual(semanticFn, semanticIstidrak);

  const bicolorMatn = getVerbatimTokenClass('matn', 'normal', 'bicolor');
  const bicolorFn = getVerbatimTokenClass('hashiyah', 'normal', 'bicolor');
  assert.notEqual(bicolorMatn, bicolorFn);
});

test('legacy buildBookReadingComposition and ink helpers remain intact', () => {
  const comp = buildBookReadingComposition(BOOK_SECTIONS[0]);
  assert.ok(comp.matnBlocks.length >= 1);
  assert.ok(comp.footnotes.length >= 1);
  assert.notEqual(
    getBookReadingInkClass('matn', 'hadith', 'semantic'),
    getBookReadingInkClass('hashiyah', 'istidrak', 'semantic')
  );
  assert.equal(getHashiyahRoleLabel('istidrak'), 'استدراك الشيخ ياسر');
  assert.notEqual(getReadingTextSizeClass('normal').matn, getReadingTextSizeClass('xlarge').matn);
});
