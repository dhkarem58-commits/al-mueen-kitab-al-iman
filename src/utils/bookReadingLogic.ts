import { BookSection, ContentLayer, PatternType, TextSegment } from '../data/types';
import { normalizeArabic, splitParagraphLayers } from './readerLogic';

export type ReadingColorScheme = 'semantic' | 'bicolor' | 'print';
export type ReadingFontScale = 'normal' | 'large' | 'xlarge';

export interface VerbatimBodyBlock {
  kind: 'heading' | 'bismillah' | 'paragraph';
  text: string;
}

export interface VerbatimFootnote {
  marker: string | null;
  text: string;
}

export interface VerbatimBookPage {
  page: number;
  hasContinuationFromPrev?: boolean;
  body: VerbatimBodyBlock[];
  footnotes: VerbatimFootnote[];
}

export type VerbatimTokenKind =
  | 'normal'
  | 'quran'
  | 'hadith'
  | 'footnoteRef'
  | 'label'
  | 'citation'
  | 'honorific'
  | 'istidrak';

export interface VerbatimInlineToken {
  text: string;
  kind: VerbatimTokenKind;
  footnoteMarker?: string;
}

export interface VerbatimSearchHit {
  page: number;
  sectionId: string;
  sectionOrderLabel: string;
  sectionTitle: string;
  layer: ContentLayer;
  snippet: string;
}

export interface BookMatnRun {
  id: string;
  paragraphId: string;
  type: PatternType;
  text: string;
  ref?: string;
  linkedFootnotes: Array<{
    footnoteId: string;
    marker: string;
  }>;
}

export interface BookMatnBlock {
  paragraphId: string;
  rubricTitle: string;
  pageStart: number;
  pageEnd: number;
  runs: BookMatnRun[];
}

export interface BookFootnoteEntry {
  id: string;
  index: number;
  marker: string;
  paragraphId: string;
  paragraphTitle: string;
  type: PatternType;
  ref?: string;
  text: string;
  anchorRunId: string;
}

export interface BookReadingComposition {
  sectionId: string;
  orderLabel: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  matnBlocks: BookMatnBlock[];
  footnotes: BookFootnoteEntry[];
}

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicIndicNumber(num: number): string {
  const safe = Math.max(0, Math.floor(num));
  return String(safe)
    .split('')
    .map((ch) => ARABIC_INDIC_DIGITS[Number(ch)] ?? ch)
    .join('');
}

export function fromArabicIndicNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const ascii = trimmed.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
  if (!/^\d+$/.test(ascii)) return null;
  const parsed = Number.parseInt(ascii, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatFootnoteMarker(index: number): string {
  return `(${toArabicIndicNumber(index)})`;
}

export function clampPageNumber(page: number, totalPages = 309): number {
  if (!Number.isFinite(page)) return 2;
  return Math.max(1, Math.min(totalPages, Math.floor(page)));
}

/**
 * Maps a PDF page number (1..309) to its corresponding BookSection.
 */
export function findSectionForPage(sections: BookSection[], page: number): BookSection {
  if (sections.length === 0) {
    throw new Error('sections must not be empty');
  }
  // Prefer the last section whose start <= page <= end (handles shared boundary pages accurately)
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    if (page >= sec.pageStart && page <= sec.pageEnd) {
      return sec;
    }
  }
  if (page < sections[0].pageStart) return sections[0];
  return sections[sections.length - 1];
}

/**
 * Classifies whether a verbatim footnote contains Sheikh Yasser's doctrinal/scholarly
 * correction (استدراك/تحقيق) vs general commentary/citation (حاشية وتعليق).
 */
export function isIstidrakFootnote(text: string): boolean {
  const norm = normalizeArabic(text);
  return /(والصحيح|هذا خطا|وفيه نظر|غير صحيح|مذهب اهل السنه|مذهب الاشاعره|تاويل باطل|لا يصح|وليس كذلك|والراجح|بخلاف|تعقب|استدراك|تنبيه)/.test(
    norm
  );
}

