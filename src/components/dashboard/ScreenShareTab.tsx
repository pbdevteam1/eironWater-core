import React from 'react';
import { Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const ScreenShareTab: React.FC = () => {
  const { t } = useLanguage();
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-12">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <Monitor className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">{t('screen.no_active')}</h2>
        <p className="text-center text-muted-foreground">{t('screen.no_sharing')}</p>
      </CardContent>
    </Card>
  );
};

export default ScreenShareTab;
