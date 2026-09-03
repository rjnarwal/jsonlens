import React, { useState } from 'react';
import { X, History, Trash2, Search, ArrowUpRight, Copy, Check, Clock } from 'lucide-react';
import { JSONHistoryItem } from '../types/json';

interface HistoryModalProps {
  history: JSONHistoryItem[];
  onClose: () => void;
  onSelectHistory: (item: JSONHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  onClose,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.leftJson.toLowerCase().includes(search.toLowerCase()) ||
      (item.rightJson && item.rightJson.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-background-elevated border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-secondary">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm text-text-primary">
                Local JSON History
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Saved in local browser memory. Zero server uploads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-tertiary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-border/70 flex items-center justify-between gap-3 bg-background-secondary/50">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved JSON snippets..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background-primary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-red-500/15 text-text-secondary hover:text-red-400 text-xs font-semibold border border-border transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center text-xs text-text-muted space-y-2">
              <History className="w-8 h-8 mx-auto text-text-muted/40" />
              <p>No JSON history items saved yet.</p>
              <p className="text-[11px]">Click "Save" on any comparison to keep it for later.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-background-secondary border border-border hover:border-accent/40 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-bold text-xs text-text-primary truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-elevated text-accent border border-border uppercase">
                      {item.mode}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-muted font-mono truncate">
                    {item.leftJson}
                  </div>
                  <div className="text-[10px] text-text-muted flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Saved {new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(item.id, item.leftJson)}
                    className="p-2 rounded-lg bg-background-tertiary hover:bg-background-elevated text-text-secondary hover:text-text-primary transition-colors border border-border"
                    title="Copy left JSON"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSelectHistory(item);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Load</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteHistory(item.id)}
                    className="p-2 rounded-lg bg-background-tertiary hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors border border-border"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-background-secondary border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">{filteredHistory.length} snippets saved</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-background-tertiary text-text-secondary hover:text-text-primary text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
