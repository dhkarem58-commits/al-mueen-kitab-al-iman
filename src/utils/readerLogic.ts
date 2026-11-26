import {
  BookSection,
  ContentLayer,
  PATTERN_ORDER,
  PatternType,
  StudyParagraph,
  TextSegment,
  TreeNode,
} from '../data/types';

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

export function normalizeArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS_REGEX, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
    .toLowerCase();
}

export function resolveSegmentLayer(segment: TextSegment): ContentLayer {
  if (segment.layer) {
    return segment.layer;
  }
  return segment.type === 'yasser' || segment.type === 'istidrak'
    ? 'hashiyah'
    : 'matn';
}

export interface LayeredParagraphSegments {
  matnSegments: TextSegment[];
  hashiyahSegments: TextSegment[];
}

export function splitParagraphLayers(
  paragraph: StudyParagraph,
  activePatternSet?: Set<PatternType>
): LayeredParagraphSegments {
  const matnSegments: TextSegment[] = [];
  const hashiyahSegments: TextSegment[] = [];
  const filterByPattern = Boolean(activePatternSet && activePatternSet.size > 0);

  for (const seg of paragraph.segments) {
    if (filterByPattern && !activePatternSet!.has(seg.type)) {
      continue;
    }
    const layer = resolveSegmentLayer(seg);
    if (layer === 'hashiyah') {
      hashiyahSegments.push(seg);
    } else {
      matnSegments.push(seg);
    }
  }

  return { matnSegments, hashiyahSegments };
}

export interface InlineToken {
  text: string;
  pattern: PatternType;
  isQuranic: boolean;
}

/**
 * Splits a segment into fine-grained tokens so any embedded Quranic verse
 * enclosed in ﴿...﴾ receives KFGQPC Uthmanic Script HAFS & Quranic coloring
 * regardless of whether it appears inside Nawawi's Matn or Sheikh Yasser's Hashiyah.
 */
export function splitInlineTokens(segment: TextSegment): InlineToken[] {
  if (segment.type === 'quran') {
    return [{ text: segment.text, pattern: 'quran', isQuranic: true }];
  }

  const parts = segment.text.split(/(﴿[^﴾]+﴾)/g);
  const tokens: InlineToken[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('﴿') && part.endsWith('﴾')) {
      tokens.push({ text: part, pattern: 'quran', isQuranic: true });
    } else {
      tokens.push({ text: part, pattern: segment.type, isQuranic: false });
    }
  }

  return tokens.length > 0
    ? tokens
    : [{ text: segment.text, pattern: segment.type, isQuranic: false }];
}

export function calculateBookProgress(
  sections: BookSection[],
  activeSectionId: string
): { currentIndex: number; totalSections: number; pagePercent: number; currentPageEnd: number } {
  const idx = Math.max(
    0,
    sections.findIndex((s) => s.id === activeSectionId)
  );
  const current = sections[idx] ?? sections[0];
  const totalPages = sections[sections.length - 1]?.pageEnd ?? 309;
  const pagePercent = Math.min(100, Math.max(1, Math.round((current.pageEnd / totalPages) * 100)));
  return {
    currentIndex: idx + 1,
    totalSections: sections.length,
    pagePercent,
    currentPageEnd: current.pageEnd,
  };
}

export interface SearchParagraphHit {
  sectionId: string;
  sectionTitle: string;
  paragraph: StudyParagraph;
  matchedPatterns: PatternType[];
}

export function searchBookSections(
  sections: BookSection[],
  query: string,
  activePatterns?: PatternType[]
): SearchParagraphHit[] {
  const normQuery = normalizeArabic(query);
  const patternSet =
    activePatterns && activePatterns.length > 0 ? new Set(activePatterns) : null;

  const hits: SearchParagraphHit[] = [];

  for (const section of sections) {
    for (const paragraph of section.paragraphs) {
      const relevantSegments = patternSet
        ? paragraph.segments.filter((seg) => patternSet.has(seg.type))
        : paragraph.segments;

      if (patternSet && relevantSegments.length === 0) {
        continue;
      }

      if (!normQuery) {
        hits.push({
          sectionId: section.id,
          sectionTitle: section.title,
          paragraph,
          matchedPatterns: Array.from(new Set(relevantSegments.map((s) => s.type))),
        });
        continue;
      }

      const haystack = normalizeArabic(
        [
          section.title,
          paragraph.title,
          paragraph.summary,
          ...paragraph.elements,
          ...relevantSegments.map((s) => `${s.text} ${s.ref ?? ''}`),
        ].join(' ')
      );

      if (haystack.includes(normQuery)) {
        hits.push({
          sectionId: section.id,
          sectionTitle: section.title,
          paragraph,
          matchedPatterns: Array.from(new Set(relevantSegments.map((s) => s.type))),
        });
      }
    }
  }

  return hits;
}

export function countSectionPatterns(
  section: BookSection
): Record<PatternType, number> {
  const counts = Object.fromEntries(
    PATTERN_ORDER.map((pattern) => [pattern, 0])
  ) as Record<PatternType, number>;

  for (const paragraph of section.paragraphs) {
    for (const segment of paragraph.segments) {
      counts[segment.type] += 1;
    }
  }

  return counts;
}

export function collectTreeNodeIds(node: TreeNode): string[] {
  const ids = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectTreeNodeIds(child));
    }
  }
  return ids;
}

export function findTreeNode(node: TreeNode, targetId: string): TreeNode | null {
  if (node.id === targetId) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findTreeNode(child, targetId);
    if (found) return found;
  }
  return null;
}

export function countTreeNodes(node: TreeNode): number {
  let total = 1;
  if (node.children) {
    for (const child of node.children) {
      total += countTreeNodes(child);
    }
  }
  return total;
}

export function formatArabicQuestionCount(count: number): string {
  if (count === 0) return 'لا توجد أسئلة';
  if (count === 1) return 'سؤال واحد';
  if (count === 2) return 'سؤالان';
  if (count >= 3 && count <= 10) return `${count} أسئلة`;
  return `${count} سؤالاً`;
}
