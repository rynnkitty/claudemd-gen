import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SourceType } from '@claudemd-gen/shared';
import type { AnalyzeResponse } from '@claudemd-gen/shared';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

type AppState = 'input' | 'loading' | 'result';
type TabId = 'claude' | 'prd';
type InputMode = 'url' | 'zip';

// ─────────────────────────────────────────────────────
// Design tokens (inline — no Tailwind needed for theme)
// ─────────────────────────────────────────────────────

const T = {
  bg:       '#0c0b09',
  surface:  '#161512',
  surface2: '#1e1c18',
  border:   '#2a2824',
  text:     '#f7f3ed',
  muted:    '#7a7268',
  dim:      '#4a4840',
  accent:   '#c6f135',
  error:    '#ff6b6b',
  font:     "'JetBrains Mono', 'Menlo', monospace",
  serif:    "'Fraunces', 'Georgia', serif",
} as const;

const STEPS = [
  'Reading project structure',
  'Detecting tech stack',
  'Analyzing dependencies',
  'Generating CLAUDE.md',
  'Drafting PRD',
];

// ─────────────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────────────

function LoadingScreen({ step }: { step: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2.5rem',
    }}>
      {/* Spinner */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `2px solid ${T.border}`,
        borderTopColor: T.accent,
        animation: 'spin 0.9s linear infinite',
      }} />

      {/* Steps list */}
      <div style={{ width: '100%', maxWidth: 340 }}>
        {STEPS.map((label, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.45rem 0',
              opacity: done || active ? 1 : 0.28,
              transition: 'opacity 0.35s ease',
            }}>
              <span style={{
                width: 18,
                height: 18,
                flexShrink: 0,
                borderRadius: '50%',
                background:   done   ? T.accent  : 'transparent',
                border:       done   ? 'none'
                            : active ? `2px solid ${T.accent}`
                            : `2px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: T.bg,
                fontFamily: T.font,
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : ''}
              </span>
              <span style={{
                fontFamily: T.font,
                fontSize: '0.78rem',
                color: done ? T.accent : active ? T.text : T.muted,
                transition: 'color 0.3s',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Result Screen
// ─────────────────────────────────────────────────────

function ResultScreen({
  result,
  activeTab,
  setActiveTab,
  onReset,
}: {
  result:       AnalyzeResponse;
  activeTab:    TabId;
  setActiveTab: (t: TabId) => void;
  onReset:      () => void;
}) {
  const [copied, setCopied] = useState(false);
  const content  = activeTab === 'claude' ? result.generatedFiles.claudeMd : result.generatedFiles.prdMd;
  const filename = activeTab === 'claude' ? 'CLAUDE.md' : 'PRD.md';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const { metadata, projectInfo } = result;

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeUp 0.4s ease both',
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexShrink: 0,
      }}>
        <button onClick={onReset} style={{
          background: 'none', border: 'none',
          color: T.muted, fontFamily: T.font,
          fontSize: '0.72rem', cursor: 'pointer',
          padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          ← new analysis
        </button>

        <div style={{
          display: 'flex', gap: '1.25rem',
          fontFamily: T.font, fontSize: '0.72rem', color: T.muted,
          flexWrap: 'wrap', justifyContent: 'flex-end',
        }}>
          <span style={{ color: T.accent, fontWeight: 600 }}>{projectInfo.name}</span>
          <span>{metadata.fileCount} files</span>
          <span>{(metadata.analysisTimeMs / 1000).toFixed(1)}s</span>
          {projectInfo.techStack.languages.length > 0 && (
            <span>{projectInfo.techStack.languages.slice(0, 3).join(' · ')}</span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex' }}>
          {(['claude', 'prd'] as TabId[]).map((tab) => {
            const label  = tab === 'claude' ? 'CLAUDE.md' : 'PRD.md';
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: 'none', border: 'none',
                borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
                color:     active ? T.text : T.muted,
                fontFamily: T.font, fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '0.7rem 1rem 0.7rem 0',
                marginRight: '1.25rem',
                transition: 'color 0.2s',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 0' }}>
          <button onClick={handleCopy} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            color: copied ? T.accent : T.text,
            fontFamily: T.font, fontSize: '0.72rem',
            cursor: 'pointer', padding: '0.38rem 0.85rem',
            borderRadius: 4, transition: 'all 0.2s',
          }}>
            {copied ? '✓ copied' : 'copy'}
          </button>
          <button onClick={handleDownload} style={{
            background: T.accent, border: 'none',
            color: T.bg,
            fontFamily: T.font, fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer', padding: '0.38rem 0.85rem',
            borderRadius: 4,
          }}>
            ↓ {filename}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem 1.5rem' }}>
        <pre style={{
          fontFamily: T.font, fontSize: '0.8rem', lineHeight: 1.75,
          color: T.text, background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 6,
          padding: '2rem', margin: '0 auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxWidth: 860,
        }}>
          {content}
        </pre>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Input Screen
// ─────────────────────────────────────────────────────

function InputScreen({
  inputMode, setInputMode,
  urlValue,  setUrlValue,
  file,      setFile,
  isDragOver, onDragOver, onDragLeave, onDrop,
  onSubmit, error, fileInputRef,
}: {
  inputMode:    InputMode;
  setInputMode: (m: InputMode) => void;
  urlValue:     string;
  setUrlValue:  (v: string) => void;
  file:         File | null;
  setFile:      (f: File | null) => void;
  isDragOver:   boolean;
  onDragOver:   (e: React.DragEvent) => void;
  onDragLeave:  () => void;
  onDrop:       (e: React.DragEvent) => void;
  onSubmit:     () => void;
  error:        string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const canSubmit = inputMode === 'url' ? urlValue.trim() !== '' : file !== null;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      animation: 'fadeUp 0.5s ease both',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Hero heading */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontFamily: T.serif,
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: 300, color: T.text,
            margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05,
          }}>
            claude<span style={{ color: T.accent, fontStyle: 'italic' }}>md</span>
            {' '}
            <span style={{ fontStyle: 'italic', fontWeight: 300 }}>gen</span>
          </h1>
          <p style={{
            fontFamily: T.font, fontSize: '0.76rem',
            color: T.muted, margin: '0.85rem 0 0',
            letterSpacing: '0.06em',
          }}>
            generate CLAUDE.md + PRD from any codebase
          </p>
        </div>

        {/* Mode pills */}
        <div style={{
          display: 'flex', background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 6,
          padding: 3, marginBottom: '0.75rem',
        }}>
          {(['url', 'zip'] as InputMode[]).map((mode) => {
            const label  = mode === 'url' ? 'GitHub URL' : 'ZIP Upload';
            const active = inputMode === mode;
            return (
              <button key={mode} onClick={() => setInputMode(mode)} style={{
                flex: 1, background: active ? T.surface2 : 'none', border: 'none',
                color: active ? T.text : T.muted,
                fontFamily: T.font, fontSize: '0.76rem',
                cursor: 'pointer', padding: '0.52rem',
                borderRadius: 4, transition: 'all 0.2s',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Input area */}
        {inputMode === 'url' ? (
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && onSubmit()}
            placeholder="https://github.com/owner/repo"
            style={{
              width: '100%', background: T.surface,
              border: `1px solid ${error ? T.error : T.border}`,
              borderRadius: 6, color: T.text,
              fontFamily: T.font, fontSize: '0.875rem',
              padding: '0.875rem 1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
        ) : (
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: isDragOver ? T.surface2 : T.surface,
              border: `1px dashed ${isDragOver ? T.accent : file ? T.accent : T.border}`,
              borderRadius: 6, padding: '2.5rem 2rem',
              textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef} type="file" accept=".zip"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
            />
            <div style={{
              fontFamily: T.font, fontSize: '0.8rem',
              color: file ? T.accent : T.muted,
            }}>
              {file
                ? `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
                : 'drop .zip here or click to browse'}
            </div>
            {file && (
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{
                  background: 'none', border: 'none',
                  color: T.dim, fontFamily: T.font,
                  fontSize: '0.68rem', cursor: 'pointer',
                  marginTop: '0.4rem', padding: 0,
                }}
              >
                remove
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: T.font, fontSize: '0.72rem',
            color: T.error, margin: '0.6rem 0 0',
          }}>
            ✗ {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', marginTop: '0.875rem',
            background: canSubmit ? T.accent : T.surface,
            border: `1px solid ${canSubmit ? T.accent : T.border}`,
            color: canSubmit ? T.bg : T.dim,
            fontFamily: T.font, fontSize: '0.875rem', fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            padding: '0.875rem', borderRadius: 6,
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}
        >
          generate →
        </button>

        {/* Footnote */}
        <p style={{
          textAlign: 'center', fontFamily: T.font,
          fontSize: '0.68rem', color: T.dim,
          marginTop: '1.5rem', lineHeight: 1.6,
        }}>
          public GitHub repos only · max 5,000 files · ZIP max 50 MB
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// App (root)
// ─────────────────────────────────────────────────────

export default function App(): React.ReactElement {
  const [appState,   setAppState]   = useState<AppState>('input');
  const [inputMode,  setInputMode]  = useState<InputMode>('url');
  const [urlValue,   setUrlValue]   = useState('');
  const [file,       setFile]       = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result,     setResult]     = useState<AnalyzeResponse | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<TabId>('claude');
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animate loading steps while waiting for API
  useEffect(() => {
    if (appState !== 'loading') return;
    setLoadingStep(0);
    const timings = [700, 1700, 2700, 3700];
    const ids = timings.map((ms, i) => setTimeout(() => setLoadingStep(i + 1), ms));
    return () => ids.forEach(clearTimeout);
  }, [appState]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setAppState('loading');
    try {
      let response: AnalyzeResponse;

      if (inputMode === 'zip' && file) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/analyze/upload', { method: 'POST', body: form });
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(d.message ?? `Server error ${res.status}`);
        }
        response = await res.json() as AnalyzeResponse;
      } else {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: { type: SourceType.GITHUB_URL, value: urlValue } }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(d.message ?? `Server error ${res.status}`);
        }
        response = await res.json() as AnalyzeResponse;
      }

      setResult(response);
      setActiveTab('claude');
      setAppState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setAppState('input');
    }
  }, [inputMode, file, urlValue]);

  if (appState === 'loading') {
    return <LoadingScreen step={loadingStep} />;
  }

  if (appState === 'result' && result) {
    return (
      <ResultScreen
        result={result}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={() => { setAppState('input'); setResult(null); setUrlValue(''); setFile(null); }}
      />
    );
  }

  return (
    <InputScreen
      inputMode={inputMode}   setInputMode={setInputMode}
      urlValue={urlValue}     setUrlValue={setUrlValue}
      file={file}             setFile={setFile}
      isDragOver={isDragOver}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith('.zip')) setFile(f);
      }}
      onSubmit={handleSubmit}
      error={error}
      fileInputRef={fileInputRef}
    />
  );
}
