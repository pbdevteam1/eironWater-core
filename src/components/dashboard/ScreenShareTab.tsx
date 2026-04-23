import React, { useEffect, useState } from 'react';
import { Monitor, RefreshCw, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStoredToken } from '@/lib/api';

interface OnlineVisitor {
  id?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';

const ScreenShareTab: React.FC = () => {
  const { t } = useLanguage();
  const [visitors, setVisitors] = useState<OnlineVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnlineVisitors = async () => {
    setLoading(true);
    setError(null);
    const token = getStoredToken();
    if (!token) {
      setError('לא מחובר');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/WCP/getOnlineVisitors`, {
        method: 'GET',
        headers: {
          'realm': 'meieiron',
          'access-token': token,
        },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'שגיאה בטעינת משתמשים מחוברים');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setVisitors(Array.isArray(data) ? data : []);
    } catch {
      setError('שגיאה בתקשורת עם השרת');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOnlineVisitors();
    const interval = setInterval(fetchOnlineVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('screen.no_active') || 'משתמשים מחוברים'}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchOnlineVisitors} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {error && (
          <p className="mb-4 text-center text-sm text-destructive">{error}</p>
        )}
        {!loading && !error && visitors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Monitor className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('screen.no_active')}</h2>
            <p className="text-center text-muted-foreground">{t('screen.no_sharing')}</p>
          </div>
        )}
        {visitors.length > 0 && (
          <div className="space-y-3">
            {visitors.map((visitor, idx) => (
              <div key={visitor.id || idx} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{visitor.name || visitor.email || `משתמש ${idx + 1}`}</p>
                  {visitor.email && visitor.name && (
                    <p className="text-sm text-muted-foreground">{visitor.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && visitors.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScreenShareTab;
