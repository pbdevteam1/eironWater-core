import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const { t, dir } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="relative mx-auto w-full max-w-xl" dir={dir}>
      <Search className="absolute top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground ltr:left-4 rtl:right-4" />
      <Input
        value={query}
        onChange={handleChange}
        placeholder={t('search.placeholder')}
        className="h-12 rounded-full border-primary/20 bg-card pl-12 pr-12 text-base shadow-md focus-visible:ring-primary rtl:pl-4 rtl:pr-12"
      />
    </div>
  );
};

export default SearchBar;
