export type Tone = '平' | '仄' | '中' | '?';
export type MarkTone = '平' | '仄' | '中';

export interface CharacterMark {
  tone: MarkTone | '?';
  rhyme: string;
  pauseAfter: boolean;
  basis: string;
  note: string;
}

export interface PoemVersion {
  id: string;
  name: string;
  source: string;
  createdAt: string;
  text: string;
  marks: Record<string, CharacterMark>;
  antithesisPairs: AntithesisPair[];
}

export interface AntithesisPair {
  id: string;
  leftLine: number;
  rightLine: number;
  note: string;
}

export type AntithesisPositionStatus =
  | 'match'
  | 'mismatch'
  | 'skipped-rhyme'
  | 'skipped-neutral'
  | 'unknown'
  | 'missing';

export interface AntithesisPositionCheck {
  position: number;
  leftChar: string;
  rightChar: string;
  leftTone: Tone;
  rightTone: Tone;
  status: AntithesisPositionStatus;
  note: string;
}

export type AntithesisStatus = 'match' | 'mismatch' | 'length-mismatch' | 'indeterminate';

export interface AntithesisMismatch {
  position: number;
  leftChar: string;
  rightChar: string;
  tone: Tone;
  kind: 'same-tone' | 'missing';
  detail: string;
}

export interface AntithesisCheck {
  pairId: string;
  leftLine: number;
  rightLine: number;
  leftLength: number;
  rightLength: number;
  status: AntithesisStatus;
  positions: AntithesisPositionCheck[];
  comparedCount: number;
  mismatchCount: number;
  unknownCount: number;
  firstMismatch?: AntithesisMismatch;
  summary: string;
}

export interface PoemWorkspace {
  title: string;
  author: string;
  templateId: string;
  versions: PoemVersion[];
  activeVersionId: string;
  updatedAt: string;
}

export interface MeterTemplate {
  id: string;
  name: string;
  summary: string;
  lineCount: number;
  lineLength: number;
  pattern: Tone[];
  rhymeLines: number[];
}

export interface AnalysisCell {
  char: string;
  position: number;
  expected: Tone;
  actual: Tone;
  status: 'correct' | 'variant' | 'error' | 'unknown' | 'neutral';
  message: string;
  mark: CharacterMark;
}

export interface AnalysisLine {
  index: number;
  cells: AnalysisCell[];
  rhymeChars: string[];
  errors: number;
  variants: number;
}

export interface PoemIssue {
  id: string;
  level: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  line?: number;
  position?: number;
}

export interface CharDiff {
  index: number;
  left: string;
  right: string;
  changed: boolean;
}
