'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Code, 
  ListTree, 
  FileText, 
  Sparkles,
  X,
  Filter,
  ArrowUp,
  ArrowDown,
  Terminal
} from 'lucide-react';

interface InteractiveJsonViewerProps {
  data: any; // Raw JSON string or object/array
  title?: string;
  className?: string;
  defaultExpandedDepth?: number;
}

// ─── RECURSIVE JSON TREE NODE ──────────────────────────────────────────────────
const JsonTreeNode: React.FC<{
  nodeKey?: string | number;
  value: any;
  searchTerm: string;
  depth: number;
  maxDefaultDepth: number;
  isLast?: boolean;
  parentPath?: string;
}> = ({ nodeKey, value, searchTerm, depth, maxDefaultDepth, isLast = true, parentPath = '' }) => {
  const [collapsed, setCollapsed] = useState<boolean>(depth >= maxDefaultDepth);

  React.useEffect(() => {
    setCollapsed(depth >= maxDefaultDepth);
  }, [maxDefaultDepth, depth]);

  const currentPath = parentPath ? (nodeKey !== undefined ? `${parentPath}.${nodeKey}` : parentPath) : (nodeKey !== undefined ? String(nodeKey) : '');

  // Helper for search match testing
  const matchesSearch = useCallback((text: string) => {
    if (!searchTerm.trim()) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase().trim());
  }, [searchTerm]);

  // Highlight matched search substring
  const highlightMatch = useCallback((text: string) => {
    if (!searchTerm.trim()) return <span>{text}</span>;
    const term = searchTerm.trim();
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return <span>{text}</span>;

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + term.length);
    const after = text.substring(idx + term.length);

    return (
      <span>
        {before}
        <mark className="json-search-match bg-amber-400/30 text-amber-200 border border-amber-500/60 rounded px-1 py-0.5 font-bold shadow-sm">
          {match}
        </mark>
        {after}
      </span>
    );
  }, [searchTerm]);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const keys = isObject ? Object.keys(value) : [];
  const itemCount = isObject ? (isArray ? value.length : keys.length) : 0;

  // Auto-expand node if a child matches the search term
  const childMatchesSearch = useMemo(() => {
    if (!searchTerm.trim()) return false;
    const str = JSON.stringify(value);
    return matchesSearch(str);
  }, [value, searchTerm, matchesSearch]);

  const isSelfMatched = nodeKey !== undefined && matchesSearch(String(nodeKey));

  // Primitive value rendering
  if (!isObject) {
    let valueColor = 'text-emerald-400';
    let formattedVal = String(value);

    if (typeof value === 'string') {
      valueColor = 'text-emerald-300';
      formattedVal = `"${value}"`;
    } else if (typeof value === 'number') {
      valueColor = 'text-cyan-300 font-bold';
    } else if (typeof value === 'boolean') {
      valueColor = 'text-amber-300 font-bold';
    } else if (value === null) {
      valueColor = 'text-red-400 italic';
      formattedVal = 'null';
    } else if (value === undefined) {
      valueColor = 'text-slate-500 italic';
      formattedVal = 'undefined';
    }

    const valMatches = matchesSearch(String(value));

    return (
      <div className={`flex items-baseline gap-1.5 py-0.5 font-mono text-xs hover:bg-slate-900/40 rounded px-1 transition-colors ${valMatches || isSelfMatched ? 'bg-indigo-950/40 border-l-2 border-amber-400' : ''}`}>
        {nodeKey !== undefined && (
          <span className="text-indigo-300 font-semibold shrink-0">
            {highlightMatch(String(nodeKey))}:
          </span>
        )}
        <span className={`break-all ${valueColor}`}>
          {highlightMatch(formattedVal)}
        </span>
        {!isLast && <span className="text-slate-600 font-bold">,</span>}
      </div>
    );
  }

  // Object or Array rendering
  const effectiveCollapsed = (childMatchesSearch && searchTerm.trim().length > 0) ? false : collapsed;

  return (
    <div className="font-mono text-xs my-0.5 select-text">
      {/* Node Header */}
      <div className={`flex items-center gap-1.5 py-0.5 rounded px-1 group cursor-pointer hover:bg-slate-900/60 transition-colors ${childMatchesSearch ? 'bg-indigo-950/30' : ''}`}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          {effectiveCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
          )}
        </button>

        {nodeKey !== undefined && (
          <span 
            onClick={() => setCollapsed(!collapsed)}
            className="text-indigo-300 font-bold hover:text-indigo-200 transition-colors cursor-pointer"
          >
            {highlightMatch(String(nodeKey))}:
          </span>
        )}

        <span 
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 font-bold"
        >
          {isArray ? '[' : '{'}
        </span>

        {/* Collapsed Preview Summary */}
        {effectiveCollapsed && (
          <span 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-slate-300 transition-colors text-[11px] font-medium cursor-pointer"
          >
            ... {isArray ? `Array(${itemCount})` : `Object(${itemCount})`}{' '}
            {isArray ? ']' : '}'}
          </span>
        )}

        {/* Badge showing item count */}
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono font-medium ml-1">
          {itemCount} {isArray ? (itemCount === 1 ? 'item' : 'items') : (itemCount === 1 ? 'key' : 'keys')}
        </span>

        {!isLast && effectiveCollapsed && <span className="text-slate-600 font-bold">,</span>}
      </div>

      {/* Expanded Node Children */}
      {!effectiveCollapsed && (
        <div className="pl-4 border-l border-slate-800/80 ml-2 space-y-0.5 my-0.5">
          {isArray
            ? (value as any[]).map((item, idx) => (
                <JsonTreeNode
                  key={idx}
                  nodeKey={idx}
                  value={item}
                  searchTerm={searchTerm}
                  depth={depth + 1}
                  maxDefaultDepth={maxDefaultDepth}
                  isLast={idx === (value as any[]).length - 1}
                  parentPath={currentPath}
                />
              ))
            : keys.map((key, idx) => (
                <JsonTreeNode
                  key={key}
                  nodeKey={key}
                  value={(value as any)[key]}
                  searchTerm={searchTerm}
                  depth={depth + 1}
                  maxDefaultDepth={maxDefaultDepth}
                  isLast={idx === keys.length - 1}
                  parentPath={currentPath}
                />
              ))}

          <div className="text-slate-400 font-bold py-0.5">
            {isArray ? ']' : '}'}
            {!isLast && <span className="text-slate-600 font-bold">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN INTERACTIVE JSON VIEWER ──────────────────────────────────────────────
export const InteractiveJsonViewer: React.FC<InteractiveJsonViewerProps> = ({
  data,
  title = 'Server Output',
  className = '',
  defaultExpandedDepth = 3
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'pretty' | 'raw'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [maxDepth, setMaxDepth] = useState(defaultExpandedDepth);
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);

  // Parse payload data into true raw string vs. parsed object (comment-aware)
  const { parsedJson, isValidJson, rawString, sizeKb, keyCount } = useMemo(() => {
    let rawStr = '';
    let parsed: any = null;
    let valid = false;
    let keysTotal = 0;

    if (typeof data === 'string') {
      rawStr = data; // Keep original formatted string with line breaks
      try {
        parsed = JSON.parse(data);
        valid = true;
      } catch (_) {
        // Fallback: Strip single-line and multi-line comments e.g. // comment or /* comment */
        try {
          const stripped = data
            .replace(/("(?:\\.|[^"\\\n])*")|\/\*[\s\S]*?\*\/|\/\/.*/g, (m, g1) => (g1 ? g1 : ''))
            .replace(/,(\s*[\}\]])/g, '$1');
          parsed = JSON.parse(stripped);
          valid = true;
        } catch (_) {
          valid = false;
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      valid = true;
      parsed = data;
      try {
        rawStr = JSON.stringify(data, null, 2);
      } catch (_) {
        rawStr = String(data);
      }
    } else {
      rawStr = String(data ?? '');
    }

    if (valid && parsed) {
      const countKeys = (obj: any): number => {
        if (!obj || typeof obj !== 'object') return 0;
        let c = 0;
        if (Array.isArray(obj)) {
          obj.forEach(item => { c += 1 + countKeys(item); });
        } else {
          Object.keys(obj).forEach(k => {
            c += 1 + countKeys(obj[k]);
          });
        }
        return c;
      };
      keysTotal = countKeys(parsed);
    }

    const bytes = new Blob([rawStr]).size;
    const kb = (bytes / 1024).toFixed(2);

    return {
      parsedJson: parsed,
      isValidJson: valid,
      rawString: rawStr,
      sizeKb: kb,
      keyCount: keysTotal
    };
  }, [data]);

  // Pretty 2-space formatted string
  const prettyJsonStr = useMemo(() => {
    if (isValidJson && parsedJson) {
      return JSON.stringify(parsedJson, null, 2);
    }
    return rawString;
  }, [isValidJson, parsedJson, rawString]);

  const currentDisplayText = viewMode === 'raw' ? rawString : prettyJsonStr;

  const searchMatchCount = useMemo(() => {
    if (!searchTerm.trim() || !currentDisplayText) return 0;
    const term = searchTerm.trim().toLowerCase();
    const matches = currentDisplayText.toLowerCase().split(term).length - 1;
    return Math.max(0, matches);
  }, [currentDisplayText, searchTerm]);

  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);

  const scrollToMatch = (idx: number) => {
    setTimeout(() => {
      const matches = document.querySelectorAll('.json-search-match');
      if (matches.length > 0) {
        const targetIdx = Math.min(Math.max(0, idx), matches.length - 1);
        const target = matches[targetIdx] as HTMLElement;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          matches.forEach((m) => m.classList.remove('ring-4', 'ring-amber-400', 'bg-amber-400', 'text-slate-950'));
          target.classList.add('ring-4', 'ring-amber-400', 'bg-amber-400', 'text-slate-950');
        }
      }
    }, 80);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setActiveMatchIndex(0);
    if (val.trim()) scrollToMatch(0);
  };

  const handlePrevMatch = () => {
    if (searchMatchCount === 0) return;
    const nextIdx = activeMatchIndex > 0 ? activeMatchIndex - 1 : searchMatchCount - 1;
    setActiveMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handleNextMatch = () => {
    if (searchMatchCount === 0) return;
    const nextIdx = activeMatchIndex < searchMatchCount - 1 ? activeMatchIndex + 1 : 0;
    setActiveMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handleFindAll = () => {
    setMaxDepth(99);
    if (!isValidJson) setViewMode('pretty');
    scrollToMatch(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prettyJsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrollToTop = () => {
    bodyScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#060a12] flex flex-col shadow-2xl overflow-hidden relative ${className}`}>
      
      {/* ── 1. TITLE BAR (ALWAYS VISIBLE & COLLAPSIBLE TOGGLE) ───────────────── */}
      <div 
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#0d1322] border-b border-slate-800 select-none cursor-pointer group shrink-0 rounded-t-2xl"
        onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white transition-all shrink-0"
            title={isOutputCollapsed ? "Expand Output Panel" : "Collapse Output Panel"}
          >
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOutputCollapsed ? '-rotate-90' : ''}`} />
          </button>
          <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{title}</span>
          {isValidJson && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-mono font-bold">
              JSON {Array.isArray(parsedJson) ? 'Array' : 'Object'}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">
            {sizeKb} KB {keyCount > 0 ? `| ${keyCount} nodes` : ''}
          </span>
        </div>
      </div>

      {/* ── 2. TOOLBAR BUTTONS, SEARCH & BODY (HIDDEN WHEN COLLAPSED) ─────────── */}
      {!isOutputCollapsed && (
        <>
          {/* Sticky Toolbar Button Row (Solid Non-Transparent Background) */}
          <div className="sticky top-0 z-20 px-3.5 py-2 bg-[#090d16] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-md">
            {/* View Mode Switcher & Tools */}
            <div className="flex flex-wrap items-center gap-1.5 w-full justify-between">
              <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800/90">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  disabled={!isValidJson}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    viewMode === 'tree' && isValidJson
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                  title="Interactive JSON Tree with Collapsible Nodes"
                >
                  <ListTree className="h-3.5 w-3.5" />
                  <span>Tree</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('pretty')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    viewMode === 'pretty'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Beautified Indented JSON Text (2-space formatted)"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Beautify</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    viewMode === 'raw'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Raw Compact Unformatted Payload Text"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Raw</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Tree Expand/Collapse Controls with Icons */}
                {isValidJson && viewMode === 'tree' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMaxDepth(99)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                      title="Expand all JSON nodes"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Expand All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaxDepth(0)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                      title="Collapse all JSON nodes"
                    >
                      <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Collapse All</span>
                    </button>
                  </>
                )}

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-indigo-400" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Top FAB Button */}
                <button
                  type="button"
                  onClick={handleScrollToTop}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/90 border border-amber-800/90 text-amber-300 hover:bg-amber-900 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                  title="Scroll to top of server output"
                >
                  <ArrowUp className="h-3.5 w-3.5 text-amber-400" />
                  <span>Top</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── LIVE SEARCH & FIND CONTROLS BAR (NON-STICKY) ────────────────────── */}
          <div className="px-3.5 py-2 bg-[#060a12] border-b border-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1 text-xs focus-within:border-indigo-500 transition-colors">
              <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search keys, values, status, strings (e.g. businessId, FI, 200)..."
                className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-600 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Full Search Navigation Toolbar: Find All, Prev, Next, Match Index */}
            {searchTerm.trim() && (
              <div className="flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
                {/* Match Counter Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 font-mono text-[10px] font-bold">
                  <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>
                    {searchMatchCount > 0
                      ? `Match ${activeMatchIndex + 1} of ${searchMatchCount}`
                      : '0 matches'}
                  </span>
                </div>

                {/* Prev Match (↑) */}
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  disabled={searchMatchCount === 0}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Match (Shift+F3 / Up)"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>

                {/* Next Match (↓) */}
                <button
                  type="button"
                  onClick={handleNextMatch}
                  disabled={searchMatchCount === 0}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Match (F3 / Down)"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>

                {/* Find All Button */}
                <button
                  type="button"
                  onClick={handleFindAll}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900 text-[10px] font-mono font-bold transition-all cursor-pointer"
                  title="Expand all JSON nodes matching search"
                >
                  Find All
                </button>
              </div>
            )}
          </div>

          {/* ── VIEWER BODY CONTENT (SCROLLABLE INSIDE FROZEN HEADER CONTAINER) ───── */}
          <div ref={bodyScrollRef} className="p-4 overflow-x-auto overflow-y-auto max-h-[520px] flex-1 custom-scrollbar">
            {isValidJson && viewMode === 'tree' ? (
              <JsonTreeNode
                value={parsedJson}
                searchTerm={searchTerm}
                depth={0}
                maxDefaultDepth={maxDepth}
              />
            ) : (
              <pre className={`font-mono text-xs leading-relaxed selection:bg-indigo-900 selection:text-white ${
                viewMode === 'raw' ? 'whitespace-pre text-slate-300' : 'whitespace-pre-wrap text-emerald-300'
              }`}>
                {searchTerm.trim() ? (
                  // Highlighted text view with active match indexing
                  (() => {
                    let matchCounter = -1;
                    const term = searchTerm.trim();
                    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = currentDisplayText.split(regex);

                    return parts.map((part, i) => {
                      if (part.toLowerCase() === term.toLowerCase()) {
                        matchCounter++;
                        const isActive = matchCounter === activeMatchIndex;

                        return (
                          <mark
                            key={i}
                            className={`json-search-match rounded px-1 font-bold transition-all ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-lg font-black'
                                : 'bg-amber-400/30 text-amber-200 border border-amber-500/60'
                            }`}
                          >
                            {part}
                          </mark>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    });
                  })()
                ) : (
                  currentDisplayText
                )}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
};
