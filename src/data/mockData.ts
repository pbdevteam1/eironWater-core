export type RequestStatus = 'new' | 'in_progress' | 'waiting_for_agent' | 'completed' | 'exceeded_time';

export interface Request {
  id: string;
  requestNumber: string;
  formName: string;
  status: RequestStatus;
  openDate: string;
  closeDate: string;
  daysOpen: number;
  idNumber: string;
  fullName: string;
  payerNumber: string;
  phone: string;
  email: string;
  description: string;
  customerCity?: string;
  linkToPage?: string;
  statusCode?: number;
  updateTime?: string;
}

export const statusColors: Record<RequestStatus, string> = {
  new: 'bg-primary text-primary-foreground',
  in_progress: 'bg-warning text-warning-foreground',
  waiting_for_agent: 'bg-secondary text-secondary-foreground',
  completed: 'bg-success text-success-foreground',
  exceeded_time: 'bg-destructive text-destructive-foreground',
};

export const mockRequests: Request[] = [
  { id: '1', requestNumber: 'REQ001234', formName: 'בקשה לחיבור מים', status: 'new', openDate: '2026-01-28', closeDate: '', daysOpen: 4, idNumber: '123456789', fullName: 'אחמד חאג׳ יחיא', payerNumber: '1001', phone: '04-1234567', email: 'customer1@example.com', description: 'בקשה לחיבור חדש למים באזור עירון' },
  { id: '2', requestNumber: 'REQ001235', formName: 'תלונה על חשבון', status: 'in_progress', openDate: '2026-01-20', closeDate: '', daysOpen: 12, idNumber: '234567890', fullName: 'סמירה אבו חמד', payerNumber: '1002', phone: '04-2345678', email: 'customer2@example.com', description: 'תלונה על חיוב כפול בחשבון ינואר' },
  { id: '3', requestNumber: 'REQ001236', formName: 'דיווח על נזילה', status: 'waiting_for_agent', openDate: '2026-01-25', closeDate: '', daysOpen: 7, idNumber: '345678901', fullName: 'מוחמד עבאס', payerNumber: '1003', phone: '04-3456789', email: 'customer3@example.com', description: 'נזילה ברחוב הראשי ערערה' },
  { id: '4', requestNumber: 'REQ001237', formName: 'בקשה להעברת בעלות', status: 'completed', openDate: '2026-01-10', closeDate: '2026-02-01', daysOpen: 22, idNumber: '456789012', fullName: 'פאטמה כבהא', payerNumber: '1004', phone: '04-4567890', email: 'customer4@example.com', description: 'העברת בעלות על הנכס בכפר קרע' },
  { id: '5', requestNumber: 'REQ001238', formName: 'בקשה לפריסת תשלומים', status: 'exceeded_time', openDate: '2026-01-05', closeDate: '', daysOpen: 27, idNumber: '567890123', fullName: 'חסן ג׳בארין', payerNumber: '1005', phone: '04-5678901', email: 'customer5@example.com', description: 'בקשה לפריסת חוב של 5,000 ש"ח ל-12 תשלומים' },
  { id: '6', requestNumber: 'REQ001239', formName: 'תלונה על לחץ מים', status: 'new', openDate: '2026-01-30', closeDate: '', daysOpen: 2, idNumber: '678901234', fullName: 'עאידה מרעי', payerNumber: '1006', phone: '04-6789012', email: 'customer6@example.com', description: 'לחץ מים נמוך בקומה 3' },
  { id: '7', requestNumber: 'REQ001240', formName: 'בקשה לבדיקת מונה', status: 'in_progress', openDate: '2026-01-18', closeDate: '', daysOpen: 14, idNumber: '789012345', fullName: 'יוסף מג׳אדלה', payerNumber: '1007', phone: '04-7890123', email: 'customer7@example.com', description: 'חשד למונה לא תקין' },
  { id: '8', requestNumber: 'REQ001241', formName: 'דיווח על פיצוץ צינור', status: 'completed', openDate: '2026-01-22', closeDate: '2026-02-01', daysOpen: 10, idNumber: '890123456', fullName: 'נאדיה עמאש', payerNumber: '1008', phone: '04-8901234', email: 'customer8@example.com', description: 'פיצוץ צינור ראשי באום אל פחם' },
];

export const dashboardStats = {
  totalRequests: 150, inProgress: 45, waitingForAgent: 23, completed: 67, exceededTime: 15,
};

export interface SystemSettings {
  regularCycleTime: number;
  urgentCycleTime: number;
  emailNotificationsUrgent: boolean;
  emailNotificationsExceeded: boolean;
}

export const defaultSettings: SystemSettings = {
  regularCycleTime: 7, urgentCycleTime: 3, emailNotificationsUrgent: true, emailNotificationsExceeded: true,
};
