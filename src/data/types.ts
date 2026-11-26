export type PatternType =
  | 'quran'
  | 'hadith'
  | 'nawawi'
  | 'khilaf'
  | 'tarjih'
  | 'istidrak'
  | 'yasser'
  | 'isnad_lughah';

export type ContentLayer = 'matn' | 'hashiyah';

export interface PatternMeta {
  id: PatternType;
  label: string;
  shortTag: string;
  description: string;
  chipClass: string;
  segmentClass: string;
  inlineWordClass: string;
  dotColorClass: string;
}

export const PATTERN_ORDER: PatternType[] = [
  'quran',
  'hadith',
  'nawawi',
  'khilaf',
  'tarjih',
  'istidrak',
  'yasser',
  'isnad_lughah',
];

export const PATTERN_META: Record<PatternType, PatternMeta> = {
  quran: {
    id: 'quran',
    label: 'الآيات القرآنية',
    shortTag: 'آية',
    description: 'الآيات الكريمة المستشهد بها في المتن أو الشرح أو الحاشية',
    chipClass:
      'bg-[#EEF5EF] text-[#14472D] border-[#BBD6C1] dark:bg-[#13261B] dark:text-[#A9DEC0] dark:border-[#245238]',
    segmentClass:
      'bg-[#F1F7F2] text-[#143D28] border-[#C5DEC9] dark:bg-[#122219] dark:text-[#CBEBD7] dark:border-[#254B35]',
    inlineWordClass:
      'bg-[#E6F2E9] text-[#0F4529] decoration-[#2E7D54]/50 dark:bg-[#162C20] dark:text-[#A9DEC0]',
    dotColorClass: 'text-[#1B603D] dark:text-[#78C99D]',
  },
  hadith: {
    id: 'hadith',
    label: 'الأحاديث والآثار',
    shortTag: 'حديث',
    description: 'أحاديث صحيح مسلم والشواهد النبوية وآثار الصحابة والسلف',
    chipClass:
      'bg-[#EDF3F9] text-[#183C63] border-[#BDCEE2] dark:bg-[#131F2E] dark:text-[#AACBF0] dark:border-[#284466]',
    segmentClass:
      'bg-[#F1F6FB] text-[#163659] border-[#C7D7E8] dark:bg-[#121D2B] dark:text-[#C4DCF7] dark:border-[#264161]',
    inlineWordClass:
      'bg-[#E7F0FA] text-[#133860] decoration-[#2B64A1]/45 dark:bg-[#16273A] dark:text-[#AACBF0]',
    dotColorClass: 'text-[#1E4F82] dark:text-[#84B6EA]',
  },
  nawawi: {
    id: 'nawawi',
    label: 'شرح النووي',
    shortTag: 'النووي',
    description: 'كلام الإمام النووي الأساسي في شرح المتن ومسائل الباب',
    chipClass:
      'bg-[#F5F1E8] text-[#2F271E] border-[#D8CEBC] dark:bg-[#26211B] dark:text-[#EAE2D3] dark:border-[#473E34]',
    segmentClass:
      'bg-[#FAF6EE] text-[#272017] border-[#DFD5C3] dark:bg-[#211D18] dark:text-[#EBE4D5] dark:border-[#3D352C]',
    inlineWordClass:
      'bg-[#F3ECE0] text-[#282118] decoration-[#7C6F5C]/40 dark:bg-[#2A241E] dark:text-[#EAE2D3]',
    dotColorClass: 'text-[#5A4D3E] dark:text-[#CBBFA8]',
  },
  khilaf: {
    id: 'khilaf',
    label: 'الأقوال والخلاف',
    shortTag: 'خلاف',
    description: 'حكاية المذاهب والأقوال الفقهية والعقدية ومواطن النزاع',
    chipClass:
      'bg-[#F4EFF8] text-[#452463] border-[#D5C5E4] dark:bg-[#23192D] dark:text-[#D7BCEF] dark:border-[#4A3261]',
    segmentClass:
      'bg-[#F7F2FA] text-[#3F205A] border-[#DCD0E8] dark:bg-[#1F1729] dark:text-[#DFC9F2] dark:border-[#442F59]',
    inlineWordClass:
      'bg-[#EFE7F6] text-[#42215E] decoration-[#74489D]/45 dark:bg-[#2A1E36] dark:text-[#D7BCEF]',
    dotColorClass: 'text-[#5A3180] dark:text-[#C59EE8]',
  },
  tarjih: {
    id: 'tarjih',
    label: 'الترجيحات',
    shortTag: 'ترجيح',
    description: 'القول الراجح والمختار عند النووي أو الشيخ ياسر مع التعليل',
    chipClass:
      'bg-[#EBF5F3] text-[#114A44] border-[#B6DAD4] dark:bg-[#112624] dark:text-[#9FDED6] dark:border-[#24524C]',
    segmentClass:
      'bg-[#EFF7F5] text-[#10423D] border-[#C1E0DA] dark:bg-[#102220] dark:text-[#BCEBE5] dark:border-[#224A45]',
    inlineWordClass:
      'bg-[#E3F2EF] text-[#0E4640] decoration-[#1F756B]/45 dark:bg-[#152E2B] dark:text-[#9FDED6]',
    dotColorClass: 'text-[#156159] dark:text-[#74CFC4]',
  },
  istidrak: {
    id: 'istidrak',
    label: 'استدراكات الشيخ ياسر',
    shortTag: 'استدراك الشيخ ياسر',
    description: 'تعقبات الشيخ ياسر برهامي العقدية والمنهجية والفقهية على النووي وغيره',
    chipClass:
      'bg-[#FBEFF0] text-[#731D28] border-[#E7C2C7] dark:bg-[#2C1619] dark:text-[#F2B8BF] dark:border-[#5D2930]',
    segmentClass:
      'bg-[#FCF2F3] text-[#691A24] border-[#ECCACE] dark:bg-[#281417] dark:text-[#F5C6CC] dark:border-[#57262C]',
    inlineWordClass:
      'bg-[#F9E7E9] text-[#6E1A25] decoration-[#A33644]/50 dark:bg-[#341A1E] dark:text-[#F2B8BF]',
    dotColorClass: 'text-[#8B2432] dark:text-[#EA929D]',
  },
  yasser: {
    id: 'yasser',
    label: 'تعليقات الشيخ ياسر',
    shortTag: 'تعليق الشيخ ياسر',
    description: 'فوائد الشيخ ياسر وحواشيه التوضيحية ومسائل (س/ج) والتراجم',
    chipClass:
      'bg-[#FAF2E3] text-[#5C3D0E] border-[#E2CDA6] dark:bg-[#292011] dark:text-[#ECD19D] dark:border-[#574220]',
    segmentClass:
      'bg-[#FBF5E8] text-[#52350B] border-[#E8D5B3] dark:bg-[#241C0F] dark:text-[#F2DAB0] dark:border-[#4E3B1D]',
    inlineWordClass:
      'bg-[#F7ECD6] text-[#56380B] decoration-[#9A6B22]/45 dark:bg-[#312614] dark:text-[#ECD19D]',
    dotColorClass: 'text-[#7C5212] dark:text-[#DFB773]',
  },
  isnad_lughah: {
    id: 'isnad_lughah',
    label: 'الإسناد واللغة',
    shortTag: 'إسناد ولغة',
    description: 'ضبط الأسماء والأنساب، علل الأسانيد، وغريب اللغة والنحو',
    chipClass:
      'bg-[#ECF4F8] text-[#17465E] border-[#BDD6E3] dark:bg-[#13222B] dark:text-[#A9D5EC] dark:border-[#264759]',
    segmentClass:
      'bg-[#F0F6FA] text-[#153E54] border-[#C8DDE8] dark:bg-[#111F27] dark:text-[#C2E3F4] dark:border-[#244354]',
    inlineWordClass:
      'bg-[#E5F0F6] text-[#13425B] decoration-[#256D94]/45 dark:bg-[#162933] dark:text-[#A9D5EC]',
    dotColorClass: 'text-[#1D5A7A] dark:text-[#7CC0E3]',
  },
};

