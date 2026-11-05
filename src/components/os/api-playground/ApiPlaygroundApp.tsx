'use client';

import React, { useState, useTransition } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Code2,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
} from 'lucide-react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiResponseData {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: string;
  isJson: boolean;
  sizeBytes: number;
}

interface ApiPreset {
  name: string;
  category: 'Local APIs' | 'External Testing';
  method: HttpMethod;
  url: string;
  description: string;
  body?: string;
  headers?: Array<{ key: string; value: string }>;
}

const PRESETS: ApiPreset[] = [
  {
    name: 'Travel Map Ledger',
    category: 'Local APIs',
    method: 'GET',
    url: '/api/os/travel',
    description: 'Fetch 64-district travel stats and visited records',
  },
  {
    name: 'Zahid OS Short Links',
    category: 'Local APIs',
    method: 'GET',
    url: '/api/os/short-links',
    description: 'List all active redirection short links',
  },
  {
    name: 'GitHub Profile & Repos',
    category: 'Local APIs',
    method: 'GET',
    url: '/api/github',
    description: 'Live GitHub user profile & recent repositories',
  },
  {
    name: 'Portfolio CMS Content',
    category: 'Local APIs',
    method: 'GET',
    url: '/api/content',
    description: 'Main portfolio profile, experiences & projects',
  },
  {
    name: 'OS System Settings',
    category: 'Local APIs',
    method: 'GET',
    url: '/api/os/settings',
    description: 'Zahid OS permissions, appearance & wallpaper',
  },
  {
    name: 'Public HTTP Echo (GET)',
    category: 'External Testing',
    method: 'GET',
    url: 'https://httpbin.org/get',
    description: 'Verify outbound CORS and client IP reflection',
  },
  {
    name: 'JSON Echo (POST)',
    category: 'External Testing',
    method: 'POST',
    url: 'https://httpbin.org/post',
    description: 'Test payload posting with custom JSON attributes',
    body: JSON.stringify(
      {
        sender: '0xZahidP',
        client: 'Zahid OS API Console',
        timestamp: new Date().toISOString(),
        tags: ['fullstack', 'developer-tools'],
      },
      null,
      2
    ),
    headers: [{ key: 'Content-Type', value: 'application/json' }],
  },
];

