export type DiffViewMode = 'split' | 'unified';

export type DiffLineType = 'added' | 'removed' | 'modified' | 'unchanged' | 'empty';

export interface DiffLine {
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: string;
  rightContent?: string;
  type: DiffLineType;
  path?: string;
  depth?: number;
}

export interface DiffSummary {
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  identical: boolean;
  totalLines: number;
}

export interface FormatOptions {
  indent: 2 | 4 | 'tab';
  sortKeys: boolean;
  autoFixQuotes: boolean;
}

export type ConversionTarget = 'yaml' | 'typescript' | 'go' | 'xml' | 'csv';

export interface JSONHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  leftJson: string;
  rightJson?: string;
  mode: 'diff' | 'formatter';
}
