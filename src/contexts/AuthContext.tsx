import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as apiLogin, getStoredToken, clearToken, refreshTokenExpiry, setToken } from '@/lib/api';
import { verifyOtp as apiVerifyOtp } from '@/lib/otp';

interface User { email: string; name: string; }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  otpRequired: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verifyOtp: (otpCode: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<void>;
  cancelOtp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const storedEmail = localStorage.getItem('meieiron_user_email');
      if (storedEmail) setUser({ email: storedEmail, name: storedEmail.split('@')[0] });
    }
    setIsLoading(false);
  }, []);

  const handleActivity = useCallback(() => { if (user) refreshTokenExpiry(); }, [user]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, handleActivity, { passive: true }));
    return () => { events.forEach(e => document.removeEventListener(e, handleActivity)); };
  }, [handleActivity]);

  useEffect(() => {
    if (!user) return;
    const check = setInterval(() => { if (!getStoredToken()) { setUser(null); localStorage.removeItem('meieiron_user_email'); } }, 30000);
    return () => clearInterval(check);
  }, [user]);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.requiresOtp) {
      setPendingEmail(email); setPendingPassword(password); setOtpRequired(true);
      return { success: true };
    }
    if (result.success) {
      localStorage.setItem('meieiron_user_email', email);
      setUser({ email, name: email.split('@')[0] });
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const verifyOtp = async (otpCode: string) => {
    if (!pendingEmail) return { success: false, error: 'No pending email' };
    const result = await apiVerifyOtp(pendingEmail, otpCode);
    if (result.success && result.accessToken) {
      setToken(result.accessToken);
      localStorage.setItem('meieiron_user_email', pendingEmail);
      setUser({ email: pendingEmail, name: pendingEmail.split('@')[0] });
      setOtpRequired(false); setPendingEmail(null); setPendingPassword(null);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const resendOtp = async () => { if (pendingEmail && pendingPassword) await apiLogin(pendingEmail, pendingPassword); };
  const cancelOtp = () => { setOtpRequired(false); setPendingEmail(null); setPendingPassword(null); };
  const logout = () => { clearToken(); localStorage.removeItem('meieiron_user_email'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, otpRequired, pendingEmail, login, logout, verifyOtp, resendOtp, cancelOtp }}>
      {children}
    </AuthContext.Provider>
  );
};
