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
  FolderArchive,
  FileText,
  Files,
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
  GeneratedFileItem,
  toPascalCase,
  toSnakeCase,
} from '../services/modelGenerator';
import { createZipArchive, ZipFileEntry } from '../services/zipService';

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

  // Unified vs Multi-file view state
  const [fileMode, setFileMode] = useState<'unified' | 'separate'>('unified');
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);

  // Generator Options
  const [javaPackage, setJavaPackage] = useState('com.example.models');
  const [javaUseLombok, setJavaUseLombok] = useState(true);
  const [pythonUsePydantic, setPythonUsePydantic] = useState(true);
  const [csharpUseRecord, setCsharpUseRecord] = useState(false);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [sortKeys, setSortKeys] = useState(false);

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Compute generated code & file breakdowns
  const generatorResult = useMemo(() => {
    if (selectedLanguage === 'formatted') {
      const res = formatJson(inputJson, { indent, sortKeys });
      const fileName = `${toSnakeCase(rootModelName || 'model')}.json`;
      return {
        code: res.formatted,
        language: 'json',
        fileExtension: 'json',
        suggestedFileName: fileName,
        files: [{ fileName, modelName: rootModelName, code: res.formatted, isRoot: true }],
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

  // Determine active display text
  const currentDisplayedCode = useMemo(() => {
    if (fileMode === 'unified' || generatorResult.files.length <= 1) {
      return generatorResult.code;
    }
    const safeIdx = Math.min(selectedFileIdx, generatorResult.files.length - 1);
    return generatorResult.files[safeIdx]?.code || generatorResult.code;
  }, [fileMode, selectedFileIdx, generatorResult]);

  const activeFileName = useMemo(() => {
    if (fileMode === 'unified' || generatorResult.files.length <= 1) {
      return generatorResult.suggestedFileName;
    }
    const safeIdx = Math.min(selectedFileIdx, generatorResult.files.length - 1);
    return generatorResult.files[safeIdx]?.fileName || generatorResult.suggestedFileName;
  }, [fileMode, selectedFileIdx, generatorResult]);

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
    if (!currentDisplayedCode) return;
    await navigator.clipboard.writeText(currentDisplayedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Download Unified Single File
  const handleDownloadUnified = () => {
    if (!generatorResult.code) return;
    const blob = new Blob([generatorResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatorResult.suggestedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({
      text: `Downloaded unified file ${generatorResult.suggestedFileName}!`,
      type: 'success',
    });
    setTimeout(() => setMessage(null), 2500);
  };

  // 2. Download Multiple Separate Files as ZIP
  const handleDownloadZip = () => {
    if (!generatorResult.files || generatorResult.files.length === 0) return;

    const zipEntries: ZipFileEntry[] = generatorResult.files.map((f) => ({
      name: f.fileName,
      content: f.code,
    }));

    const zipBlob = createZipArchive(zipEntries);
    const url = URL.createObjectURL(zipBlob);
    const zipName = `${toSnakeCase(rootModelName || 'models')}-${selectedLanguage}-models.zip`;

    const a = document.createElement('a');
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({
      text: `Downloaded ${generatorResult.files.length} separate model files as ${zipName}!`,
      type: 'success',
    });
    setTimeout(() => setMessage(null), 3000);
  };

  // 3. Download active individual sub-file
  const handleDownloadActiveFile = () => {
    if (!currentDisplayedCode) return;
    const blob = new Blob([currentDisplayedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ text: `Downloaded ${activeFileName}!`, type: 'success' });
    setTimeout(() => setMessage(null), 2500);
  };

  // 4. Export All Languages bundle
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

    const allZipEntries: ZipFileEntry[] = [];

    languagesToExport.forEach((lang) => {
      const res = generateModelCode(inputJson, lang, {
        rootName: rootModelName || 'Model',
        javaPackage,
        javaUseLombok,
        pythonUsePydantic,
        csharpUseRecord,
      });

      if (res.files && res.files.length > 0) {
        res.files.forEach((f) => {
          allZipEntries.push({
            name: `${lang}/${f.fileName}`,
            content: f.code,
          });
        });
      } else if (res.code) {
        allZipEntries.push({
          name: `${lang}/${res.suggestedFileName}`,
          content: res.code,
        });
      }
    });

    if (allZipEntries.length > 0) {
      const zipBlob = createZipArchive(allZipEntries);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${toSnakeCase(rootModelName || 'models')}-all-languages.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        text: `Exported ${allZipEntries.length} files across ${languagesToExport.length} languages into a ZIP archive!`,
        type: 'success',
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const hasMultipleFiles = generatorResult.files && generatorResult.files.length > 1;

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
                <span>Target Language & POJO Models</span>
              </span>

              {/* Batch Export All Languages */}
              <button
                onClick={handleDownloadAllLanguages}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-accent hover:text-accent-hover border border-border transition-all shadow-sm cursor-pointer"
                title="Download code for all supported languages in a ZIP bundle"
              >
                <FolderArchive className="w-3.5 h-3.5 text-accent" />
                <span>Download All Languages (ZIP)</span>
              </button>
            </div>

            {/* Language Pills Carousel */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {TARGET_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLanguage(lang.id as any);
                    setSelectedFileIdx(0);
                  }}
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

          {/* Model Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-background-secondary/70 border border-border text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Root Class Name Input */}
              <div className="flex items-center space-x-1.5">
                <span className="text-text-muted font-medium">Root Class:</span>
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

            {/* Unified vs Separate Packaging Mode Switcher */}
            {hasMultipleFiles && (
              <div className="flex items-center bg-background-primary border border-border rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFileMode('unified')}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    fileMode === 'unified'
                      ? 'bg-accent text-white shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Combine all classes/structs in one unified file"
                >
                  <FileText className="w-3 h-3" />
                  <span>1 Unified File</span>
                </button>
                <button
                  onClick={() => setFileMode('separate')}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    fileMode === 'separate'
                      ? 'bg-accent text-white shadow-sm font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  title="Generate separate file for each class"
                >
                  <Files className="w-3 h-3" />
                  <span>{generatorResult.files.length} Separate Files</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-Files Bar (When in Separate Files Mode) */}
          {hasMultipleFiles && fileMode === 'separate' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background-secondary/90 border border-border text-xs">
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-thin flex-1 mr-2">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mr-1">
                  Files:
                </span>
                {generatorResult.files.map((file, idx) => (
                  <button
                    key={file.fileName}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 border ${
                      selectedFileIdx === idx
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-background-primary text-text-secondary hover:text-text-primary border-border hover:bg-background-elevated'
                    }`}
                  >
                    <span>{file.fileName}</span>
                    {file.isRoot && (
                      <span className="text-[9px] px-1 rounded bg-white/20 text-white font-sans font-bold">
                        Root
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Download Current Sub-file */}
              <button
                onClick={handleDownloadActiveFile}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-background-elevated hover:bg-background-tertiary text-text-primary border border-border text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                title={`Download ${activeFileName}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save {activeFileName}</span>
              </button>
            </div>
          )}

          {/* Primary Download & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-background-elevated/70 border border-border">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                {activeFileName}
              </span>
              <span className="text-xs text-text-muted">
                {currentDisplayedCode.split('\n').length} lines
              </span>
            </div>

            {/* Download Buttons: Unified vs Separate ZIP vs Copy */}
            <div className="flex items-center space-x-2">
              {/* Option 1: Download Unified Single File */}
              <button
                onClick={handleDownloadUnified}
                disabled={!generatorResult.code}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-md shadow-accent/20 transition-all disabled:opacity-40 cursor-pointer"
                title={`Download 1 unified ${generatorResult.suggestedFileName} file`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Unified File</span>
              </button>

              {/* Option 2: Download All Separate Files as ZIP (When multiple classes exist) */}
              {hasMultipleFiles && (
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  title={`Download all ${generatorResult.files.length} model files as a ZIP archive`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Download ZIP ({generatorResult.files.length} Files)</span>
                </button>
              )}

              {/* Copy Code */}
              <button
                onClick={handleCopy}
                disabled={!currentDisplayedCode}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-secondary hover:bg-background-tertiary text-xs font-semibold text-text-primary border border-border transition-colors disabled:opacity-40 cursor-pointer"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Output Box */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={currentDisplayedCode}
              readOnly
              placeholder="Generated POJO / Model code will appear here..."
              className="w-full flex-1 min-h-[460px] p-4 bg-background-primary rounded-2xl border-2 border-border/80 text-xs font-mono font-medium leading-relaxed text-text-primary focus:outline-none resize-none scrollbar-thin shadow-inner select-text"
              spellCheck={false}
            />

            {generatorResult.error && (
              <div className="mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold">
                {generatorResult.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
