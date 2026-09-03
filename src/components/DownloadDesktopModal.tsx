import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Apple,
  Terminal,
  CheckCircle2,
  Sparkles,
  ArrowDownToLine,
  Layers,
  HelpCircle,
} from 'lucide-react';

export interface AppDownloadConfig {
  appName: string;
  tagline: string;
  version: string;
  icon?: React.ReactNode;
  downloads: {
    macArm: string;
    macIntel: string;
    winX64: string;
    linuxAppImage: string;
    linuxDeb?: string;
  };
}

interface DownloadDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AppDownloadConfig;
}

const DEFAULT_ENDLY_CONFIG: AppDownloadConfig = {
  appName: 'Endly',
  tagline: 'Modern Cross-Platform API Client & Proxy',
  version: 'v1.0.0',
  downloads: {
    macArm: 'https://github.com/rjnarwal/endly/releases/download/v1.0.0/Endly-1.0.0-arm64.dmg',
    macIntel: 'https://github.com/rjnarwal/endly/releases/download/v1.0.0/Endly-1.0.0.dmg',
    winX64: 'https://github.com/rjnarwal/endly/releases/download/v1.0.0/Endly-Setup-1.0.0.exe',
    linuxAppImage: 'https://github.com/rjnarwal/endly/releases/download/v1.0.0/Endly-1.0.0.AppImage',
    linuxDeb: 'https://github.com/rjnarwal/endly/releases/download/v1.0.0/endly_1.0.0_amd64.deb',
  },
};

export const DownloadDesktopModal: React.FC<DownloadDesktopModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_ENDLY_CONFIG,
}) => {
  const [userOS, setUserOS] = useState<'mac-arm' | 'mac-intel' | 'win' | 'linux'>('mac-arm');
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();

    if (platform.includes('mac') || ua.includes('macintosh')) {
      // Default to Apple Silicon for modern Macs, user can toggle Intel
      setUserOS('mac-arm');
    } else if (platform.includes('win') || ua.includes('windows')) {
      setUserOS('win');
    } else if (platform.includes('linux') || ua.includes('linux')) {
      setUserOS('linux');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = (url: string, osLabel: string) => {
    setDownloadStarted(osLabel);
    // Create temporary link and click to trigger direct download
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getRecommendedDownload = () => {
    switch (userOS) {
      case 'mac-arm':
        return {
          label: 'macOS (Apple Silicon M1/M2/M3/M4)',
          file: `${config.appName}-1.0.0-arm64.dmg`,
          url: config.downloads.macArm,
          icon: <Apple className="w-5 h-5 text-white" />,
        };
      case 'mac-intel':
        return {
          label: 'macOS (Intel Core x64)',
          file: `${config.appName}-1.0.0.dmg`,
          url: config.downloads.macIntel,
          icon: <Apple className="w-5 h-5 text-white" />,
        };
      case 'win':
        return {
          label: 'Windows 10 / 11 (64-bit)',
          file: `${config.appName}-Setup-1.0.0.exe`,
          url: config.downloads.winX64,
          icon: (
            <svg className="w-5 h-5 fill-current text-blue-400" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.849" />
            </svg>
          ),
        };
      case 'linux':
        return {
          label: 'Linux (.AppImage 64-bit)',
          file: `${config.appName}-1.0.0.AppImage`,
          url: config.downloads.linuxAppImage,
          icon: <Terminal className="w-5 h-5 text-emerald-400" />,
        };
    }
  };

  const recommended = getRecommendedDownload();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-background-secondary border border-border rounded-3xl shadow-2xl overflow-hidden text-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/70 bg-background-elevated/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-text-primary">
                  Download {config.appName} Desktop
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {config.version}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{config.tagline}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-background-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Recommended Auto-Detected OS Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Detected for Your System</span>
              </span>
              <span className="text-[11px] text-text-muted font-mono">{recommended.file}</span>
            </div>

            <button
              onClick={() => handleDownload(recommended.url, recommended.label)}
              className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {recommended.icon}
              <span>Download for {recommended.label}</span>
              <ArrowDownToLine className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* All Operating Systems Grid */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center justify-between">
              <span>Choose Operating System:</span>
              <span className="text-[10px] text-text-muted font-normal">Direct binary downloads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Apple Silicon */}
              <button
                onClick={() =>
                  handleDownload(
                    config.downloads.macArm,
                    'macOS Apple Silicon'
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/70 hover:bg-background-tertiary border border-border/80 hover:border-orange-500/40 text-left transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <Apple className="w-5 h-5 text-text-primary group-hover:text-orange-400 transition-colors" />
                  <div>
                    <div className="text-xs font-bold text-text-primary">macOS (Apple Silicon)</div>
                    <div className="text-[10px] text-text-muted font-mono">M1, M2, M3, M4 (.dmg)</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-text-muted group-hover:text-orange-400 transition-colors" />
              </button>

              {/* Apple Intel */}
              <button
                onClick={() =>
                  handleDownload(
                    config.downloads.macIntel,
                    'macOS Intel'
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/70 hover:bg-background-tertiary border border-border/80 hover:border-orange-500/40 text-left transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <Apple className="w-5 h-5 text-text-primary group-hover:text-orange-400 transition-colors" />
                  <div>
                    <div className="text-xs font-bold text-text-primary">macOS (Intel x64)</div>
                    <div className="text-[10px] text-text-muted font-mono">Intel Core Mac (.dmg)</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-text-muted group-hover:text-orange-400 transition-colors" />
              </button>

              {/* Windows 64-bit */}
              <button
                onClick={() =>
                  handleDownload(
                    config.downloads.winX64,
                    'Windows x64'
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/70 hover:bg-background-tertiary border border-border/80 hover:border-blue-500/40 text-left transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <svg className="w-5 h-5 fill-current text-blue-400" viewBox="0 0 24 24">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.401H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.849" />
                  </svg>
                  <div>
                    <div className="text-xs font-bold text-text-primary">Windows (64-bit)</div>
                    <div className="text-[10px] text-text-muted font-mono">Setup Installer (.exe)</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-text-muted group-hover:text-blue-400 transition-colors" />
              </button>

              {/* Linux AppImage */}
              <button
                onClick={() =>
                  handleDownload(
                    config.downloads.linuxAppImage,
                    'Linux AppImage'
                  )
                }
                className="flex items-center justify-between p-3 rounded-xl bg-background-elevated/70 hover:bg-background-tertiary border border-border/80 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-text-primary">Linux (Universal)</div>
                    <div className="text-[10px] text-text-muted font-mono">Portable (.AppImage)</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-text-muted group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Download Triggered Notification */}
          {downloadStarted && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-xs text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Your <strong>{downloadStarted}</strong> download has started directly!
              </span>
            </div>
          )}

          {/* macOS Gatekeeper tip */}
          <div className="p-3 rounded-xl bg-background-tertiary/60 border border-border/50 text-[11px] text-text-muted flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <span>
              <strong>Note for macOS:</strong> If macOS shows an "unidentified developer" prompt, right-click the app in Applications and click <strong>Open</strong>, or run <code className="px-1 py-0.2 rounded bg-background-elevated text-text-primary font-mono text-[10px]">xattr -cr /Applications/{config.appName}.app</code> in Terminal.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
