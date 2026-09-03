import React, { useState } from 'react';
import {
  GitCompare,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ArrowLeftRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Columns,
  Rows,
  SlidersHorizontal,
} from 'lucide-react';
import { DiffViewMode, DiffLine, DiffSummary } from '../types/json';
import { computeJsonDiff } from '../services/diffService';
import { SAMPLE_JSON_DIFF } from '../services/storageService';

interface DiffViewerProps {
  leftJson: string;
  rightJson: string;
  onLeftJsonChange: (val: string) => void;
  onRightJsonChange: (val: string) => void;
  onSaveHistory: (title: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  leftJson,
  rightJson,
  onLeftJsonChange,
  onRightJsonChange,
  onSaveHistory,
}) => {
  const [viewMode, setViewMode] = useState<DiffViewMode>('split');
  const [sortKeys, setSortKeys] = useState(false);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [copied, setCopied] = useState(false);

  // Compute live diff
  const { lines, summary, leftError, rightError } = computeJsonDiff(leftJson, rightJson, {
    sortKeys,
    indent,
  });

  const handleSwap = () => {
    const temp = leftJson;
    onLeftJsonChange(rightJson);
    onRightJsonChange(temp);
  };

  const handleLoadSample = () => {
    onLeftJsonChange(SAMPLE_JSON_DIFF.left);
    onRightJsonChange(SAMPLE_JSON_DIFF.right);
  };

  const handleCopyDiffSummary = async () => {
    const text = `Diff Summary:\n+ Added: ${summary.addedCount}\n- Removed: ${summary.removedCount}\n~ Modified: ${summary.modifiedCount}\nIdentical: ${summary.identical ? 'Yes' : 'No'}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-background-secondary border border-border shadow-sm">
        {/* Left Options */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-primary border border-border rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'split' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'unified' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Rows className="w-3.5 h-3.5" />
              <span>Unified View</span>
            </button>
          </div>

          {/* Sort Keys Toggle */}
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-primary border border-border text-xs font-semibold text-text-secondary cursor-pointer hover:border-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5"
            />
            <span>Sort Keys</span>
          </label>

          {/* Indent Selector */}
          <div className="flex items-center space-x-1 text-xs text-text-muted px-2.5 py-1.5 rounded-xl bg-background-primary border border-border">
            <span className="font-semibold text-text-secondary">Indent:</span>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value === 'tab' ? 'tab' : Number(e.target.value) as any)}
              className="bg-transparent font-bold text-text-primary focus:outline-none"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Sample Diff</span>
          </button>

          <button
            onClick={handleSwap}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm"
            title="Swap Left and Right JSON"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
            <span>Swap</span>
          </button>

          <button
            onClick={() => onSaveHistory(`Diff comparison ${new Date().toLocaleTimeString()}`)}
            disabled={!leftJson && !rightJson}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm disabled:opacity-40"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save</span>
          </button>

          <button
            onClick={() => {
              onLeftJsonChange('');
              onRightJsonChange('');
            }}
            className="p-2 rounded-xl bg-background-tertiary hover:bg-red-500/20 text-text-secondary hover:text-red-400 border border-border transition-colors shadow-sm"
            title="Clear both inputs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diff Metrics Summary Card */}
      {(leftJson || rightJson) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-background-secondary border border-border shadow-md">
          <div className="flex items-center space-x-3">
            {summary.identical ? (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payloads are structurally identical!</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  +{summary.addedCount} Added
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-500 border border-red-500/30">
                  -{summary.removedCount} Removed
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  ~{summary.modifiedCount} Modified
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleCopyDiffSummary}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Summary Copied' : 'Copy Stats'}</span>
          </button>
        </div>
      )}

      {/* JSON Inputs & Editor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left JSON (Original / Baseline) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span>Original JSON (Left)</span>
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {leftJson.split('\n').length} lines
            </span>
          </div>

          <textarea
            value={leftJson}
            onChange={(e) => onLeftJsonChange(e.target.value)}
            placeholder="Paste baseline / original JSON..."
            className="w-full h-64 p-3.5 bg-background-primary rounded-xl border-2 border-border/80 focus:border-red-500 text-xs font-mono font-medium leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none resize-none scrollbar-thin shadow-inner"
            spellCheck={false}
          />

          {leftError && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{leftError}</span>
            </div>
          )}
        </div>

        {/* Right JSON (Modified / Target) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Modified JSON (Right)</span>
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {rightJson.split('\n').length} lines
            </span>
          </div>

          <textarea
            value={rightJson}
            onChange={(e) => onRightJsonChange(e.target.value)}
            placeholder="Paste modified / comparison JSON..."
            className="w-full h-64 p-3.5 bg-background-primary rounded-xl border-2 border-border/80 focus:border-emerald-500 text-xs font-mono font-medium leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none resize-none scrollbar-thin shadow-inner"
            spellCheck={false}
          />

          {rightError && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{rightError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Line-by-Line Diff Output Box */}
      {lines.length > 0 && (
        <div className="rounded-2xl bg-background-secondary border border-border shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-background-tertiary border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-accent" />
              <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-text-primary">
                Visual Line Comparison ({lines.length} lines analyzed)
              </h3>
            </div>
            <div className="text-[11px] text-text-muted font-medium">100% Client-Side</div>
          </div>

          {/* Lines Table */}
          <div className="max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed bg-background-primary divide-y divide-border/40 scrollbar-thin">
            {viewMode === 'split' ? (
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* Left Column Lines */}
                <div className="divide-y divide-border/30">
                  {lines.map((line, idx) => (
                    <div
                      key={`l-${idx}`}
                      className={`flex items-start px-2 py-0.5 ${
                        line.type === 'removed'
                          ? 'diff-line-removed'
                          : line.type === 'modified'
                          ? 'diff-line-modified'
                          : 'hover:bg-background-tertiary/40'
                      }`}
                    >
                      <span className="w-9 text-right text-text-muted/60 select-none mr-3 text-[11px]">
                        {line.leftLineNumber || ''}
                      </span>
                      <span className="font-medium whitespace-pre break-all flex-1 text-text-primary">
                        {line.leftContent !== undefined ? line.leftContent : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Column Lines */}
                <div className="divide-y divide-border/30">
                  {lines.map((line, idx) => (
                    <div
                      key={`r-${idx}`}
                      className={`flex items-start px-2 py-0.5 ${
                        line.type === 'added'
                          ? 'diff-line-added'
                          : line.type === 'modified'
                          ? 'diff-line-modified'
                          : 'hover:bg-background-tertiary/40'
                      }`}
                    >
                      <span className="w-9 text-right text-text-muted/60 select-none mr-3 text-[11px]">
                        {line.rightLineNumber || ''}
                      </span>
                      <span className="font-medium whitespace-pre break-all flex-1 text-text-primary">
                        {line.rightContent !== undefined ? line.rightContent : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Unified Mode */
              <div className="divide-y divide-border/30">
                {lines.map((line, idx) => (
                  <div
                    key={`u-${idx}`}
                    className={`flex items-start px-3 py-1 ${
                      line.type === 'added'
                        ? 'diff-line-added'
                        : line.type === 'removed'
                        ? 'diff-line-removed'
                        : line.type === 'modified'
                        ? 'diff-line-modified'
                        : 'hover:bg-background-tertiary/40'
                    }`}
                  >
                    <span className="w-12 text-text-muted select-none text-[11px]">
                      {line.leftLineNumber ? `L${line.leftLineNumber}` : ''}
                      {line.rightLineNumber ? ` R${line.rightLineNumber}` : ''}
                    </span>
                    <span className="w-5 text-center font-bold select-none text-xs">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.type === 'modified' ? '~' : ' '}
                    </span>
                    <span className="font-medium whitespace-pre break-all flex-1 text-text-primary">
                      {line.rightContent !== undefined ? line.rightContent : line.leftContent}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
