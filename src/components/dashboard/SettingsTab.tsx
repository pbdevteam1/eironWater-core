import React, { useState } from 'react';
import { Save, Plus, X, UserPlus, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { registerUser } from '@/lib/register';
import { Badge } from '@/components/ui/badge';

const SettingsTab: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();

  // Email notifications for screen share
  const [notificationEmails, setNotificationEmails] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('meieiron_notify_emails') || '[]');
    } catch { return []; }
  });
  const [newEmail, setNewEmail] = useState('');

  // Register user
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Registered users list (local state for now)
  const [users, setUsers] = useState<string[]>([]);

  const handleAddEmail = () => {
    const email = newEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('settings.error'), description: t('settings.invalid_email'), variant: 'destructive' });
      return;
    }
    if (notificationEmails.includes(email)) {
      toast({ title: t('settings.error'), description: t('settings.email_exists'), variant: 'destructive' });
      return;
    }
    const updated = [...notificationEmails, email];
    setNotificationEmails(updated);
    localStorage.setItem('meieiron_notify_emails', JSON.stringify(updated));
    setNewEmail('');
    toast({ title: t('settings.saved'), description: t('settings.email_added') });
  };

  const handleRemoveEmail = (email: string) => {
    const updated = notificationEmails.filter(e => e !== email);
    setNotificationEmails(updated);
    localStorage.setItem('meieiron_notify_emails', JSON.stringify(updated));
  };

  const handleRegister = async () => {
    if (!regEmail.trim() || !regPassword.trim()) {
      toast({ title: t('settings.error'), description: t('settings.fill_fields'), variant: 'destructive' });
      return;
    }
    setIsRegistering(true);
    const result = await registerUser(regEmail.trim(), regPassword);
    setIsRegistering(false);
    if (result.success) {
      setUsers([...users, regEmail.trim()]);
      toast({ title: t('settings.saved'), description: t('settings.user_registered') });
      setRegEmail('');
      setRegPassword('');
    } else {
      toast({ title: t('settings.error'), description: result.error || t('settings.register_error'), variant: 'destructive' });
    }
  };

  const handleDeleteUser = (email: string) => {
    // Placeholder – API will be provided later
    setUsers(users.filter(u => u !== email));
    toast({ title: t('settings.saved'), description: t('settings.user_deleted') });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Screen share email notifications */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('settings.screen_notify_title')}
          </CardTitle>
          <CardDescription>{t('settings.screen_notify_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('settings.enter_email')}
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
            />
            <Button onClick={handleAddEmail} size="sm" className="shrink-0">
              <Plus className="h-4 w-4" />
              {t('settings.add')}
            </Button>
          </div>
          {notificationEmails.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {notificationEmails.map(email => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1 py-1.5 px-3 text-sm">
                  {email}
                  <button onClick={() => handleRemoveEmail(email)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('settings.no_emails')}</p>
          )}
        </CardContent>
      </Card>

      {/* Add user */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('settings.add_user_title')}
          </CardTitle>
          <CardDescription>{t('settings.add_user_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regEmail">{t('login.email')}</Label>
              <Input
                id="regEmail"
                type="email"
                placeholder="user@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">{t('login.password')}</Label>
              <Input
                id="regPassword"
                type="password"
                placeholder="••••••"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleRegister} disabled={isRegistering} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            {isRegistering ? t('settings.registering') : t('settings.register_user')}
          </Button>

          {/* Users list */}
          {users.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{t('settings.registered_users')}</h4>
              <div className="space-y-2">
                {users.map(email => (
                  <div key={email} className="flex items-center justify-between rounded-md border border-border p-3 bg-muted/30">
                    <span className="text-sm">{email}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(email)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