/**
 * Builds an HTML-safe DOM id for a page's footnote marker so upper superscripts
 * and lower footnote items can link bidirectionally.
 */
export function getVerbatimFootnoteDomId(page: number, marker: string | null, index: number): string {
  if (!marker) return `vfn-p${page}-cont-${index}`;
  const num = fromArabicIndicNumber(marker.replace(/[()]/g, ''));
  return `vfn-p${page}-m${num ?? index}`;
}

export function getVerbatimAnchorDomId(page: number, marker: string): string {
  const num = fromArabicIndicNumber(marker.replace(/[()]/g, ''));
  return `vref-p${page}-m${num ?? marker}`;
}

const HONORIFIC_LIST =
  'ﷺ|رضي الله عنهما|رضي الله عنهم|رضي الله عنها|رضي الله عنه|رحمه الله|سبحانه وتعالى|عز وجل|عليه السلام';

const CITATION_REGEX_SOURCE =
  '\\[[^\\]]{2,80}\\]|\\([٠-٩0-9]+\\s*[/:-]\\s*[٠-٩0-9:/-]+\\)';

/**
 * Tokenizes verbatim PDF text into colorable semantic spans WITHOUT modifying
 * or omitting a single character of the original text.
 */
export function tokenizeVerbatimText(
  text: string,
  layer: ContentLayer,
  availableFootnoteMarkers?: ReadonlySet<string>
): VerbatimInlineToken[] {
  if (!text) return [];

  // Build combined tokenizer preserving exact original characters
  const combined = new RegExp(
    [
      '(﴿[^﴾]+﴾)', // 1: Quranic verse in ornate braces
      '(«[^»]{3,}»|"[^"]{6,}")', // 2: Quoted Hadith / report
      '(\\([٠-٩0-9]{1,2}\\))', // 3: Potential footnote marker (١)
      `(${CITATION_REGEX_SOURCE})`, // 4: Volume/page or bracket citation
      `(${HONORIFIC_LIST})`, // 5: Honorific formulas
      '(^|\\n)((?:مسألة|فائدة|تنبيه|قلت|قوله|المعنى|س|ج)\\s*:)', // 6,7: Scholarly cue labels
    ].join('|'),
    'g'
  );

  const tokens: VerbatimInlineToken[] = [];
  let cursor = 0;

  for (const match of text.matchAll(combined)) {
    const idx = match.index ?? 0;
    if (idx > cursor) {
      tokens.push({ text: text.slice(cursor, idx), kind: 'normal' });
    }

    if (match[1]) {
      tokens.push({ text: match[1], kind: 'quran' });
    } else if (match[2]) {
      tokens.push({ text: match[2], kind: 'hadith' });
    } else if (match[3]) {
      const marker = match[3];
      if (layer === 'matn' && availableFootnoteMarkers?.has(marker)) {
        tokens.push({ text: marker, kind: 'footnoteRef', footnoteMarker: marker });
      } else {
        tokens.push({ text: marker, kind: 'citation' });
      }
    } else if (match[4]) {
      tokens.push({ text: match[4], kind: 'citation' });
    } else if (match[5]) {
      tokens.push({ text: match[5], kind: 'honorific' });
    } else if (match[7]) {
      if (match[6]) {
        tokens.push({ text: match[6], kind: 'normal' });
      }
      tokens.push({ text: match[7], kind: 'label' });
    }

    cursor = idx + match[0].length;
  }

  if (cursor < text.length) {
    tokens.push({ text: text.slice(cursor), kind: 'normal' });
  }

  return tokens;
}

/**
 * Returns editorial ink & subtle tint classes for verbatim PDF text tokens
 * across both the upper book text (المتن والشرح) and lower footnote (الحاشية).
 */