export const ApiPlaygroundApp: React.FC = () => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('/api/os/travel');
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { id: '1', key: 'Accept', value: 'application/json', enabled: true },
    { id: '2', key: 'Content-Type', value: 'application/json', enabled: false },
  ]);
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'presets'>('headers');
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');

  // Execution state
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponseData | null>(null);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [copiedBody, setCopiedBody] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);
  const [, startTransition] = useTransition();

  // Load Preset
  const handleLoadPreset = (preset: ApiPreset) => {
    startTransition(() => {
      setMethod(preset.method);
      setUrl(preset.url);
      setBody(preset.body || '');

      if (preset.headers && preset.headers.length > 0) {
        const newHeaders: HeaderRow[] = preset.headers.map((h, i) => ({
          id: `preset_${i}`,
          key: h.key,
          value: h.value,
          enabled: true,
        }));
        setHeaders(newHeaders);
      }

      if (preset.method !== 'GET' && preset.body) {
        setActiveTab('body');
      } else {
        setActiveTab('headers');
      }
    });
  };

  const addHeaderRow = () => {
    setHeaders((prev) => [
      ...prev,
      { id: String(Date.now()), key: '', value: '', enabled: true },
    ]);
  };

  const removeHeaderRow = (id: string) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHeaderRow = (
    id: string,
    field: 'key' | 'value' | 'enabled',
    val: string | boolean
  ) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  const prettifyJsonBody = () => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 2000);
    } catch {
      // Invalid JSON
      setError({
        type: 'json_error',
        message: 'Could not format: Request body contains invalid JSON syntax.',
      });
    }
  };

  const handleCopyResponseBody = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.body).then(() => {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    });
  };

  const handleSendRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setResponse(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError({ type: 'invalid_url', message: 'URL endpoint cannot be empty.' });
      return;
    }

    if (
      !trimmedUrl.startsWith('http://') &&
      !trimmedUrl.startsWith('https://') &&
      !trimmedUrl.startsWith('/')
    ) {
      setError({
        type: 'invalid_url',
        message:
          'URL must start with http://, https://, or a relative internal route starting with / (e.g. /api/os/travel)',
      });
      return;
    }

    // Construct headers dictionary
    const reqHeaders: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.enabled && h.key.trim()) {
        reqHeaders[h.key.trim()] = h.value.trim();
      }
    });

    const options: RequestInit = {
      method,
      headers: reqHeaders,
    };

    if (method !== 'GET' && body.trim()) {
      options.body = body;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const res = await fetch(trimmedUrl, options);
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      const textBody = await res.text();
      let isJson = false;
      let formattedBody = textBody;

      try {
        const parsed = JSON.parse(textBody);
        formattedBody = JSON.stringify(parsed, null, 2);
        isJson = true;
      } catch {
        isJson = false;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        durationMs,
        headers: resHeaders,
        body: formattedBody,
        isJson,
        sizeBytes: new Blob([textBody]).size,
      });
    } catch (err) {
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);
      const errMsg = err instanceof Error ? err.message : String(err);

      if (
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('network')
      ) {
        setError({
          type: 'cors',
          message: `Network or CORS policy blocked this request (${durationMs}ms). Direct browser calls to external hosts must allow CORS headers (Access-Control-Allow-Origin). Internal routes (e.g. /api/...) execute directly with full authorization.`,
        });
      } else {
        setError({
          type: 'unknown',
          message: `Request failed: ${errMsg}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadge = (m: HttpMethod) => {
    switch (m) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'POST':
        return 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
      case 'PUT':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'PATCH':
        return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
      case 'DELETE':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    }
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
          <CheckCircle2 className="size-3.5" />
          <span>{status} OK</span>
        </span>
      );
    }
    if (status >= 300 && status < 400) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
          <span>{status} REDIRECT</span>
        </span>
      );
    }
    if (status >= 400 && status < 500) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
          <AlertTriangle className="size-3.5" />
          <span>{status} CLIENT ERROR</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
        <AlertTriangle className="size-3.5" />
        <span>{status} SERVER ERROR</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto p-2 sm:p-5 select-none">
      {/* Top App Header */}
      <div className="p-5 sm:p-7 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
              <Terminal className="size-3.5 text-indigo-400" />
              <span>Zahid OS • Developer Utility Console</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>API Playground</span>
            </h2>

            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              In-browser HTTP & REST workbench. Test live FolioFrame endpoints, inspect JSON schemas,
              and prototype webhooks directly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              <span>Client-Side Safe</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Request Builder Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl space-y-4">
        {/* URL + Method + Send Button */}
        <form onSubmit={handleSendRequest} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {/* Method Selector */}
          <div className="shrink-0">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className={`w-full sm:w-auto h-11 px-3.5 rounded-2xl border font-mono font-black text-xs outline-hidden cursor-pointer transition-all ${getMethodBadge(
                method
              )}`}
            >
              <option value="GET" className="bg-zinc-900 text-emerald-400">GET</option>
              <option value="POST" className="bg-zinc-900 text-cyan-400">POST</option>
              <option value="PUT" className="bg-zinc-900 text-amber-400">PUT</option>
              <option value="PATCH" className="bg-zinc-900 text-purple-400">PATCH</option>
              <option value="DELETE" className="bg-zinc-900 text-rose-400">DELETE</option>
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. /api/os/travel or https://httpbin.org/get"
              className="w-full h-11 px-4 rounded-2xl border border-white/10 bg-white/5 text-xs text-white font-mono placeholder:text-white/30 outline-hidden focus:border-indigo-500/60 focus:bg-black/50 transition-all"
              required
            />
          </div>

          {/* Send Request Button */}
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-600/25 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-white" />
                <span>Send Request</span>
              </>
            )}
          </button>
        </form>

        {/* Tab Switcher: Headers, Body, Quick Presets */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveTab('headers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'headers'
                ? 'bg-white/15 text-white font-bold ring-1 ring-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Headers ({headers.filter((h) => h.enabled && h.key).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'body'
                ? 'bg-white/15 text-white font-bold ring-1 ring-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="size-3.5" />
            <span>Body {method !== 'GET' && <span className="size-1.5 rounded-full bg-indigo-400" />}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white/15 text-white font-bold ring-1 ring-white/20'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Quick Presets</span>
          </button>
        </div>

        {/* TAB 1: HEADERS BUILDER */}
        {activeTab === 'headers' && (
          <div className="space-y-2.5 pt-1">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {headers.map((h) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => updateHeaderRow(h.id, 'enabled', e.target.checked)}
                    className="size-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeaderRow(h.id, 'key', e.target.value)}
                    placeholder="Header Key (e.g. Authorization, Content-Type)"
                    className="flex-1 h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white font-mono placeholder:text-white/30 outline-hidden focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeaderRow(h.id, 'value', e.target.value)}
                    placeholder="Header Value"
                    className="flex-1 h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white font-mono placeholder:text-white/30 outline-hidden focus:border-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderRow(h.id)}
                    className="size-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 grid place-items-center transition-colors cursor-pointer shrink-0"
                    title="Remove Header"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={addHeaderRow}
                className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Header Row</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-mono">
                <span>Tip: Use</span>
                <span className="text-white/80 bg-white/10 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</span>
                <span>for Admin APIs</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REQUEST BODY */}
        {activeTab === 'body' && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-mono text-[11px]">JSON / Raw Request Payload</span>
              <button
                type="button"
                onClick={prettifyJsonBody}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="size-3" />
                <span>{formatSuccess ? '✓ Formatted!' : 'Prettify JSON'}</span>
              </button>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{\n  "name": "Example payload",\n  "status": "active"\n}'
              rows={6}
              className="w-full p-3.5 rounded-2xl border border-white/10 bg-black/50 text-xs text-white font-mono placeholder:text-white/20 outline-hidden focus:border-indigo-500/60 leading-relaxed [scrollbar-width:thin]"
            />
          </div>
        )}

        {/* TAB 3: QUICK PRESETS */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {PRESETS.map((p) => (
              <div
                key={p.name}
                onClick={() => handleLoadPreset(p)}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${getMethodBadge(p.method)}`}>
                    {p.method}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">{p.category}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-white/50 truncate font-mono mt-0.5">{p.url}</p>
                </div>
                <p className="text-[10px] text-white/40 leading-snug">{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3 text-rose-300">
          <AlertTriangle className="size-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold block">Request Notice ({error.type})</span>
            <p className="leading-relaxed opacity-90">{error.message}</p>
          </div>
        </div>
      )}

      {/* RESPONSE VIEWER */}
      {response && (
        <div className="p-4 sm:p-6 rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl space-y-4">
          {/* Response Meta Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(response.status)}
              <span className="text-xs font-mono text-white/50 flex items-center gap-1">
                <Clock className="size-3.5 text-cyan-400" />
                <span>{response.durationMs} ms</span>
              </span>
              <span className="text-xs font-mono text-white/50 flex items-center gap-1">
                <HardDrive className="size-3.5 text-indigo-400" />
                <span>{(response.sizeBytes / 1024).toFixed(2)} KB</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyResponseBody}
                className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedBody ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Tabs Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveResponseTab('body')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeResponseTab === 'body'
                  ? 'bg-white/20 text-white font-bold ring-1 ring-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Response Body {response.isJson && <span className="text-indigo-400 ml-1 font-mono">(JSON)</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveResponseTab('headers')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeResponseTab === 'headers'
                  ? 'bg-white/20 text-white font-bold ring-1 ring-white/20'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Headers ({Object.keys(response.headers).length})
            </button>
          </div>

          {/* Response Body Tab */}
          {activeResponseTab === 'body' && (
            <div className="relative">
              <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono text-emerald-300 leading-relaxed max-h-[460px] overflow-auto [scrollbar-width:thin] select-text">
                <code>{response.body || '/* Empty response body */'}</code>
              </pre>
            </div>
          )}

          {/* Response Headers Tab */}
          {activeResponseTab === 'headers' && (
            <div className="max-h-[360px] overflow-y-auto [scrollbar-width:thin] rounded-2xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/5 text-white/50 border-b border-white/10">
                  <tr>
                    <th className="p-2.5 font-bold">Header Key</th>
                    <th className="p-2.5 font-bold">Header Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <tr key={k} className="hover:bg-white/5">
                      <td className="p-2.5 text-cyan-400 font-semibold">{k}</td>
                      <td className="p-2.5 text-white/80 break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
