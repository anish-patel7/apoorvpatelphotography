import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-[48px] text-on-surface mb-2 leading-tight">Admin</h1>
          <p className="text-on-surface-variant text-sm">Sign in to manage your website</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-sm p-8 border border-outline-variant/20 space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-sm p-3 text-error text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2 tracking-[0.1em] uppercase">Email</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@apoorvpatelphotography.com"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-sm pl-10 pr-4 py-3 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/30 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2 tracking-[0.1em] uppercase">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-sm pl-10 pr-4 py-3 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/30 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-on-background text-background font-semibold rounded-sm hover:bg-tertiary hover:text-on-tertiary transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
