import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw, Wrench } from 'lucide-react';
import { runSystemCheck, SETUP_SQL_PATH, type CheckResult } from '../../lib/systemCheck';
import { getDiagnostics } from '../../lib/adminErrors';

/** Developer-only diagnostics (linked in the sidebar for super_admin accounts only). */
export default function AdminSystem() {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState(getDiagnostics());

  const run = useCallback(async () => {
    setRunning(true);
    const r = await runSystemCheck();
    setResults(r);
    setLog(getDiagnostics());
    setRunning(false);
  }, []);

  useEffect(() => { void run(); }, [run]);

  const failing = results?.filter(r => !r.ok) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Wrench size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">System Check</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Developer diagnostics. Not visible to standard admin accounts.</p>
        </div>
        <button onClick={() => void run()} disabled={running} className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/40 rounded-lg text-sm font-semibold text-on-surface hover:text-tertiary cursor-pointer disabled:opacity-50">
          {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Re-run
        </button>
      </div>

      {results && failing.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm text-on-surface space-y-2">
          <p className="font-semibold">Setup incomplete ({failing.length} check{failing.length === 1 ? '' : 's'} failing)</p>
          <ol className="list-decimal pl-5 space-y-1 text-on-surface-variant">
            <li>Open Supabase → SQL Editor → New query.</li>
            <li>Paste the full contents of <code className="font-mono text-tertiary">{SETUP_SQL_PATH}</code> and click Run. It is safe to run more than once and does not delete content.</li>
            <li>Come back here and press Re-run.</li>
          </ol>
        </div>
      )}
      {results && failing.length === 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} /> All checks passed.
        </div>
      )}

      <ul className="rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/20 bg-surface-container-low">
        {(results ?? []).map(r => (
          <li key={r.id} className="p-4 flex items-start gap-3">
            {r.ok ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface">{r.label}</p>
              <p className="text-xs text-on-surface-variant font-mono break-words">{r.detail}</p>
            </div>
          </li>
        ))}
        {!results && <li className="p-6 text-sm text-on-surface-variant flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Running checks…</li>}
      </ul>

      <div>
        <h3 className="font-display text-lg font-semibold text-on-surface mb-2">Recent technical errors (this browser session)</h3>
        {log.length === 0 ? (
          <p className="text-sm text-on-surface-variant">None recorded.</p>
        ) : (
          <ul className="rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/20 bg-surface-container-low text-xs font-mono">
            {log.map((e, i) => (
              <li key={i} className="p-3 break-words">
                <span className="text-on-surface-variant">{new Date(e.at).toLocaleTimeString('en-GB')}</span>{' '}
                <span className="text-tertiary">{e.context}</span>{e.code ? <span className="text-on-surface-variant"> [{e.code}]</span> : null}
                <div className="text-on-surface mt-0.5">{e.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
