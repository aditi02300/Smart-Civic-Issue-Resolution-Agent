import { useState, useEffect } from 'react';
import { Building2, Mail, Lock, User as UserIcon, Shield, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navigate } from '@/lib/router';
import type { UserRole } from '@/lib/types';

export default function AuthPage() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hash = window.location.hash;
    const queryString = hash.split('?')[1];
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const m = params.get('mode');
      if (m === 'signup' || m === 'signin') setMode(m);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('landing');
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, role);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (msg.toLowerCase().includes('invalid login')) {
        setError('Invalid email or password.');
      } else {
        setError('Could not complete the request. Please try again.');
      }
      console.error('auth error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center px-6 py-12">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm mb-6">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Civic Issue Resolution Platform</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-sm text-slate-500">
            {mode === 'signin' ? 'Sign in to report and track civic issues.' : 'Sign up to start reporting issues in your area.'}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
          {/* Mode toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Role (signup only) */}
            {mode === 'signup' && (
              <div className="animate-[fadeIn_0.3s_ease]">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${role === 'citizen' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${role === 'citizen' ? 'bg-blue-100' : 'bg-slate-50'}`}>
                      <UserIcon className={`w-4 h-4 ${role === 'citizen' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${role === 'citizen' ? 'text-slate-900' : 'text-slate-600'}`}>Citizen</p>
                      <p className="text-xs text-slate-400">Report issues</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${role === 'admin' ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${role === 'admin' ? 'bg-blue-100' : 'bg-slate-50'}`}>
                      <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${role === 'admin' ? 'text-slate-900' : 'text-slate-600'}`}>Admin</p>
                      <p className="text-xs text-slate-400">Manage all</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Switch mode link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
