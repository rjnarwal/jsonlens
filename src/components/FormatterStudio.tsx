import React, { useState, useMemo } from 'react';
import {
  Braces,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Wrench,
  Minimize2,
  FileCode,
  Layers,
  ArrowRight,
  Code,
  Download,
  Settings2,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import {
  formatJson,
  minifyJson,
  autoRepairJson,
} from '../services/formatService';
import {
  SupportedTargetLanguage,
  GeneratorOptions,
  generateModelCode,
  toPascalCase,
  toSnakeCase,
} from '../services/modelGenerator';

const SAMPLE_STUDIO_JSON = `{
  "id": "prod_98421",
  "sku": "STORAGE-PRO-V2",
  "name": "Cloud Storage Pro",
  "active": true,
  "pricing": {
    "monthlyUSD": 29.99,
    "annualUSD": 299.00,
    "discountPercent": 15,
    "currency": "USD"
  },
  "features": [
    "Unlimited Bandwidth",
    "End-to-End Encryption",
    "Priority 24/7 Support",
    "Custom SSL Certificates"
  ],
  "limits": {
    "maxStorageGB": 5000,
    "maxUsers": 50,
    "apiRateLimitPerMinute": 10000
  },
  "owner": {
    "userId": "usr_7819",
    "email": "admin@grassroot.digital",
    "verified": true
  }
}`;

interface LanguageConfig {
  id: SupportedTargetLanguage;
  name: string;
  iconText: string;
  badge: string;
  category: 'models' | 'format';
}

const TARGET_LANGUAGES: LanguageConfig[] = [
  { id: 'java', name: 'Java (POJO)', iconText: '☕', badge: '.java', category: 'models' },
  { id: 'kotlin', name: 'Kotlin', iconText: '🟣', badge: '.kt', category: 'models' },
  { id: 'typescript', name: 'TypeScript', iconText: '🟦', badge: '.ts', category: 'models' },
  { id: 'go', name: 'Go (Struct)', iconText: '🔷', badge: '.go', category: 'models' },
  { id: 'python', name: 'Python (Pydantic)', iconText: '🐍', badge: '.py', category: 'models' },
  { id: 'csharp', name: 'C# (.NET)', iconText: '🟪', badge: '.cs', category: 'models' },
  { id: 'swift', name: 'Swift (Codable)', iconText: '🟠', badge: '.swift', category: 'models' },
  { id: 'rust', name: 'Rust (Serde)', iconText: '🦀', badge: '.rs', category: 'models' },
  { id: 'dart', name: 'Dart (Flutter)', iconText: '🎯', badge: '.dart', category: 'models' },
  { id: 'php', name: 'PHP (DTO)', iconText: '🐘', badge: '.php', category: 'models' },
  { id: 'json_schema', name: 'JSON Schema', iconText: '📋', badge: '.json', category: 'format' },
  { id: 'formatted', name: 'Formatted JSON' as any, iconText: '⚡', badge: '.json', category: 'format' },
  { id: 'yaml', name: 'YAML', iconText: '🗂️', badge: '.yaml', category: 'format' },
];

export const FormatterStudio: React.FC = () => {
  const [inputJson, setInputJson] = useState(SAMPLE_STUDIO_JSON);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedTargetLanguage | 'formatted'>('java');
  const [rootModelName, setRootModelName] = useState('ProductConfig');

  // Generator Options
  const [javaPackage, setJavaPackage] = useState('com.example.models');
  const [javaUseLombok, setJavaUseLombok] = useState(true);
  const [pythonUsePydantic, setPythonUsePydantic] = useState(true);
  const [csharpUseRecord, setCsharpUseRecord] = useState(false);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [sortKeys, setSortKeys] = useState(false);

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Compute generated code
  const generatedResult = useMemo(() => {
    if (selectedLanguage === 'formatted') {
      const res = formatJson(inputJson, { indent, sortKeys });
      return {
        code: res.formatted,
        language: 'json',
        fileExtension: 'json',
        suggestedFileName: `${toSnakeCase(rootModelName || 'model')}.json`,
        error: res.error,
      };
    }

    const options: GeneratorOptions = {
      rootName: rootModelName.trim() || 'Model',
      javaPackage: javaPackage.trim() || 'com.example.models',
      javaUseLombok,
      javaIncludeGettersSetters: !javaUseLombok,
      pythonUsePydantic,
      csharpUseRecord,
    };

    return generateModelCode(inputJson, selectedLanguage, options);
  }, [
    inputJson,
    selectedLanguage,
    rootModelName,
    javaPackage,
    javaUseLombok,
    pythonUsePydantic,
    csharpUseRecord,
    indent,
    sortKeys,
  ]);

  const handleMinify = () => {
    const res = minifyJson(inputJson);
    if (!res.error) {
      setInputJson(res.minified);
      setMessage({ text: 'JSON minified onto 1 line!', type: 'success' });
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage({ text: `Minify Error: ${res.error}`, type: 'error' });
    }
  };

  const handleAutoRepair = () => {
    const res = autoRepairJson(inputJson);
    if (!res.error) {
      setInputJson(res.repaired);
      setMessage({ text: 'Auto-repaired single quotes, trailing commas, and unquoted keys!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: res.error, type: 'error' });
    }
  };

  const handleFormatInput = () => {
    const res = formatJson(inputJson, { indent, sortKeys });
    if (!res.error) {
      setInputJson(res.formatted);
      setMessage({ text: 'JSON beautified cleanly!', type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ text: `Format Error: ${res.error}`, type: 'error' });
    }
  };

  const handleCopy = async () => {
    if (!generatedResult.code) return;
    await navigator.clipboard.writeText(generatedResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedResult.code) return;
    const blob = new Blob([generatedResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedResult.suggestedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ text: `Downloaded ${generatedResult.suggestedFileName} successfully!`, type: 'success' });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleDownloadAllLanguages = () => {
    const languagesToExport: SupportedTargetLanguage[] = [
      'java',
      'kotlin',
      'typescript',
      'go',
      'python',
      'csharp',
      'swift',
      'rust',
      'dart',
      'php',
    ];

    let count = 0;
    languagesToExport.forEach((lang, idx) => {
      setTimeout(() => {
        const res = generateModelCode(inputJson, lang, {
          rootName: rootModelName || 'Model',
          javaPackage,
          javaUseLombok,
          pythonUsePydantic,
          csharpUseRecord,
        });

        if (res.code) {
          const blob = new Blob([res.code], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = res.suggestedFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          count++;
        }
      }, idx * 120);
    });

    setMessage({ text: `Exported ${languagesToExport.length} language model files!`, type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-background-secondary border border-border shadow-sm">
        {/* Left Formatting Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFormatInput}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Braces className="w-3.5 h-3.5" />
            <span>Beautify JSON</span>
          </button>

          <button
            onClick={handleMinify}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm cursor-pointer"
            title="Compact JSON onto 1 line"
          >
            <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Minify</span>
          </button>

          <button
            onClick={handleAutoRepair}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm cursor-pointer"
            title="Auto-repair single quotes, trailing commas, and unquoted keys"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Repair Syntax</span>
          </button>

          <div className="flex items-center space-x-1 text-xs text-text-muted px-2.5 py-1.5 rounded-xl bg-background-primary border border-border">
            <span className="font-semibold text-text-secondary">Indent:</span>
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value === 'tab' ? 'tab' : (Number(e.target.value) as any))}
              className="bg-transparent font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-primary border border-border text-xs font-semibold text-text-secondary cursor-pointer hover:border-accent/40 transition-colors">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5"
            />
            <span>Sort Keys</span>
          </label>
        </div>

        {/* Right Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInputJson(SAMPLE_STUDIO_JSON)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Load Sample</span>
          </button>

          <button
            onClick={() => setInputJson('')}
            className="p-2 rounded-xl bg-background-tertiary hover:bg-red-500/20 text-text-secondary hover:text-red-400 border border-border transition-colors shadow-sm cursor-pointer"
            title="Clear input"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150 ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* 2-Column Split: Input JSON vs Formatted / Converted POJO/Models */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Raw Input Editor */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5 text-accent" />
              <span>Input JSON Payload</span>
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {inputJson ? inputJson.split('\n').length : 0} lines • {(new Blob([inputJson]).size / 1024).toFixed(1)} KB
            </span>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Paste your JSON here to generate Java POJO, Kotlin, TypeScript, Go, Python, C#, Swift, Rust models..."
            className="w-full min-h-[580px] p-4 bg-background-primary rounded-2xl border-2 border-border/80 focus:border-accent text-xs font-mono font-medium leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none resize-none scrollbar-thin shadow-inner"
            spellCheck={false}
          />
        </div>

        {/* Right Column: Multi-Language POJO / Model Code Generator */}
        <div className="lg:col-span-7 space-y-3 flex flex-col">
          {/* Target Language Selection Grid / Scrollable Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-accent" />
                <span>Target Language & POJO Output</span>
              </span>

              {/* Batch Export Button */}
              <button
                onClick={handleDownloadAllLanguages}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-background-tertiary hover:bg-background-elevated text-[11px] font-semibold text-accent hover:text-accent-hover border border-border transition-colors cursor-pointer"
                title="Download code for all supported languages"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export All Languages</span>
              </button>
            </div>

            {/* Language Pills Carousel */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {TARGET_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                    selectedLanguage === lang.id
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20 font-bold'
                      : 'bg-background-secondary/80 text-text-secondary hover:text-text-primary border-border hover:bg-background-tertiary'
                  }`}
                >
                  <span>{lang.iconText}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Options & Customization Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-background-secondary/70 border border-border text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Root Class Name Input */}
              <div className="flex items-center space-x-1.5">
                <span className="text-text-muted font-medium">Class Name:</span>
                <input
                  type="text"
                  value={rootModelName}
                  onChange={(e) => setRootModelName(e.target.value)}
                  placeholder="RootModel"
                  className="px-2.5 py-1 rounded-lg bg-background-primary border border-border text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-accent w-36"
                />
              </div>

              {/* Java-Specific Options */}
              {selectedLanguage === 'java' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-text-muted font-medium">Package:</span>
                    <input
                      type="text"
                      value={javaPackage}
                      onChange={(e) => setJavaPackage(e.target.value)}
                      placeholder="com.example.models"
                      className="px-2 py-1 rounded-lg bg-background-primary border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent w-40"
                    />
                  </div>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-text-secondary">
                    <input
                      type="checkbox"
                      checked={javaUseLombok}
                      onChange={(e) => setJavaUseLombok(e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5"
                    />
                    <span>Lombok (@Data)</span>
                  </label>
                </>
              )}

              {/* Python-Specific Options */}
              {selectedLanguage === 'python' && (
                <label className="flex items-center space-x-1.5 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={pythonUsePydantic}
                    onChange={(e) => setPythonUsePydantic(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5"
                  />
                  <span>Pydantic v2 (BaseModel)</span>
                </label>
              )}

              {/* C#-Specific Options */}
              {selectedLanguage === 'csharp' && (
                <label className="flex items-center space-x-1.5 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={csharpUseRecord}
                    onChange={(e) => setCsharpUseRecord(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5"
                  />
                  <span>C# Record</span>
                </label>
              )}
            </div>

            {/* Target File Info & Actions */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-background-elevated text-emerald-400 border border-emerald-500/30">
                {generatedResult.suggestedFileName}
              </span>

              {/* Single Download Button */}
              <button
                onClick={handleDownload}
                disabled={!generatedResult.code}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                title={`Download ${generatedResult.suggestedFileName}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {generatedResult.fileExtension ? `.${generatedResult.fileExtension}` : 'File'}</span>
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                disabled={!generatedResult.code}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-background-elevated hover:bg-background-tertiary text-xs font-semibold text-text-primary border border-border transition-colors disabled:opacity-40 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Output Box */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={generatedResult.code}
              readOnly
              placeholder="Generated POJO / Model code will appear here..."
              className="w-full flex-1 min-h-[485px] p-4 bg-background-primary rounded-2xl border-2 border-border/80 text-xs font-mono font-medium leading-relaxed text-text-primary focus:outline-none resize-none scrollbar-thin shadow-inner select-text"
              spellCheck={false}
            />

            {generatedResult.error && (
              <div className="mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold">
                {generatedResult.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