export interface TextSegment {
  type: PatternType;
  text: string;
  ref?: string;
  layer?: ContentLayer;
  footnoteNum?: string;
}

export interface StudyParagraph {
  id: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  elements: string[];
  summary: string;
  segments: TextSegment[];
}

export interface BookSection {
  id: string;
  orderLabel: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  overview: string;
  paragraphs: StudyParagraph[];
}

export interface TreeNode {
  id: string;
  title: string;
  subtitle?: string;
  pattern: PatternType;
  author: 'النووي' | 'الشيخ ياسر' | 'كلاهما';
  pageRef: number;
  details: string;
  children?: TreeNode[];
}

export interface KnowledgeTreeData {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  pageRange: string;
  root: TreeNode;
}

export type QuestionSource = 'النووي' | 'الشيخ ياسر برهامي' | 'كلاهما';
export type QuestionDifficulty = 'أساسي' | 'متوسط' | 'متقدم';
export type QuestionKind = 'mcq' | 'tf';

export interface QuestionItem {
  id: string;
  sectionId: string;
  kind: QuestionKind;
  question: string;
  options: string[];
  correctIndex: number;
  sourceAuthor: QuestionSource;
  patternType: PatternType;
  difficulty: QuestionDifficulty;
  pageRef: number;
  sourceQuote: string;
  explanation: string;
}

export type AppView = 'index' | 'reading' | 'reader' | 'trees' | 'bank';

export interface UserStudyProgress {
  completedSectionIds: string[];
  bookmarkedQuestionIds: string[];
  wrongQuestionIds: string[];
  lastSectionId: string;
}
