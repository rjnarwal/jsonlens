import React from 'react';
import {
  FileCode2,
  GitCompare,
  Sparkles,
  ExternalLink,
  Moon,
  Sun,
  History,
  Zap,
  Home,
  KeyRound,
  Braces,
} from 'lucide-react';

import { isDesktopEnvironment, isMacDesktopEnvironment } from '../utils/platform';

interface NavbarProps {
  activeMode: 'diff' | 'formatter';
  onModeChange: (mode: 'diff' | 'formatter') => void;
  theme: 'dark' | 'midnight' | 'light';
  onThemeChange: (theme: 'dark' | 'midnight' | 'light') => void;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onModeChange,
  theme,
  onThemeChange,
  onOpenHistory,
}) => {
  const isDesktop = isDesktopEnvironment();
  const isMac = isMacDesktopEnvironment();

  return (
    <header className={`sticky top-0 z-40 bg-background-secondary/90 backdrop-blur-md border-b border-border select-none app-drag-region ${
      isMac ? 'pl-24 pr-4' : 'px-4'
    }`}>
      <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center space-x-3 no-drag">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-heading font-extrabold text-base tracking-tight text-text-primary">
                JSONLens
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-elevated text-accent font-semibold border border-border">
                Diff & Studio
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-background-tertiary border border-border rounded-xl p-0.5 ml-2">
            <button
              onClick={() => onModeChange('formatter')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'formatter'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Braces className="w-3.5 h-3.5" />
              <span>Formatter & Types</span>
            </button>

            <button
              onClick={() => onModeChange('diff')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'diff'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Semantic Diff</span>
            </button>
          </div>

          {/* Grassroot Digital Home Link (Shown ONLY on Web, hidden on Desktop App) */}
          {!isDesktop && (
            <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-border/60">
              <a
                href="https://grassroot.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors border border-border/50 hover:border-emerald-500/40 group"
                title="Grassroot Digital Welcome Hub"
              >
                <Home className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Home</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 text-text-muted" />
              </a>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 no-drag">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Desktop App Download (Only on Web) */}
          {!isDesktop && (
            <a
              href="https://github.com/rjnarwal/jsonlens/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-semibold text-cyan-400 transition-colors shadow-sm"
              title="Download JSONLens Native Desktop App (Mac / Windows / Linux)"
            >
              <span className="hidden sm:inline">Desktop App ▾</span>
              <span className="sm:hidden">App ▾</span>
            </a>
          )}

          {/* 3-Pill Theme Switcher matching Grassroot Ecosystem */}
          <div className="flex items-center bg-background-tertiary/80 border border-border rounded-xl p-0.5 ml-1">
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                theme === 'dark'
                  ? 'bg-accent text-white shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Dark Modern Theme"
              aria-label="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('midnight')}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                theme === 'midnight'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Midnight Navy Theme"
              aria-label="Midnight Navy Theme"
            >
              Navy
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                theme === 'light'
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="Clean Light Theme"
              aria-label="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
