import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';

const CustomerAuthContext = createContext();

const TOKEN_KEY = 'cps_session_token';

// Establish a real Supabase Auth session for the signed-in customer so RLS
// scopes every query to their own rows. Reuses an existing session when it
// already belongs to this customer.
async function syncDataSession(token, customerEmail) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.email?.toLowerCase() === customerEmail?.toLowerCase()) return;
  const res = await base44.functions.invoke('getCustomerSession', { session_token: token });
  const s = res.data?.supabase_session;
  if (s) await supabase.auth.setSession(s);
}

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(undefined); // undefined = loading, null = not logged in
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await base44.functions.invoke('getCustomerSession', { session_token: token });
      await syncDataSession(token, res.data.customer.email);
      setCustomer(res.data.customer);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (session_token, customerData) => {
    localStorage.setItem(TOKEN_KEY, session_token);
    try { await syncDataSession(session_token, customerData?.email); } catch (e) { console.error('data session failed', e); }
    setCustomer(customerData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    supabase.auth.signOut();
    setCustomer(null);
  };

  const refreshCustomer = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await base44.functions.invoke('getCustomerSession', { session_token: token });
      setCustomer(res.data.customer);
    } catch {
      logout();
    }
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, login, logout, refreshCustomer }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
};