import React from 'react';
import { Globe, LogOut } from 'lucide-react';
import logo from '@/assets/meiah-logo.png';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();

  const langLabels: Record<Language, string> = { he: 'עברית', ar: 'العربية', en: 'English' };

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-lg" dir={dir}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="מי עירון" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-lg font-bold leading-tight text-primary-foreground">{t('app.name')}</h1>
            <p className="text-xs text-primary-foreground/70">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-primary-foreground/70" />
            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="h-8 w-[100px] border-primary-foreground/20 bg-primary-foreground/10 text-sm text-primary-foreground focus:ring-primary-foreground/30">
                <SelectValue>{langLabels[language]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ThemeToggle />

          {isAuthenticated && user && (
            <>
              <span className="hidden text-sm text-primary-foreground sm:inline">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
