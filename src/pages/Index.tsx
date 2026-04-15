import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import OtpVerification from '@/components/OtpVerification';
import Dashboard from '@/components/Dashboard';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading, otpRequired } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (otpRequired) return <OtpVerification />;
  return isAuthenticated ? <Dashboard /> : <LoginForm />;
};

export default Index;
