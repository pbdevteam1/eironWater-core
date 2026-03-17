import React, { useState } from 'react';
import { FolderOpen, CalendarDays, FileText, Leaf, Home, Droplets, Gavel, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';

interface ServiceItem {
  icon: React.ElementType;
  labelKey: string;
  color: string;
  bgColor: string;
}

const services: ServiceItem[] = [
  { icon: FolderOpen, labelKey: 'nav.resident_file', color: 'text-primary', bgColor: 'bg-primary/10' },
  { icon: CalendarDays, labelKey: 'nav.appointments', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { icon: FileText, labelKey: 'nav.forms', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
  { icon: Leaf, labelKey: 'nav.green_bill', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  { icon: Home, labelKey: 'nav.moving', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  { icon: Droplets, labelKey: 'nav.new_line', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/10' },
  { icon: Gavel, labelKey: 'nav.tenders', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
  { icon: CreditCard, labelKey: 'nav.payment', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
];

const HomePage: React.FC = () => {
  const { t, dir } = useLanguage();
  const [activePage, setActivePage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (activePage === 'dashboard') {
    return <Dashboard onBack={() => setActivePage(null)} />;
  }

  const filteredServices = services.filter(s =>
    !searchQuery || t(s.labelKey).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" dir={dir}>
      <Header />

      {/* Hero section with YouTube video background */}
      <div className="relative overflow-hidden px-4 pb-20 pt-12" style={{ minHeight: '320px' }}>
        {/* YouTube video background */}
        <div className="absolute inset-0 z-0">
          <iframe
            src="https://www.youtube.com/embed/jbxokvK39mw?autoplay=1&mute=1&loop=1&playlist=jbxokvK39mw&controls=0&showinfo=0&modestbranding=1&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2"
            style={{ border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Water background video"
          />
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 z-[1] bg-primary/50" />
        {/* Content */}
        <div className="relative z-[2] mx-auto max-w-xl text-center">
          <h2 className="mb-2 text-3xl font-bold text-primary-foreground">{t('app.name')}</h2>
          <p className="mb-8 text-primary-foreground/80">{t('app.subtitle')}</p>
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>

      {/* Service grid - overlaps the hero */}
      <div className="container mx-auto -mt-10 px-4 pb-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filteredServices.map((service) => (
            <Card
              key={service.labelKey}
              className="group cursor-pointer border-none bg-card p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => setActivePage('dashboard')}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.bgColor} transition-transform group-hover:scale-110`}>
                  <service.icon className={`h-7 w-7 ${service.color}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">{t(service.labelKey)}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card py-6 text-center">
        <p className="text-sm text-muted-foreground">© 2026 {t('app.name')} - {t('app.subtitle')}</p>
      </footer>
    </div>
  );
};

export default HomePage;
