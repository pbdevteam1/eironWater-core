import React, { useEffect, useState } from 'react';
import { Monitor, RefreshCw, Users, Globe, MapPin, Clock, ExternalLink, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStoredToken } from '@/lib/api';

interface Visitor {
  added_at?: string;
  api_key?: string;
  browser_name?: string;
  call_name?: string | null;
  device_name?: string | null;
  device_type?: string;
  email?: string | null;
  identities?: string[];
  integration?: string | null;
  ip_address?: string;
  is_in_session?: boolean;
  is_online?: boolean;
  is_supported?: boolean;
  is_waiting_for_call?: boolean;
  js_configuration?: boolean;
  last_seen_at?: string;
  last_url?: string;
  location_city?: string;
  location_country?: string;
  location_country_name?: string;
  lookup_code?: string;
  name?: string;
  nickname?: string;
  sdk?: string;
  short_id?: string;
  tags?: string[];
  unique_id?: string;
  watch_link?: string;
}

interface OnlineVisitorEntry {
  visitor: Visitor;
}

const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';

const formatTimeAgo = (iso?: string) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `לפני ${sec} שניות`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דקות`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const days = Math.floor(hr / 24);
  return `לפני ${days} ימים`;
};

const ScreenShareTab: React.FC = () => {
  const { t } = useLanguage();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
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
      const list: Visitor[] = Array.isArray(data)
        ? data.map((entry: OnlineVisitorEntry) => entry?.visitor).filter(Boolean)
        : [];
      setVisitors(list);
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
          משתמשים מחוברים
          {visitors.length > 0 && (
            <Badge variant="secondary" className="ms-2">{visitors.length}</Badge>
          )}
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
          <div className="grid gap-3 sm:grid-cols-2">
            {visitors.map((v, idx) => (
              <div
                key={v.unique_id || v.short_id || idx}
                className="rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                      {v.is_online && (
                        <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{v.name || v.nickname || 'מבקר'}</p>
                      <p className="text-xs text-muted-foreground">#{v.lookup_code || v.short_id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {v.is_waiting_for_call && (
                      <Badge variant="destructive" className="text-[10px]">ממתין לשיחה</Badge>
                    )}
                    {v.is_in_session && (
                      <Badge className="bg-green-500 text-[10px] text-white hover:bg-green-600">בשיחה</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {(v.location_city || v.location_country_name) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {[v.location_city, v.location_country_name].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {v.browser_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{v.browser_name} · {v.device_type}</span>
                    </div>
                  )}
                  {v.last_seen_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatTimeAgo(v.last_seen_at)}</span>
                    </div>
                  )}
                  {v.last_url && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <a
                        href={v.last_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-primary hover:underline"
                      >
                        {v.last_url}
                      </a>
                    </div>
                  )}
                </div>

                {v.watch_link && (
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!v.is_supported}
                  >
                    <a href={v.watch_link} target="_blank" rel="noopener noreferrer">
                      <Video className="me-2 h-4 w-4" />
                      צפה במסך
                    </a>
                  </Button>
                )}
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
