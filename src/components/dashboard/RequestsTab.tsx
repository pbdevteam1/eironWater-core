import React, { useState, useMemo } from 'react';
import { Eye, Phone, Mail, MessageSquare, Loader2, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { statusColors, Request } from '@/data/mockData';
import { useWaterCorp } from '@/contexts/WaterCorpContext';
import { useLanguage } from '@/contexts/LanguageContext';

const ROWS_PER_PAGE = 20;
type SortKey = 'requestNumber' | 'formName' | 'closeDate' | 'idNumber' | 'fullName';
type SortDir = 'asc' | 'desc';

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const RequestsTab: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { data, isLoading } = useWaterCorp();
  const { t, dir } = useLanguage();

  const allRequests = data?.requests || [];

  const filteredRequests = useMemo(() => {
    let result = allRequests;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => [r.requestNumber, r.formName, r.fullName, r.idNumber, r.payerNumber, r.phone, r.email].some(f => f?.toLowerCase().includes(q)));
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = (a[sortKey] ?? '').toString().toLowerCase();
        const valB = (b[sortKey] ?? '').toString().toLowerCase();
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
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('requestNumber')}>{t('table.request_number')} <SortIcon col="requestNumber" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('formName')}>{t('table.subject')} <SortIcon col="formName" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('closeDate')}>{t('table.close_date')} <SortIcon col="closeDate" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('idNumber')}>{t('table.id')} <SortIcon col="idNumber" /></TableHead>
                  <TableHead className="cursor-pointer text-right font-bold" onClick={() => handleSort('fullName')}>{t('table.full_name')} <SortIcon col="fullName" /></TableHead>
                  <TableHead className="text-right font-bold">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono">{req.requestNumber}</TableCell>
                    <TableCell>{req.formName}</TableCell>
                    <TableCell>{formatDate(req.closeDate)}</TableCell>
                    <TableCell className="font-mono">{req.idNumber}</TableCell>
                    <TableCell>{req.fullName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setSelectedRequest(req); setViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-500/10" onClick={() => { setSelectedRequest(req); setPhoneModalOpen(true); }}><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-500/10" onClick={() => { setSelectedRequest(req); setEmailSubject(`${t('modal.details')} ${req.requestNumber}`); setEmailBody(''); setEmailModalOpen(true); }}><Mail className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-600 hover:bg-violet-500/10" onClick={() => { setSelectedRequest(req); setSmsBody(''); setSmsModalOpen(true); }}><MessageSquare className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader><DialogTitle>{t('modal.details')} - {selectedRequest?.requestNumber}</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">{t('table.subject')}</Label><p className="font-medium">{selectedRequest.formName}</p></div>
                <div><Label className="text-muted-foreground">{t('table.status')}</Label><Badge className={statusColors[selectedRequest.status]}>{t(`status.${selectedRequest.status}`)}</Badge></div>
                <div><Label className="text-muted-foreground">{t('table.close_date')}</Label><p className="font-medium">{formatDate(selectedRequest.closeDate)}</p></div>
                <div><Label className="text-muted-foreground">{t('table.full_name')}</Label><p className="font-medium">{selectedRequest.fullName}</p></div>
                <div><Label className="text-muted-foreground">{t('table.id')}</Label><p className="font-mono">{selectedRequest.idNumber}</p></div>
                <div><Label className="text-muted-foreground">{t('table.payer')}</Label><p className="font-mono">{selectedRequest.payerNumber}</p></div>
              </div>
              <div><Label className="text-muted-foreground">תיאור</Label><p className="mt-1 rounded-lg bg-muted p-3">{selectedRequest.description}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader><DialogTitle>{t('modal.send_email')}</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div><Label>{t('modal.to')}</Label><Input value={selectedRequest.email} disabled dir="ltr" /></div>
              <div><Label>{t('modal.subject')}</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
              <div><Label>{t('modal.body')}</Label><Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={5} /></div>
              <Button className="w-full" onClick={() => setEmailModalOpen(false)}><Mail className="h-4 w-4" />{t('modal.send')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader><DialogTitle>{t('modal.send_sms')}</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div><Label>{t('modal.to')}</Label><Input value={selectedRequest.phone} disabled dir="ltr" /></div>
              <div><Label>{t('modal.body')}</Label><Textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} rows={3} /></div>
              <Button className="w-full" onClick={() => setSmsModalOpen(false)}><MessageSquare className="h-4 w-4" />{t('modal.send')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestsTab;
