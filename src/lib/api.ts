const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';
const TOKEN_KEY = 'meieiron_access_token';
const TOKEN_EXPIRY_KEY = 'meieiron_token_expiry';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export const getStoredToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) {
    clearToken();
    return null;
  }
  return token;
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  refreshTokenExpiry();
};

export const refreshTokenExpiry = (): void => {
  localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + INACTIVITY_TIMEOUT).toString());
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const login = async (email: string, password: string): Promise<{ success: boolean; token?: string; requiresOtp?: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/loginPage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'public-login', 'realm': 'meieiron' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'שגיאה בהתחברות' };
    }
    const data = await response.json();
    if (data.requiresOtp) return { success: true, requiresOtp: true };
    if (data.accessToken) {
      setToken(data.accessToken);
      return { success: true, token: data.accessToken };
    }
    return { success: false, error: 'לא התקבל טוקן מהשרת' };
  } catch {
    return { success: false, error: 'שגיאה בהתחברות לשרת' };
  }
};

export const checkWaterCorpLogin = async (): Promise<{ data?: any; error?: string }> => {
  const token = getStoredToken();
  if (!token) return { error: 'לא מחובר' };
  refreshTokenExpiry();
  try {
    const response = await fetch(`${API_BASE_URL}/WCPGetForms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'realm': 'meieiron', 'access-token': token },
    });
    if (response.status === 401) { clearToken(); return { error: 'פג תוקף ההתחברות' }; }
    if (!response.ok) { const d = await response.json().catch(() => ({})); return { error: d.message || 'שגיאה' }; }
    return { data: await response.json() };
  } catch {
    return { error: 'שגיאה בתקשורת עם השרת' };
  }
};
