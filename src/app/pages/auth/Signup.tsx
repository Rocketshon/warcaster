import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isEmailValid && isPasswordValid && doPasswordsMatch && displayName.trim().length > 0;

  const handleCreateAccount = async () => {
    if (!isFormValid || loading) return;
    setError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      toast.success('Account created! Check your email to confirm.');
      navigate('/market');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-sm mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-6"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--accent-gold)] tracking-wider mb-1">WARCASTER</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create your account</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Battle-Brother Maximus"
              autoComplete="name"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="battle-brother@imperium.gov"
              autoComplete="email"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-400 mt-1">Enter a valid email address</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
            {password && !isPasswordValid && (
              <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateAccount(); }}
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
            {confirmPassword && !doPasswordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateAccount}
            disabled={!isFormValid || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm transition-all hover:bg-[var(--accent-gold)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create Account
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent-gold)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
