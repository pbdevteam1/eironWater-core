import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { defaultSettings, SystemSettings } from '@/data/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSave = () => {
    toast({ title: t('settings.saved'), description: t('settings.saved_desc') });
  };

  return (
    <Card className="max-w-2xl border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t('settings.title')}</CardTitle>
        <CardDescription>{t('settings.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('settings.cycle_times')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regularCycle">{t('settings.regular_cycle')}</Label>
              <Input id="regularCycle" type="number" min={1} value={settings.regularCycleTime} onChange={e => setSettings({ ...settings, regularCycleTime: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgentCycle">{t('settings.urgent_cycle')}</Label>
              <Input id="urgentCycle" type="number" min={1} value={settings.urgentCycleTime} onChange={e => setSettings({ ...settings, urgentCycleTime: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('settings.notifications')}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox id="urgentEmail" checked={settings.emailNotificationsUrgent} onCheckedChange={c => setSettings({ ...settings, emailNotificationsUrgent: !!c })} />
              <Label htmlFor="urgentEmail" className="cursor-pointer">{t('settings.notify_urgent')}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="exceededEmail" checked={settings.emailNotificationsExceeded} onCheckedChange={c => setSettings({ ...settings, emailNotificationsExceeded: !!c })} />
              <Label htmlFor="exceededEmail" className="cursor-pointer">{t('settings.notify_exceeded')}</Label>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto"><Save className="h-4 w-4" />{t('settings.save')}</Button>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
