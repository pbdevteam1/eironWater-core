import React, { useState, useMemo } from 'react';
import { Eye, Phone, Mail, Loader2, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Request } from '@/data/mockData';
import { useWaterCorp } from '@/contexts/WaterCorpContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStoredToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';
const ROWS_PER_PAGE = 20;
type SortKey = 'requestNumber' | 'formName' | 'updateTime' | 'idNumber' | 'fullName' | 'customerCity';
type SortDir = 'asc' | 'desc';

const formatDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d.replace(' ', 'T'));
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getStatusDisplay = (code?: number): { label: string; className: string } => {
  switch (code) {
    case 0: return { label: 'שגיאה בהפקה', className: 'bg-destructive text-destructive-foreground' };
    case 1: return { label: 'הוגש טופס', className: 'bg-primary text-primary-foreground' };
    case 2: return { label: 'טופל', className: 'bg-green-600 text-white' };
    case 3: return { label: 'נדחה, נשלחה הודעה לתושב', className: 'bg-amber-600 text-white' };
    default: return { label: '—', className: 'bg-muted text-muted-foreground' };
  }
};

const RequestsTab: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachFormLink, setAttachFormLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { data, isLoading } = useWaterCorp();
  const { t, dir, language } = useLanguage();

  const allRequests = data?.requests || [];

  const filteredRequests = useMemo(() => {
    let result = allRequests;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => [r.requestNumber, r.formName, r.fullName, r.idNumber, r.customerCity, r.phone, r.email].some(f => f?.toLowerCase().includes(q)));
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = ((a as any)[sortKey] ?? '').toString().toLowerCase();
        const valB = ((b as any)[sortKey] ?? '').toString().toLowerCase();
        const cmp = valA.localeCompare(valB, 'he');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [allRequests, searchQuery, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="inline h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />;
  };

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRequests = filteredRequests.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const openPdf = async (req: Request) => {
    setPdfUrl(null);
    setPdfError(null);
    setPdfLoading(true);
    const token = getStoredToken();
    if (!token) { setPdfError('אין הרשאה'); setPdfLoading(false); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/WCPGetPDF?formId=${encodeURIComponent(req.requestNumber)}`, {
        method: 'GET',
        headers: { realm: 'meieiron', 'x-api-key': token, 'access-token': token },
      });
      if (!response.ok) { setPdfError(`שגיאה ${response.status}`); return; }

      const displayPdfFromBase64 = (base64PDF: string) => {
        if (!base64PDF) throw new Error('Empty BASE64PDF');
        let b64 = base64PDF;
        if (b64.includes(',')) b64 = b64.split(',')[1];
        b64 = b64.replace(/\s/g, '');
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      };

      const findBase64 = (v: any): string | null => {
        if (!v) return null;
        if (typeof v === 'string') {
          const s = v.trim().replace(/^"|"$/g, '');
          if (s.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(s.slice(0, 200))) return s;
          if (s.startsWith('JVBER') || s.startsWith('data:application/pdf')) return s;
          return null;
        }
        if (Array.isArray(v)) { for (const x of v) { const r = findBase64(x); if (r) return r; } return null; }
        if (typeof v === 'object') {
          // Prefer common key names
          for (const key of ['BASE64PDF', 'base64PDF', 'base64', 'pdf', 'PDF', 'data', 'file']) {
            if (v[key]) { const r = findBase64(v[key]); if (r) return r; }
          }
          for (const k of Object.keys(v)) { const r = findBase64(v[k]); if (r) return r; }
        }
        return null;
      };

      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/pdf')) {
        const blob = await response.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } else {
        const text = await response.text();
        let b64: string | null = null;
        try {
          const json = JSON.parse(text);
          b64 = findBase64(json);
          if (!b64 && typeof json?.url === 'string') { setPdfUrl(json.url); return; }
        } catch {
          b64 = findBase64(text);
        }
        if (b64) {
          setPdfUrl(displayPdfFromBase64(b64));
        } else {
          console.error('WCPGetPDF unexpected response:', text.slice(0, 300));
          setPdfError('פורמט תגובה לא נתמך');
        }
      }
    } catch {
      setPdfError('שגיאת תקשורת עם השרת');
    } finally {
      setPdfLoading(false);
    }
  };

  const openEmailModal = (req: Request) => {
    setSelectedRequest(req);
    setEmailSubject(`פנייה ${req.requestNumber}`);
    setEmailBody(
      'שלום,\n\n' +
      'בהמשך לטופס שהוגש באתר מי עירון, נשמח לסייע.\n\n' +
      'בברכה,\n' +
      'צוות מי עירון'
    );
    setAttachFormLink(false);
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedRequest) return;
    const token = getStoredToken();
    if (!token) { toast({ title: 'שגיאה', description: 'אין הרשאה', variant: 'destructive' }); return; }

    let body = emailBody;
    if (attachFormLink && selectedRequest.linkToPage) {
      body += `\n\n— — —\n\nקישור לטופס: ${selectedRequest.linkToPage}`;
    }

    const isRtl = language === 'he' || language === 'ar';
    const htmlLang = language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'he';
    const htmlDir: 'rtl' | 'ltr' = isRtl ? 'rtl' : 'ltr';
    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const linkify = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0a7ea4;text-decoration:underline;" target="_blank" rel="noopener noreferrer">$1</a>');
    const paragraphs = body.split(/\n{2,}/).map(p => `<p style="margin:0 0 16px;line-height:1.6;">${linkify(escapeHtml(p)).replace(/\n/g, '<br/>')}</p>`).join('');
    const fontFamily = isRtl ? "'Segoe UI', Tahoma, Arial, sans-serif" : "Arial, Helvetica, sans-serif";
    const textAlign = isRtl ? 'right' : 'left';
    const bodyHtml = `<!DOCTYPE html><html lang="${htmlLang}" dir="${htmlDir}"><head><meta charset="utf-8"/><title>${escapeHtml(emailSubject)}</title></head><body style="margin:0;padding:0;background-color:#f4f6f8;font-family:${fontFamily};color:#1a1a1a;" dir="${htmlDir}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:24px 0;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;" dir="${htmlDir}"><tr><td style="background-color:#0a7ea4;padding:20px 24px;text-align:${textAlign};"><h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:600;">מי עירון</h1></td></tr><tr><td style="padding:24px;text-align:${textAlign};font-size:15px;color:#1a1a1a;" dir="${htmlDir}">${paragraphs}</td></tr></table></td></tr></table></body></html>`;

    const payload = {
      to: selectedRequest.email || '',
      subject: emailSubject,
      body,
      bodyHtml,
      contentType: 'text/html',
      language: htmlLang,
      direction: htmlDir,
      metadata: {
        formId: selectedRequest.requestNumber,
        customerId: selectedRequest.idNumber,
        attachedFormLink: attachFormLink,
        formUrl: selectedRequest.linkToPage || '',
      },
    };

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/WCP/sendCBemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', realm: 'meieiron', 'x-api-key': token, 'access-token': token },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast({ title: 'שגיאה בשליחת המייל', description: `שגיאה ${response.status}`, variant: 'destructive' });
        return;
      }
      setEmailModalOpen(false);
      toast({ title: 'המייל נשלח בהצלחה', description: selectedRequest.email || '' });
    } catch {
      toast({ title: 'שגיאה בשליחת המייל', description: 'שגיאת תקשורת עם השרת', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return <Card className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></Card>;

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-xl">{t('nav.forms')}</CardTitle></CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input placeholder={t('table.search')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="ltr:pl-10 rtl:pr-10" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10">
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('requestNumber')}>מזהה בקשה <SortIcon col="requestNumber" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('formName')}>נושא <SortIcon col="formName" /></TableHead>
                  <TableHead className="text-right font-bold">סטטוס</TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('updateTime')}>תאריך הגשה/טיפול <SortIcon col="updateTime" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('idNumber')}>ת.ז. <SortIcon col="idNumber" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('fullName')}>שם מלא <SortIcon col="fullName" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('customerCity')}>מקום מגורים <SortIcon col="customerCity" /></TableHead>
                  <TableHead className="text-right font-bold">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map(req => {
                  const st = getStatusDisplay(req.statusCode);
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono">{req.requestNumber}</TableCell>
                      <TableCell>{req.formName}</TableCell>
                      <TableCell><Badge className={st.className}>{st.label}</Badge></TableCell>
                      <TableCell>{formatDate(req.updateTime)}</TableCell>
                      <TableCell className="font-mono">{req.idNumber}</TableCell>
                      <TableCell>{req.fullName}</TableCell>
                      <TableCell>{req.customerCity || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setSelectedRequest(req); setViewModalOpen(true); openPdf(req); }}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-500/10" onClick={() => { setSelectedRequest(req); setPhoneModalOpen(true); }}><Phone className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-500/10" onClick={() => openEmailModal(req)}><Mail className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between" dir={dir}>
            <span className="text-sm text-muted-foreground">{t('table.page')} {safePage} {t('table.of')} {totalPages} ({filteredRequests.length} {t('table.results')})</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronLeft className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View / PDF preview + approve/reject */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>תצוגת טופס - {selectedRequest?.requestNumber}</span>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`form-${selectedRequest?.requestNumber || 'document'}.pdf`}
                  className="text-sm font-normal text-primary underline"
                >
                  פתח / הורד PDF
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[60vh] items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground overflow-hidden">
            {pdfLoading ? (<Loader2 className="h-8 w-8 animate-spin text-primary" />) : pdfError ? (<span className="text-destructive">{pdfError}</span>) : pdfUrl ? (
              <iframe src={pdfUrl} title="PDF" className="h-full w-full border-0" />
            ) : (<span>אין תצוגה זמינה</span>)}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setViewModalOpen(false)}>
              <X className="h-4 w-4" /> דחה בקשה
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setViewModalOpen(false)}>
              <Check className="h-4 w-4" /> אשר בקשה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone */}
      <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
        <DialogContent className="max-w-sm text-center" dir={dir}>
          <DialogHeader><DialogTitle>{t('modal.contact')}</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><Phone className="h-8 w-8 text-primary" /></div>
              <p className="text-sm text-muted-foreground">{t('modal.phone')}</p>
              <p className="text-2xl font-bold" dir="ltr">{selectedRequest.phone}</p>
              <Button className="w-full" onClick={() => window.open(`tel:${selectedRequest.phone}`)}><Phone className="h-4 w-4" />{t('modal.call')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader><DialogTitle>שליחת מייל</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div><Label>אל</Label><Input value={selectedRequest.email} disabled dir="ltr" /></div>
              <div><Label>נושא</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
              <div><Label>תוכן ההודעה</Label><Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={8} /></div>
              {selectedRequest.linkToPage && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="attach-form-link" checked={attachFormLink} onCheckedChange={(v) => setAttachFormLink(!!v)} />
                    <Label htmlFor="attach-form-link" className="cursor-pointer">צרף קישור לטופס / إرفاق رابط النموذج</Label>
                  </div>
                  <a href={selectedRequest.linkToPage} target="_blank" rel="noopener noreferrer" className="block break-all text-xs text-primary underline" dir="ltr">
                    {selectedRequest.linkToPage}
                  </a>
                </div>
              )}
              <Button className="w-full" disabled={sending} onClick={handleSendEmail}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                שלח מייל
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestsTab;
