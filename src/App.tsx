import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DiffViewer } from './components/DiffViewer';
import { FormatterStudio } from './components/FormatterStudio';
import { HistoryModal } from './components/HistoryModal';
import { Footer } from './components/Footer';
import {
  loadJsonHistory,
  saveJsonHistory,
  deleteJsonHistoryItem,
  clearJsonHistory,
  SAMPLE_JSON_DIFF,
} from './services/storageService';
import { JSONHistoryItem } from './types/json';
import { ShieldCheck, FileCode2, Sparkles, GitCompare } from 'lucide-react';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'diff' | 'formatter'>('formatter');
  const [theme, setTheme] = useState<'dark' | 'midnight' | 'light'>('dark');

  const [leftJson, setLeftJson] = useState<string>(SAMPLE_JSON_DIFF.left);
  const [rightJson, setRightJson] = useState<string>(SAMPLE_JSON_DIFF.right);

  const [history, setHistory] = useState<JSONHistoryItem[]>(() => loadJsonHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem('grassroot_theme') as 'dark' | 'midnight' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.remove('dark', 'midnight', 'light');
    document.documentElement.classList.add(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'midnight' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('grassroot_theme', newTheme);
    document.documentElement.classList.remove('dark', 'midnight', 'light');
    document.documentElement.classList.add(newTheme);
  };

  const handleSaveHistory = (title: string) => {
    const updated = saveJsonHistory(title, leftJson, rightJson, activeMode);
    setHistory(updated);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteJsonHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearJsonHistory();
    setHistory([]);
  };

  const handleSelectHistory = (item: JSONHistoryItem) => {
    setLeftJson(item.leftJson);
    if (item.rightJson) setRightJson(item.rightJson);
    setActiveMode(item.mode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-primary text-text-primary selection:bg-accent selection:text-white antialiased">
      {/* Ambient Glows */}
      <div className="ambient-glow w-[500px] h-[500px] bg-blue-500/10 -top-32 -left-32" />
      <div className="ambient-glow w-[500px] h-[500px] bg-cyan-500/10 top-60 -right-32" />

      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        theme={theme}
        onThemeChange={handleThemeChange}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {/* Banner Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-background-secondary/80 border border-border/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-lg sm:text-xl text-text-primary flex items-center space-x-2">
                <span>JSONLens Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Zero-Cloud Client
                </span>
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                {activeMode === 'diff'
                  ? 'Semantic side-by-side & unified JSON diffing with addition and deletion tracking.'
                  : 'JSON Beautifier, Minifier, Syntax Auto-Repair & TypeScript/Go/YAML Generator.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-text-muted self-start sm:self-center">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% In-Memory Browser Execution</span>
            </span>
          </div>
        </div>

        {/* Dynamic Mode View */}
        {activeMode === 'diff' ? (
          <DiffViewer
            leftJson={leftJson}
            rightJson={rightJson}
            onLeftJsonChange={setLeftJson}
            onRightJsonChange={setRightJson}
            onSaveHistory={handleSaveHistory}
          />
        ) : (
          <FormatterStudio />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* History Modal */}
      {isHistoryOpen && (
        <HistoryModal
          history={history}
          onClose={() => setIsHistoryOpen(false)}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      )}
    </div>
  );
};

export default App;
