import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const CustomerAuthContext = createContext();

const TOKEN_KEY = 'cps_session_token';

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

  const login = (session_token, customerData) => {
    localStorage.setItem(TOKEN_KEY, session_token);
    setCustomer(customerData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
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