export function getVerbatimTokenClass(
  layer: ContentLayer,
  kind: VerbatimTokenKind,
  scheme: ReadingColorScheme,
  isIstidrakContext = false
): string {
  if (kind === 'footnoteRef') {
    return 'text-[#9b1c2c] dark:text-[#f87171] font-bold';
  }

  if (scheme === 'print') {
    if (kind === 'quran') return 'text-[#14472d] dark:text-[#96dfc0]';
    if (kind === 'label') return 'text-[#8b2432] dark:text-[#f2a7af] font-bold';
    if (kind === 'honorific') return 'text-[#6e1c28] dark:text-[#e6a4ad]';
    if (kind === 'citation') return 'text-[#5b5042] dark:text-[#b4a795]';
    return layer === 'matn'
      ? 'text-[#1c1610] dark:text-[#eee7d7]'
      : 'text-[#352b21] dark:text-[#d8ccb8]';
  }

  if (scheme === 'bicolor') {
    if (kind === 'quran') {
      return 'text-[#0e5a36] dark:text-[#7ee2ad] bg-[#e9f6ee]/70 dark:bg-[#13291d]/70 px-1 rounded-[3px]';
    }
    if (kind === 'label') {
      return layer === 'matn'
        ? 'text-[#0f2f57] dark:text-[#b8d8fc] font-bold'
        : 'text-[#821826] dark:text-[#f7a8b2] font-bold';
    }
    if (kind === 'honorific') {
      return layer === 'matn'
        ? 'text-[#1f4e87] dark:text-[#86bdf5]'
        : 'text-[#8b3d18] dark:text-[#f2bc8c]';
    }
    if (kind === 'citation') {
      return layer === 'matn'
        ? 'text-[#3c597a] dark:text-[#8faac9]'
        : 'text-[#7c563a] dark:text-[#c7a98d]';
    }
    return layer === 'matn'
      ? 'text-[#163a66] dark:text-[#9ec7f5]'
      : 'text-[#6e2f12] dark:text-[#f0c095]';
  }

  // 'semantic': rich, readable scholarly dual-layer color coding
  if (kind === 'quran') {
    return 'text-[#0f5734] dark:text-[#86e3b3] bg-[#e9f6ee]/80 dark:bg-[#13291d]/80 px-1 rounded-[3px]';
  }
  if (kind === 'hadith') {
    return 'text-[#133d73] dark:text-[#95c4f8] bg-[#ebf2fb]/75 dark:bg-[#122134]/75 px-1 rounded-[3px]';
  }
  if (kind === 'citation') {
    return 'text-[#1b546b] dark:text-[#8ac8e3] font-normal';
  }
  if (kind === 'honorific') {
    return 'text-[#7a2936] dark:text-[#e6a0aa]';
  }
  if (kind === 'label') {
    return 'text-[#821826] dark:text-[#f7a8b2] font-bold';
  }

  if (layer === 'matn') {
    return 'text-[#231b13] dark:text-[#f0e8d8]';
  }

  // Hashiyah base ink: distinguish doctrinal istidrak crimson-umber vs warm amber-sepia commentary
  if (isIstidrakContext) {
    return 'text-[#7a1926] dark:text-[#f4b0b9]';
  }
  return 'text-[#5b380b] dark:text-[#edd09c]';
}

/**
 * Full-text Arabic-normalized search across all 309 verbatim PDF pages
 * (both upper book text and lower footnotes).
 */
export function searchVerbatimPages(
  pages: VerbatimBookPage[],
  sections: BookSection[],
  query: string,
  maxResults = 40
): VerbatimSearchHit[] {
  const normQuery = normalizeArabic(query).trim();
  if (!normQuery) return [];

  const hits: VerbatimSearchHit[] = [];

  for (const pg of pages) {
    const sec = findSectionForPage(sections, pg.page);

    const checkList = (texts: string[], layer: ContentLayer): boolean => {
      for (const raw of texts) {
        if (normalizeArabic(raw).includes(normQuery)) {
          const clean = raw.replace(/\s+/g, ' ').trim();
          const snippet = clean.length > 135 ? `${clean.slice(0, 135)}…` : clean;
          hits.push({
            page: pg.page,
            sectionId: sec.id,
            sectionOrderLabel: sec.orderLabel,
            sectionTitle: sec.title,
            layer,
            snippet,
          });
          return true;
        }
      }
      return false;
    };

    const matchedBody = checkList(
      pg.body.map((b) => b.text),
      'matn'
    );
    if (hits.length >= maxResults) break;

    if (!matchedBody) {
      checkList(
        pg.footnotes.map((f) => (f.marker ? `${f.marker} ${f.text}` : f.text)),
        'hashiyah'
      );
      if (hits.length >= maxResults) break;
    }
  }

  return hits;
}

