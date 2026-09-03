import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  formatJson,
  minifyJson,
  autoRepairJson,
  jsonToYaml,
  jsonToTypeScript,
  jsonToGo,
} from '../services/formatService';
import { ConversionTarget } from '../types/json';

const SAMPLE_STUDIO_JSON = `{
  "id": "prod_98421",
  "name": "Cloud Storage Pro",
  "active": true,
  "pricing": {
    "monthlyUSD": 29.99,
    "annualUSD": 299.00,
    "discountPercent": 15
  },
  "features": [
    "Unlimited Bandwidth",
    "End-to-End Encryption",
    "Priority 24/7 Support"
  ],
  "limits": {
    "maxStorageGB": 5000,
    "maxUsers": 50
  }
}`;

export const FormatterStudio: React.FC = () => {
  const [inputJson, setInputJson] = useState(SAMPLE_STUDIO_JSON);
  const [outputTab, setOutputTab] = useState<'formatted' | 'yaml' | 'typescript' | 'go'>('formatted');
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Computations
  const { formatted, error: formatError } = formatJson(inputJson, { indent, sortKeys });
  const { yamlText, error: yamlError } = jsonToYaml(inputJson);
  const { tsCode, error: tsError } = jsonToTypeScript(inputJson, 'ProductConfig');
  const { goCode, error: goError } = jsonToGo(inputJson, 'ProductConfig');

  const getActiveOutput = () => {
    switch (outputTab) {
      case 'formatted':
        return { text: formatted, error: formatError, lang: 'json' };
      case 'yaml':
        return { text: yamlText, error: yamlError, lang: 'yaml' };
      case 'typescript':
        return { text: tsCode, error: tsError, lang: 'typescript' };
      case 'go':
        return { text: goCode, error: goError, lang: 'go' };
    }
  };

  const activeOutput = getActiveOutput();

  const handleMinify = () => {
    const res = minifyJson(inputJson);
    if (!res.error) {
      setInputJson(res.minified);
      setMessage({ text: 'JSON minified successfully!', type: 'success' });
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
      setMessage({ text: 'JSON formatted cleanly!', type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ text: `Format Error: ${res.error}`, type: 'error' });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeOutput.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap = { formatted: 'json', yaml: 'yaml', typescript: 'ts', go: 'go' };
    const blob = new Blob([activeOutput.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-code.${extMap[outputTab]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Studio Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-background-secondary border border-border shadow-sm">
        {/* Left Formatting Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFormatInput}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm"
          >
            <Braces className="w-3.5 h-3.5" />
            <span>Beautify JSON</span>
          </button>

          <button
            onClick={handleMinify}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm"
            title="Compact JSON onto 1 line"
          >
            <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Minify</span>
          </button>

          <button
            onClick={handleAutoRepair}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm"
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
              className="bg-transparent font-bold text-text-primary focus:outline-none"
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
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-background-tertiary hover:bg-background-elevated text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Load Sample</span>
          </button>

          <button
            onClick={() => setInputJson('')}
            className="p-2 rounded-xl bg-background-tertiary hover:bg-red-500/20 text-text-secondary hover:text-red-400 border border-border transition-colors shadow-sm"
            title="Clear input"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150 ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
              : 'bg-red-500/15 border-red-500/30 text-red-500'
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* 2-Column Split: Input JSON vs Formatted / Converted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Raw Input Editor */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5 text-accent" />
              <span>Input JSON</span>
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {inputJson.split('\n').length} lines
            </span>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Paste your JSON here to format, minify, or convert to TypeScript/Go/YAML..."
            className="w-full min-h-[420px] p-4 bg-background-primary rounded-2xl border-2 border-border/80 focus:border-accent text-xs font-mono font-medium leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none resize-none scrollbar-thin shadow-inner"
            spellCheck={false}
          />
        </div>

        {/* Right Column: Converted Output with Tabs */}
        <div className="lg:col-span-6 space-y-2 flex flex-col">
          {/* Output Selector Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-background-secondary border border-border rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setOutputTab('formatted')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  outputTab === 'formatted' ? 'bg-accent text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Formatted JSON
              </button>
              <button
                onClick={() => setOutputTab('yaml')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  outputTab === 'yaml' ? 'bg-accent text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                YAML
              </button>
              <button
                onClick={() => setOutputTab('typescript')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  outputTab === 'typescript' ? 'bg-accent text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setOutputTab('go')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  outputTab === 'go' ? 'bg-accent text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Go Structs
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleDownload}
                disabled={!activeOutput.text}
                className="p-1.5 rounded-lg bg-background-secondary hover:bg-background-tertiary text-text-secondary hover:text-text-primary border border-border transition-colors disabled:opacity-40"
                title="Download code"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleCopy}
                disabled={!activeOutput.text}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-background-secondary hover:bg-background-tertiary text-xs font-semibold text-text-secondary hover:text-text-primary border border-border transition-colors disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Output Viewer Box */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={activeOutput.text}
              readOnly
              placeholder="Output will appear here..."
              className="w-full flex-1 min-h-[420px] p-4 bg-background-primary rounded-2xl border-2 border-border/80 text-xs font-mono font-medium leading-relaxed text-text-primary focus:outline-none resize-none scrollbar-thin shadow-inner"
              spellCheck={false}
            />

            {activeOutput.error && (
              <div className="mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold">
                {activeOutput.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
