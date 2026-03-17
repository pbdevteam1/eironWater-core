const API_BASE_URL = 'https://testapis-pb.api-connect.co.il';

export const verifyOtp = async (
  email: string,
  otpCode: string
): Promise<{ success: boolean; accessToken?: string; user?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/verifyOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'public-login', 'realm': 'meieiron' },
      body: JSON.stringify({ email, otpCode }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) return { success: false, error: data.error || 'שגיאה באימות הקוד' };
    return { success: true, accessToken: data.accessToken, user: data.user };
  } catch {
    return { success: false, error: 'שגיאה בתקשורת עם השרת' };
  }
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
};
