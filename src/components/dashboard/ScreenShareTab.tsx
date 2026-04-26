import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Monitor, RefreshCw, Search, ExternalLink, Phone, Video, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WaitingRequest {
  lookupCode?: string;
  insertDate?: string;
  formUrl?: string;
  status?: string;
  phoneNumber?: string;
  emails?: string;
  customerCity?: string;
}

interface Visitor {
  short_id?: string;
  unique_id?: string;
  is_online?: boolean;
  is_waiting_for_call?: boolean;
  is_in_session?: boolean;
  is_supported?: boolean;
  lookup_code?: string;
  call_name?: string | null;
  email?: string | null;
  name?: string;
  nickname?: string;
  identities?: string[];
  location_city?: string;
  location_country?: string;
  location_country_name?: string;
  ip_address?: string;
  last_url?: string;
  browser_name?: string;
  device_name?: string | null;
  device_type?: string;
  last_seen_at?: string;
  added_at?: string;
  watch_link?: string;
}

const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';
const POLL_INTERVAL = 5000;
const WAIT_WARNING_MIN = 2;
const WAIT_DANGER_MIN = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const minutesSince = (iso?: string): number => {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 60_000;
};

const formatWaitTime = (iso?: string): string => {
  if (!iso) return '—';
  const totalSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const getIdentity = (v: Visitor): string =>
  v.name || v.nickname || v.email || v.identities?.[0] || v.short_id || 'Visitor';

const getLocation = (v: Visitor): string =>
  [v.location_city, v.location_country_name].filter(Boolean).join(', ');

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ScreenShareTab: React.FC = () => {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [waitingRequests, setWaitingRequests] = useState<WaitingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Email modal state for waiting requests
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<WaitingRequest | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachFormLink, setAttachFormLink] = useState(false);
  const [waitingSearch, setWaitingSearch] = useState('');
  const [sending, setSending] = useState(false);

  const filteredWaitingRequests = useMemo(() => {
    if (!waitingSearch.trim()) return waitingRequests;
    const q = waitingSearch.trim().toLowerCase();
    return waitingRequests.filter(r =>
      [r.lookupCode, r.phoneNumber, r.emails, r.customerCity, r.formUrl, r.status, r.insertDate]
        .some(f => f?.toString().toLowerCase().includes(q)),
    );
  }, [waitingRequests, waitingSearch]);

  const openEmailModal = (r: WaitingRequest) => {
    setEmailTarget(r);
    const code = r.lookupCode || '';
    setEmailSubject(`פנייה ${code} / استفسار ${code}`.trim());
    setEmailBody(
      'שלום,\n\n' +
      'בהמשך לפנייתך באתר מי עירון, נשמח לסייע.\n' +
      'לכל שאלה ניתן להשיב למייל זה.\n\n' +
      'בברכה,\n' +
      'צוות מי עירון\n\n' +
      '— — —\n\n' +
      'السلام عليكم،\n\n' +
      'تكملةً لاستفساركم في موقع مياه عيرون، يسعدنا مساعدتكم.\n' +
      'لأي سؤال يمكنكم الرد على هذا البريد.\n\n' +
      'مع تحياتنا،\n' +
      'طاقم مياه عيرون'
    );
    setAttachFormLink(false);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget) return;
    const token = getStoredToken();
    if (!token) {
      toast({ title: 'שגיאה', description: 'אין הרשאה', variant: 'destructive' });
      return;
    }

    let body = emailBody;
    if (attachFormLink && emailTarget.formUrl) {
      body +=
        `\n\n— — —\n\n` +
        `קישור לטופס: ${emailTarget.formUrl}\n` +
        `رابط النموذج: ${emailTarget.formUrl}`;
    }

    const payload = {
      to: emailTarget.emails || '',
      subject: emailSubject,
      body,
      metadata: {
        lookupCode: emailTarget.lookupCode || '',
        phoneNumber: emailTarget.phoneNumber || '',
        customerCity: emailTarget.customerCity || '',
        formUrl: emailTarget.formUrl || '',
        attachedFormLink: attachFormLink,
        insertDate: emailTarget.insertDate || '',
      },
    };

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/WCP/sendCBemail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          realm: 'meieiron',
          'x-api-key': token,
          'access-token': token,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast({
          title: 'שגיאה בשליחת המייל',
          description: `שגיאה ${response.status}`,
          variant: 'destructive',
        });
        return;
      }
      setEmailModalOpen(false);
      toast({ title: 'המייל נשלח בהצלחה', description: emailTarget.emails || '' });
    } catch {
      toast({
        title: 'שגיאה בשליחת המייל',
        description: 'שגיאת תקשורת עם השרת',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const loadWaitingRequests = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/WCP/getWaitingVisitors`, {
        method: 'GET',
        headers: { realm: 'meieiron', 'access-token': token },
      });
      if (!response.ok) return;
      const data = await response.json();
      const list: WaitingRequest[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.waitingVisitors)
          ? data.waitingVisitors
          : Array.isArray(data?.requests)
            ? data.requests
            : Array.isArray(data?.data)
              ? data.data
              : [];
      setWaitingRequests(list);
    } catch {
      // silent — keeps existing list
    }
  }, []);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setError('לא מחובר');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/WCP/getOnlineVisitors`, {
        method: 'GET',
        headers: { realm: 'meieiron', 'access-token': token },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'שגיאה בטעינת משתמשים מחוברים');
        return;
      }
      const data = await response.json();
      const list: Visitor[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.visitors)
          ? data.visitors
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setVisitors(list.filter(v => v && v.is_online !== false));
      setError(null);
    } catch {
      setError('שגיאה בתקשורת עם השרת');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleJoin = async (v: Visitor) => {
    if (!v.short_id) {
      toast({ title: 'חסר מזהה visitor', variant: 'destructive' });
      return;
    }
    const token = getStoredToken();
    if (!token) {
      toast({ title: 'לא מחובר', variant: 'destructive' });
      return;
    }
    setJoiningId(v.short_id);
    try {
      const origin = window.location.origin;
      const identity = getIdentity(v);
      const location = getLocation(v);
      const now = new Date().toISOString();
      const agentId = user?.email ?? 'agent';
      const agentName = user?.name ?? 'Agent';

      const body = {
        agent: { id: agentId, name: agentName },
        branding: {
          naked: true,
          on_end_url: `${origin}/`,
          retry_url: `${origin}/`,
        },
        initial_notes: `Session with ${identity}\nLocation: ${location}\nIP: ${v.ip_address}\nStarted at: ${now}`,
        metadata: {
          customer_id: v.unique_id,
          customer_email: v.email || identity,
          customer_location: location,
          customer_ip: v.ip_address,
          current_url: v.last_url,
          browser: v.browser_name,
          os: v.device_name,
          department: 'support',
          priority: 'normal',
          session_type: 'cobrowsing',
          session_started_at: now,
          last_activity: v.last_seen_at,
        },
        permissions: {
          allow_agent_redirect: true,
          allow_audio: true,
          allow_click: true,
          allow_console: false,
          allow_draw: true,
          allow_scroll: true,
          allow_type: true,
          allow_confetti: true,
          allow_notes: true,
          allow_show_agent_screen: true,
          allow_request_visitor_screen: true,
          hide_private_details: false,
        },
        language: 'he',
        webhook_url: 'https://testapis-pb.api-connect.co.il/webhook',
      };

      const res = await fetch(
        `${API_BASE_URL}/WCP/visitors/${v.short_id}/watch_url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            realm: 'meieiron',
            'x-api-key': token,
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          title: data.message || data.error || `שגיאה בהתחברות לסשן (${res.status})`,
          variant: 'destructive',
        });
        return;
      }
      const data = await res.json();
      const watchUrl: string | undefined = data.watch_url || data.watchUrl || data.url;
      if (watchUrl) {
        window.open(watchUrl, '_blank', 'noopener,noreferrer');
        toast({ title: 'מתחבר לסשן', description: identity });
      } else {
        toast({ title: 'לא התקבל קישור צפייה', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'שגיאה בתקשורת עם השרת', variant: 'destructive' });
    } finally {
      setJoiningId(null);
    }
  };

  useEffect(() => {
    load();
    loadWaitingRequests();
    const id = setInterval(() => {
      load();
      loadWaitingRequests();
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [load, loadWaitingRequests]);

  // Tick every second for wait-time counters
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let result = [...visitors];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(v =>
        [getIdentity(v), getLocation(v), v.ip_address, v.last_url, v.lookup_code]
          .some(f => f?.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (!!a.is_waiting_for_call !== !!b.is_waiting_for_call) {
        return a.is_waiting_for_call ? -1 : 1;
      }
      return new Date(a.last_seen_at || 0).getTime() - new Date(b.last_seen_at || 0).getTime();
    });
    return result;
  }, [visitors, searchQuery]);

  const waitBadgeVariant = (v: Visitor) => {
    const mins = minutesSince(v.last_seen_at);
    if (mins >= WAIT_DANGER_MIN) return 'destructive' as const;
    if (mins >= WAIT_WARNING_MIN) return 'secondary' as const;
    return 'outline' as const;
  };

  const waitBadgeClass = (v: Visitor) => {
    const mins = minutesSince(v.last_seen_at);
    if (mins >= WAIT_DANGER_MIN) return '';
    if (mins >= WAIT_WARNING_MIN)
      return 'border-yellow-500 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return '';
  };

  // Loading
  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="space-y-4 py-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // (Empty state moved inline below so the waiting-requests table is always visible)

  const align = dir === 'rtl' ? 'text-right' : 'text-left';

  return (
    <div className="space-y-6">
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="py-4">
        {/* Search + refresh */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
            <Input
              placeholder="חיפוש לפי שם, מיקום, IP, כתובת..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
              dir={dir}
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} title="רענן">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Badge variant="outline">
            {filtered.length} פעילים
          </Badge>
        </div>

        {error && (
          <p className="mb-3 text-center text-sm text-destructive">{error}</p>
        )}

        {/* Table */}
        {visitors.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center text-sm text-muted-foreground">
            <Monitor className="mb-2 h-8 w-8" />
            {t('screen.no_active')}
          </div>
        ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table dir={dir}>
            <TableHeader>
              <TableRow className="border-border bg-primary/10">
                <TableHead className={`${align} font-bold text-foreground`}>סטטוס</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>זמן המתנה</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>זהות</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>מיקום</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>IP</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>קוד זיהוי</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>כתובת</TableHead>
                <TableHead className={`${align} font-bold text-foreground`}>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow
                  key={v.unique_id || v.short_id}
                  className={`hover:bg-muted/50 ${v.is_waiting_for_call ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}`}
                >
                  {/* Status */}
                  <TableCell className={align}>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                      </span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">ONLINE</span>
                      {v.is_waiting_for_call && (
                        <Phone className="h-4 w-4 animate-pulse text-yellow-500" />
                      )}
                      {v.is_in_session && (
                        <Badge className="bg-success text-[10px] text-success-foreground hover:bg-success/90">בשיחה</Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Wait time */}
                  <TableCell className={align}>
                    <Badge variant={waitBadgeVariant(v)} className={`font-mono text-xs ${waitBadgeClass(v)}`}>
                      {formatWaitTime(v.last_seen_at)}
                    </Badge>
                  </TableCell>

                  {/* Identity */}
                  <TableCell className={`${align} text-sm text-foreground`}>
                    {getIdentity(v)}
                  </TableCell>

                  {/* Location */}
                  <TableCell className={`${align} text-sm text-muted-foreground`}>
                    {getLocation(v) || '—'}
                  </TableCell>

                  {/* IP */}
                  <TableCell className={`${align} font-mono text-xs text-muted-foreground`}>
                    {v.ip_address || '—'}
                  </TableCell>

                  {/* Lookup code */}
                  <TableCell className={`${align} font-mono text-xs text-muted-foreground`}>
                    {v.lookup_code || '—'}
                  </TableCell>

                  {/* URL */}
                  <TableCell className={`${align} max-w-[200px]`}>
                    {v.last_url ? (
                      <a
                        href={v.last_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
                        title={v.last_url}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{v.last_url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className={align}>
                    {v.short_id ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1 text-xs"
                        disabled={v.is_supported === false || joiningId === v.short_id}
                        onClick={() => handleJoin(v)}
                      >
                        <Video className="h-3.5 w-3.5" />
                        {joiningId === v.short_id ? 'מתחבר...' : 'צפה במסך'}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>

    {/* Waiting requests table */}
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">בקשות שממתינות לשיחה</h3>
          <Badge variant="outline">{filteredWaitingRequests.length}</Badge>
        </div>

        <div className="relative mb-4">
          <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`} />
          <Input
            placeholder="חיפוש לפי קוד, טלפון, מייל, עיר..."
            value={waitingSearch}
            onChange={(e) => setWaitingSearch(e.target.value)}
            className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
            dir={dir}
          />
        </div>

        {waitingRequests.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
            אין בקשות ממתינות כרגע
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table dir={dir}>
              <TableHeader>
                <TableRow className="border-border bg-primary/10">
                  <TableHead className={`${align} font-bold text-foreground`}>קוד זיהוי</TableHead>
                  <TableHead className={`${align} font-bold text-foreground`}>תאריך פתיחה</TableHead>
                  <TableHead className={`${align} font-bold text-foreground`}>זמן שעבר מפתיחה</TableHead>
                  <TableHead className={`${align} font-bold text-foreground`}>סטטוס</TableHead>
                  <TableHead className={`${align} font-bold text-foreground`}>עיר</TableHead>
                  <TableHead className={`${align} font-bold text-foreground`}>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWaitingRequests.map((r, idx) => {
                  const statusStr = String(r.status ?? '').trim();
                  const statusLabel = statusStr === '1' ? 'בוצע' : statusStr === '0' ? 'ממתין' : (statusStr || '—');
                  const statusClass =
                    statusStr === '1'
                      ? 'border-transparent bg-success/15 text-success'
                      : statusStr === '0'
                        ? 'border-transparent bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                        : '';

                  // Elapsed time since insertDate (HH:MM total — no days unit)
                  let elapsedLabel = '—';
                  let isOverdue = false;
                  if (r.insertDate) {
                    const totalMin = Math.max(0, Math.floor((Date.now() - new Date(r.insertDate).getTime()) / 60_000));
                    const hours = Math.floor(totalMin / 60);
                    const minutes = totalMin % 60;
                    elapsedLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    isOverdue = totalMin >= 24 * 60;
                  }

                  return (
                    <TableRow key={r.lookupCode || idx} className="hover:bg-muted/50">
                      <TableCell className={`${align} font-mono text-xs text-foreground`}>
                        {r.lookupCode || '—'}
                      </TableCell>
                      <TableCell className={`${align} text-xs text-muted-foreground`}>
                        {r.insertDate ? new Date(r.insertDate).toLocaleString('he-IL') : '—'}
                      </TableCell>
                      <TableCell className={align}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs tabular-nums ${
                            isOverdue
                              ? 'border-destructive/30 bg-destructive/10 font-semibold text-destructive'
                              : 'border-border bg-muted/40 text-foreground'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {elapsedLabel}
                        </span>
                      </TableCell>
                      <TableCell className={align}>
                        <Badge variant="outline" className={`text-xs ${statusClass}`}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell className={`${align} text-sm text-muted-foreground`}>
                        {r.customerCity || '—'}
                      </TableCell>
                      <TableCell className={align}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                            disabled={!r.phoneNumber}
                            onClick={() => r.phoneNumber && window.open(`tel:${r.phoneNumber}`)}
                            title={r.phoneNumber || ''}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:bg-amber-500/10"
                            disabled={!r.emails}
                            onClick={() => openEmailModal(r)}
                            title={r.emails || ''}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Email modal for waiting requests */}
    <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
      <DialogContent className="max-w-lg" dir={dir}>
        <DialogHeader>
          <DialogTitle>שליחת מייל</DialogTitle>
        </DialogHeader>
        {emailTarget && (
          <div className="space-y-4">
            <div>
              <Label>אל</Label>
              <Input value={emailTarget.emails || ''} disabled dir="ltr" />
            </div>
            <div>
              <Label>נושא</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label>תוכן</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} />
            </div>
            {emailTarget.formUrl && (
              <div className="rounded-md border border-border bg-muted/40 p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="attach-form-link"
                    checked={attachFormLink}
                    onCheckedChange={(c) => setAttachFormLink(c === true)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="attach-form-link" className="cursor-pointer">
                      צרף קישור למייל
                    </Label>
                    {attachFormLink && (
                      <a
                        href={emailTarget.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 break-all text-xs text-primary hover:underline"
                        dir="ltr"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="break-all">{emailTarget.formUrl}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            <Button className="w-full" onClick={handleSendEmail} disabled={sending}>
              <Mail className="h-4 w-4" />
              {sending ? 'שולח...' : 'שלח'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    </div>
  );
};

export default ScreenShareTab;