function findMatchingMatnRunIndex(
  matnSegments: TextSegment[],
  hashiyahSeg: TextSegment
): number {
  if (matnSegments.length === 0) return -1;
  if (hashiyahSeg.footnoteNum) {
    const exact = matnSegments.findIndex(
      (m) => m.footnoteNum && m.footnoteNum.trim() === hashiyahSeg.footnoteNum!.trim()
    );
    if (exact >= 0) return exact;
  }
  return matnSegments.length - 1;
}

/**
 * Legacy helper retained for compatibility with StudyReader metadata composition.
 */
export function buildBookReadingComposition(section: BookSection): BookReadingComposition {
  const matnBlocks: BookMatnBlock[] = [];
  const footnotes: BookFootnoteEntry[] = [];
  let footnoteCounter = 0;

  for (const para of section.paragraphs) {
    const { matnSegments, hashiyahSegments } = splitParagraphLayers(para);

    const runs: BookMatnRun[] = matnSegments.map((seg, segIdx) => ({
      id: `${para.id}-run-${segIdx}`,
      paragraphId: para.id,
      type: seg.type,
      text: seg.text,
      ref: seg.ref,
      linkedFootnotes: [],
    }));

    for (const hSeg of hashiyahSegments) {
      footnoteCounter += 1;
      const marker = formatFootnoteMarker(footnoteCounter);
      const footnoteId = `${section.id}-fn-${footnoteCounter}`;

      const targetIdx = findMatchingMatnRunIndex(matnSegments, hSeg);
      const anchorRun = targetIdx >= 0 ? runs[targetIdx] : undefined;
      const anchorRunId = anchorRun ? anchorRun.id : `${para.id}-anchor`;

      if (anchorRun) {
        anchorRun.linkedFootnotes.push({ footnoteId, marker });
      }

      footnotes.push({
        id: footnoteId,
        index: footnoteCounter,
        marker,
        paragraphId: para.id,
        paragraphTitle: para.title,
        type: hSeg.type,
        ref: hSeg.ref,
        text: hSeg.text,
        anchorRunId,
      });
    }

    if (runs.length > 0) {
      matnBlocks.push({
        paragraphId: para.id,
        rubricTitle: para.title,
        pageStart: para.pageStart,
        pageEnd: para.pageEnd,
        runs,
      });
    }
  }

  return {
    sectionId: section.id,
    orderLabel: section.orderLabel,
    title: section.title,
    pageStart: section.pageStart,
    pageEnd: section.pageEnd,
    matnBlocks,
    footnotes,
  };
}

