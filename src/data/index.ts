import { SECTIONS_PART_1 } from './sectionsPart1';
import { SECTIONS_PART_2 } from './sectionsPart2';
import { SECTIONS_PART_3 } from './sectionsPart3';
import { KNOWLEDGE_TREES } from './treesData';
import { QUESTIONS_PART_1 } from './questionsPart1';
import { QUESTIONS_PART_2 } from './questionsPart2';
import { QUESTIONS_PART_3 } from './questionsPart3';
import { BookSection, KnowledgeTreeData, QuestionItem } from './types';

export const BOOK_SECTIONS: BookSection[] = [
  ...SECTIONS_PART_1,
  ...SECTIONS_PART_2,
  ...SECTIONS_PART_3,
];

export const ALL_TREES: KnowledgeTreeData[] = KNOWLEDGE_TREES;

export const ALL_QUESTIONS: QuestionItem[] = [
  ...QUESTIONS_PART_1,
  ...QUESTIONS_PART_2,
  ...QUESTIONS_PART_3,
];

const BASE_URL = import.meta.env?.BASE_URL ?? '/';

export const PDF_ASSET_URL = `${BASE_URL}assets/aistudio/1-____________-1-309_170bf935.pdf`;

export const SHEIKH_YASSER_STUDIO_PHOTO_URL = `${BASE_URL}assets/aistudio/______f4ba4162.jpg`;
export const SHEIKH_YASSER_SEATED_PHOTO_URL = `${BASE_URL}assets/aistudio/images____9882a8a3.jpg`;
export const SAHIH_MUSLIM_COVER_URL = `${BASE_URL}assets/aistudio/____a6472d79.jpg`;
export const MANUSCRIPT_IMAGE_URL =
  `${BASE_URL}assets/aistudio/f7bbbb94-ddd6-400b-ab8a-ade7129d936d-ManuscriptCopyThumbnail_c4ba9c66.jpg`;
