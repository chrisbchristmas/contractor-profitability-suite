import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useCustomerAuth } from '@/lib/CustomerAuthContext';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

export default function CustomerLogin() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfter = searchParams.get('redirect') || '/Dashboard';

  // Handle Google OAuth callback and reset token on mount
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth');
    const token = searchParams.get('reset_token');

    if (googleAuth === '1') {
      handleGoogleCallback();
    } else if (token) {
      setResetToken(token);
      setView('reset');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCallback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('googleAuthCustomer', {});
      login(res.data.session_token, res.data.customer);
      navigate(redirectAfter);
    } catch (err) {
      setError(err?.response?.data?.error || 'Google sign-in failed. Please try again.');
      setView('login');
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError('');
    const returnUrl = `${window.location.origin}/login?google_auth=1&redirect=${encodeURIComponent(redirectAfter)}`;
    base44.auth.redirectToLogin(returnUrl);
  };

  const switchView = (next) => {
    setView(next);
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('loginCustomer', { email, password });
      login(res.data.session_token, res.data.customer);
      navigate(redirectAfter);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('registerCustomer', { email, password });
      login(res.data.session_token, res.data.customer);
      navigate('/Billing');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.functions.invoke('forgotPassword', { email });
      setInfo('If an account exists with that email, a reset link has been sent. Please check your inbox.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('resetPassword', { reset_token: resetToken, password });
      login(res.data.session_token, res.data.customer);
      navigate(redirectAfter);
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgot = view === 'forgot';
  const isReset = view === 'reset';

  const heading = isLogin ? 'Sign in to your account'
    : isRegister ? 'Create your account'
    : isForgot ? 'Reset your password'
    : 'Set a new password';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground text-xl">Contractor Pro</span>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">{heading}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          {/* Google OAuth — shown for login and register views */}
          {(isLogin || isRegister) && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 mb-4 border-border"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <GoogleIcon />
                <span className="ml-2">Continue with Google</span>
              </Button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* Login / Register form */}
          {(isLogin || isRegister) && (
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <Input
                    placeholder="John Smith"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={!isRegister}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading}>
                {loading
                  ? (isLogin ? 'Signing in...' : 'Creating account...')
                  : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          )}

          {/* Forgot password form */}
          {isForgot && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              {info && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{info}</p>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* Reset password form */}
          {isReset && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-6 space-y-2">
            {isLogin && (
              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={() => switchView('forgot')} className="text-blue-600 font-medium hover:underline">
                  Forgot password?
                </button>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => switchView('register')} className="text-blue-600 font-medium hover:underline">
                    Sign up
                  </button>
                </>
              ) : isRegister ? (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => switchView('login')} className="text-blue-600 font-medium hover:underline">
                    Sign in
                  </button>
                </>
              ) : (isForgot || isReset) && (
                <button type="button" onClick={() => switchView('login')} className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}