export function getBookReadingInkClass(
  layer: ContentLayer,
  type: PatternType,
  scheme: ReadingColorScheme
): string {
  if (scheme === 'print') {
    if (layer === 'matn') {
      if (type === 'quran') {
        return 'text-[#14472d] dark:text-[#96dfc0]';
      }
      return 'text-[#1c1610] dark:text-[#eee7d7]';
    }
    return 'text-[#362c22] dark:text-[#d8ccb8]';
  }

  if (scheme === 'bicolor') {
    if (layer === 'matn') {
      if (type === 'quran') {
        return 'text-[#0e5a36] dark:text-[#7ee2ad] bg-[#e9f6ee]/65 dark:bg-[#13291d]/65 px-1 rounded-[3px]';
      }
      return 'text-[#163a66] dark:text-[#9ec7f5]';
    }
    if (type === 'quran') {
      return 'text-[#0e5a36] dark:text-[#7ee2ad] bg-[#e9f6ee]/65 dark:bg-[#13291d]/65 px-1 rounded-[3px]';
    }
    return 'text-[#6e2f12] dark:text-[#f0c095]';
  }

  if (layer === 'matn') {
    switch (type) {
      case 'quran':
        return 'text-[#0f5734] dark:text-[#86e3b3] bg-[#e9f6ee]/75 dark:bg-[#13291d]/75 px-1 rounded-[3px]';
      case 'hadith':
        return 'text-[#133d73] dark:text-[#95c4f8] bg-[#ebf2fb]/75 dark:bg-[#122134]/75 px-1 rounded-[3px]';
      case 'khilaf':
        return 'text-[#55227a] dark:text-[#d9b6f7] bg-[#f4ecf9]/65 dark:bg-[#241630]/65 px-1 rounded-[3px]';
      case 'tarjih':
        return 'text-[#0c5951] dark:text-[#74ded1] bg-[#e9f6f4]/70 dark:bg-[#112826]/70 px-1 rounded-[3px]';
      case 'isnad_lughah':
        return 'text-[#144d6b] dark:text-[#88caeb] bg-[#ebf4f9]/65 dark:bg-[#12242e]/65 px-1 rounded-[3px]';
      case 'nawawi':
      default:
        return 'text-[#292017] dark:text-[#f0e8d8]';
    }
  }

  switch (type) {
    case 'istidrak':
      return 'text-[#821826] dark:text-[#f7a8b2] bg-[#fbeff0]/85 dark:bg-[#2c1519]/80 px-1.5 py-0.5 rounded-[4px]';
    case 'yasser':
      return 'text-[#613c08] dark:text-[#efd092] bg-[#faf3e4]/85 dark:bg-[#282011]/75 px-1.5 py-0.5 rounded-[4px]';
    case 'tarjih':
      return 'text-[#0c5951] dark:text-[#74ded1] bg-[#e9f6f4]/75 dark:bg-[#112826]/75 px-1.5 py-0.5 rounded-[4px]';
    case 'quran':
      return 'text-[#0f5734] dark:text-[#86e3b3] bg-[#e9f6ee]/80 dark:bg-[#13291d]/80 px-1 rounded-[3px]';
    case 'hadith':
      return 'text-[#133d73] dark:text-[#95c4f8] bg-[#ebf2fb]/80 dark:bg-[#122134]/80 px-1 rounded-[3px]';
    case 'khilaf':
      return 'text-[#55227a] dark:text-[#d9b6f7]';
    case 'isnad_lughah':
      return 'text-[#144d6b] dark:text-[#88caeb]';
    case 'nawawi':
    default:
      return 'text-[#3b2f22] dark:text-[#dfd4c1]';
  }
}

export function getHashiyahRoleLabel(type: PatternType): string {
  switch (type) {
    case 'istidrak':
      return 'استدراك الشيخ ياسر';
    case 'yasser':
      return 'تعليق وفائدة';
    case 'tarjih':
      return 'ترجيح وتصويب';
    case 'quran':
      return 'شاهد قرآني';
    case 'hadith':
      return 'شاهد نبوي';
    case 'isnad_lughah':
      return 'إسناد ولغة';
    case 'khilaf':
      return 'تحرير خلاف';
    case 'nawawi':
    default:
      return 'حاشية';
  }
}

export function getReadingTextSizeClass(scale: ReadingFontScale): {
  matn: string;
  hashiyah: string;
} {
  switch (scale) {
    case 'xlarge':
      return {
        matn: 'text-[23px] sm:text-[26px] leading-[2.25]',
        hashiyah: 'text-[19px] sm:text-[21px] leading-[2.05]',
      };
    case 'large':
      return {
        matn: 'text-[21px] sm:text-[24px] leading-[2.2]',
        hashiyah: 'text-[18px] sm:text-[20px] leading-[2]',
      };
    case 'normal':
    default:
      return {
        matn: 'text-[19px] sm:text-[21px] leading-[2.15]',
        hashiyah: 'text-[17px] sm:text-[18.5px] leading-[1.95]',
      };
  }
}
