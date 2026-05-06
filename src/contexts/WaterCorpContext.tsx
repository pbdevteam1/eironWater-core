import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { checkWaterCorpLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { mockRequests, dashboardStats, Request, RequestStatus } from '@/data/mockData';

export interface DashboardStats {
  totalRequests: number;
  inProgress: number;
  waitingForAgent: number;
  completed: number;
  exceededTime: number;
}

interface WaterCorpData { requests: Request[]; stats: DashboardStats; raw: any; }
interface WaterCorpContextType { data: WaterCorpData | null; isLoading: boolean; error: string | null; refetch: () => Promise<void>; }

const WaterCorpContext = createContext<WaterCorpContextType | undefined>(undefined);

export const useWaterCorp = () => {
  const context = useContext(WaterCorpContext);
  if (!context) throw new Error('useWaterCorp must be used within WaterCorpProvider');
  return context;
};

const mapStatus = (status: string | undefined): RequestStatus => {
  const map: Record<string, RequestStatus> = {
    'פתוח': 'in_progress', 'נוצר': 'new', 'ממתין לנציג': 'waiting_for_agent',
    'טופל': 'completed', 'סגור': 'completed', 'חורג': 'exceeded_time',
    new: 'new', in_progress: 'in_progress', completed: 'completed',
    waiting_for_agent: 'waiting_for_agent', exceeded_time: 'exceeded_time',
  };
  return map[status || ''] || 'new';
};

const mapStatusFromCode = (code: number | undefined): RequestStatus => {
  if (code === 2) return 'completed';
  if (code === 3) return 'exceeded_time';
  if (code === 0) return 'exceeded_time';
  return 'in_progress';
};

const mapApiRequests = (raw: any): Request[] | null => {
  try {
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.requests;
    if (!Array.isArray(items) || !items.length) return null;
    return items.map((r: any, i: number) => ({
      id: r.formId?.toString() || String(i + 1),
      requestNumber: r.formId || '',
      formName: r.formName || '',
      status: typeof r.status === 'number' ? mapStatusFromCode(r.status) : mapStatus(r.status),
      statusCode: typeof r.status === 'number' ? r.status : undefined,
      openDate: r.createdAt || r.updateTime || new Date().toISOString(),
      closeDate: r.closedAt || r.closeDate || '',
      updateTime: r.updateTime || '',
      daysOpen: parseInt(r.totalPassTime?.match(/(\d+)/)?.[1] || '0', 10),
      idNumber: r.customerId || '',
      fullName: r.custFullName || r.fullName || r.customerName || '',
      payerNumber: r.customerId || '',
      phone: r.phoneNum || '',
      email: r.emailAddress || '',
      description: r.formName || '',
      customerCity: r.customerCity || '',
      linkToPage: r.link_to_page || '',
    }));
  } catch { return null; }
};

const calcStats = (requests: Request[]): DashboardStats => ({
  totalRequests: requests.length,
  inProgress: requests.filter(r => r.status === 'in_progress').length,
  waitingForAgent: requests.filter(r => r.status === 'waiting_for_agent').length,
  completed: requests.filter(r => r.status === 'completed').length,
  exceededTime: requests.filter(r => r.status === 'exceeded_time').length,
});

export const WaterCorpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<WaterCorpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setError(null);
    const result = await checkWaterCorpLogin();
    if (result.error) {
      setError(result.error);
      setData({ requests: mockRequests, stats: dashboardStats, raw: null });
    } else {
      const requests = mapApiRequests(result.data) || mockRequests;
      setData({ requests, stats: calcStats(requests), raw: result.data });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    } else { setData(null); setError(null); }
  }, [isAuthenticated, fetchData]);

  return (
    <WaterCorpContext.Provider value={{ data, isLoading, error, refetch: fetchData }}>
      {children}
    </WaterCorpContext.Provider>
  );
};
