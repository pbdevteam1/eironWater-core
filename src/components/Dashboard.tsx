import React from 'react';
import { LayoutDashboard, ClipboardList, Monitor, Settings, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

import DashboardTab from '@/components/dashboard/DashboardTab';
import RequestsTab from '@/components/dashboard/RequestsTab';
import ScreenShareTab from '@/components/dashboard/ScreenShareTab';
import SettingsTab from '@/components/dashboard/SettingsTab';

interface DashboardProps {
  onBack?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen" dir={dir}>
      <Header />
      <main className="container mx-auto px-4 py-6">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-2">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {t('nav.home')}
          </Button>
        )}
        <Tabs defaultValue="dashboard" dir={dir} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 gap-2 bg-muted p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.forms')}</span>
            </TabsTrigger>
            <TabsTrigger value="screenshare" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">שיתוף מסך</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.settings')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 animate-in fade-in-50"><DashboardTab /></TabsContent>
          <TabsContent value="requests" className="mt-0 animate-in fade-in-50"><RequestsTab /></TabsContent>
          <TabsContent value="screenshare" className="mt-0 animate-in fade-in-50"><ScreenShareTab /></TabsContent>
          <TabsContent value="settings" className="mt-0 animate-in fade-in-50"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
