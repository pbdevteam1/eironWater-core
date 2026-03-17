import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowRight, Timer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { maskEmail } from '@/lib/otp';
import Header from '@/components/Header';

const OtpVerification: React.FC = () => {
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { pendingEmail, verifyOtp, resendOtp, cancelOtp } = useAuth();
  const { t, dir } = useLanguage();

  useEffect(() => { if (timeLeft <= 0) return; const timer = setInterval(() => setTimeLeft(t => t - 1), 1000); return () => clearInterval(timer); }, [timeLeft]);
  useEffect(() => { if (resendCooldown <= 0) return; const timer = setInterval(() => setResendCooldown(t => t - 1), 1000); return () => clearInterval(timer); }, [resendCooldown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6 || isLoading || timeLeft <= 0) return;
    setIsLoading(true); setError('');
    try { const r = await verifyOtp(code); if (!r.success) { setError(r.error || 'קוד שגוי'); setOtpValue(''); } }
    catch { setError('שגיאה באימות'); setOtpValue(''); }
    finally { setIsLoading(false); }
  }, [isLoading, timeLeft, verifyOtp]);

  useEffect(() => { if (otpValue.length === 6) handleVerify(otpValue); }, [otpValue, handleVerify]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await resendOtp(); setTimeLeft(300); setResendCooldown(60); setOtpValue('');
  };

  const timerExpired = timeLeft <= 0;
  const maskedEmail = pendingEmail ? maskEmail(pendingEmail) : '';

  return (
    <div className="min-h-screen" dir={dir}>
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-4xl">💧</span>
            </div>
            <CardTitle className="text-2xl font-bold">{t('otp.title')}</CardTitle>
            <CardDescription>{t('otp.description')}</CardDescription>
            {maskedEmail && <p className="mt-1 text-sm font-medium text-primary">{maskedEmail}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-center text-sm text-destructive">{error}</div>}
            {timerExpired && <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-center text-sm text-destructive">{t('otp.expired')}</div>}
            <div className="flex justify-center" dir="ltr">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} disabled={isLoading || timerExpired}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-14 w-12 text-xl font-bold" />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Timer className={`h-4 w-4 ${timerExpired ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-mono ${timerExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                {timerExpired ? '0:00' : `${t('otp.expires_in')} ${formatTime(timeLeft)}`}
              </span>
            </div>
            <Button onClick={() => handleVerify(otpValue)} className="w-full" disabled={otpValue.length !== 6 || isLoading || timerExpired}>
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />{t('otp.verifying')}</>) : t('otp.verify')}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button onClick={cancelOtp} className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline">
                {t('otp.back')}<ArrowRight className="h-3 w-3" />
              </button>
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">{t('otp.resend_wait')} {resendCooldown} {t('otp.seconds')}</span>
              ) : (
                <button onClick={handleResend} className="flex items-center gap-1 text-primary hover:underline">
                  <RefreshCw className="h-3 w-3" />{t('otp.resend')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OtpVerification;
