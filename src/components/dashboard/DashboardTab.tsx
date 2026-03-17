import React from 'react';
import { AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { statusColors } from '@/data/mockData';
import { useWaterCorp } from '@/contexts/WaterCorpContext';
import { useLanguage } from '@/contexts/LanguageContext';

const CHART_COLORS = ['hsl(207,78%,45%)', 'hsl(38,92%,50%)', 'hsl(207,30%,50%)', 'hsl(142,76%,36%)', 'hsl(0,84%,60%)'];

const DashboardTab: React.FC = () => {
  const { data, isLoading } = useWaterCorp();
  const { t } = useLanguage();
  const stats = data?.stats || { totalRequests: 0, inProgress: 0, waitingForAgent: 0, completed: 0, exceededTime: 0 };
  const requests = data?.requests || [];

  const pieData = [
    { name: t('dashboard.total'), value: stats.totalRequests },
    { name: t('dashboard.in_progress'), value: stats.inProgress },
    { name: t('dashboard.waiting'), value: stats.waitingForAgent },
    { name: t('dashboard.completed'), value: stats.completed },
    { name: t('dashboard.exceeded'), value: stats.exceededTime },
  ];

  const recentRequests = requests.slice(0, 5);
  const exceededRequests = requests.filter(r => r.status === 'exceeded_time');
  const nearExceeding = requests.filter(r => r.daysOpen >= 5 && r.daysOpen < 7 && r.status !== 'completed');

  if (isLoading) return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-xl">{t('dashboard.stats')}</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            {exceededRequests.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/20 p-3 text-destructive">
                <AlertTriangle className="h-5 w-5" /><span className="text-sm font-medium">{exceededRequests.length} {t('dashboard.exceeded_alert')}</span>
              </div>
            )}
            {nearExceeding.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/20 p-3 text-primary">
                <Clock className="h-5 w-5" /><span className="text-sm font-medium">{nearExceeding.length} {t('dashboard.near_alert')}</span>
              </div>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white' }} />
                <Legend layout="horizontal" verticalAlign="bottom" formatter={(v) => <span className="text-sm text-foreground">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pieData.map((item, i) => (
              <div key={item.name} className="rounded-lg p-2 text-center" style={{ backgroundColor: `${CHART_COLORS[i]}20` }}>
                <div className="text-lg font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader><CardTitle className="text-xl">{t('dashboard.recent')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t('table.request_number')}</TableHead>
                  <TableHead className="text-right">{t('table.subject')}</TableHead>
                  <TableHead className="text-right">{t('table.payer')}</TableHead>
                  <TableHead className="text-right">{t('table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono">{req.requestNumber}</TableCell>
                    <TableCell>{req.formName}</TableCell>
                    <TableCell>{req.payerNumber}</TableCell>
                    <TableCell><Badge className={statusColors[req.status]}>{t(`status.${req.status}`)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTab;
