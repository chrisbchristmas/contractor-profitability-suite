import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useCustomerAuth } from '@/lib/CustomerAuthContext';

export default function Register() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('registerCustomer', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      });
      login(res.data.session_token, res.data.customer);
      navigate('/Dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-muted-foreground mt-3 text-sm">Start your 14-day free trial</p>
        </div>

        {/* Trial perks */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 flex flex-col gap-2">
          {['No credit card required', '14-day free trial', 'Cancel anytime'].map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {perk}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <Input placeholder="John Smith" value={form.full_name} onChange={set('full_name')} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <Input type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <Input type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="consent"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                I agree to the{' '}
                <a href="/Terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/PrivacyPolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={loading || !agreed}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}