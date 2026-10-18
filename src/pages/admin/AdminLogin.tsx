import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, Loader2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { isSupabaseConfigured } from '../../lib/supabase';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function AdminLogin({ onLogin }: Props) {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(email, password);
      navigate('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevPreview = async () => {
    setError(null);
    setLoading(true);
    try {
      await onLogin('developer@localhost', '');
      navigate('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Developer preview initialization failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SEO
        title="Admin Portal | Apoorv Patel Photography"
        description="Secure administrator authentication portal."
        noindex={true}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-tertiary/10 border border-tertiary/30 flex items-center justify-center text-tertiary mx-auto mb-4 shadow-lg">
            <Lock size={26} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-on-surface mb-2 font-bold tracking-tight">
            Studio Admin Portal
          </h1>
          <p className="text-on-surface-variant text-xs">
            Sign in to manage your website
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/30 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3.5 bg-error/15 border border-error/30 rounded-xl text-error text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-[0.1em] uppercase"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@apoorvpatelphotography.com"
                  autoComplete="username"
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-10 pr-4 py-2.5 text-on-surface text-sm focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-[0.1em] uppercase"
              >
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  id="admin-password"
                  type="password"
                  required={isSupabaseConfigured}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-10 pr-4 py-2.5 text-on-surface text-sm focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-tertiary text-on-tertiary font-semibold rounded-lg text-sm hover:bg-tertiary-fixed transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Development sandbox preview button (only shown in local development when offline) */}
          {isDev && !isSupabaseConfigured && (
            <div className="pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={handleDevPreview}
                disabled={loading}
                className="w-full py-2 bg-surface-container border border-tertiary/30 text-tertiary text-xs rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Open Local Preview</span>
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors font-medium"
            >
              <ArrowLeft size={14} /> Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
