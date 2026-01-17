import { PaymentRecord, DebtStatus, ReportFilter, ReportResult, User } from '../types';
import { GOOGLE_SCRIPT_URL, MOCK_DEBTS } from '../constants';

export const generateTransactionId = (): string => {
  // Structure OV-XXXXXXX
  const uniqueNum = Math.floor(1000000 + Math.random() * 9000000);
  return `OV-${uniqueNum}`;
};

const callScript = async (action: string, payload: any = {}) => {
  if (GOOGLE_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
    console.warn(`API URL not configured. Simulating ${action}.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulación para Login/Register con Cédula
    if (action === 'login') {
       // Acepta cualquier password '123456' para la demo
       if (payload.password === '123456') return { success: true, user: { cedula: payload.cedula, name: 'Usuario Demo' }};
       return { success: false, message: 'Credenciales inválidas (Demo: use pass 123456)' };
    }
    if (action === 'register') {
       return { success: true, user: { cedula: payload.cedula, name: payload.name }};
    }
    if (action === 'getExchangeRate') {
        return { success: true, rate: 303.00, date: new Date().toISOString() };
    }
    // Simulación de búsqueda de estudiante
    // Retorna siempre un estudiante para la demo, basado en la cédula
    if (action === 'getStudentByCedula') {
        const genericMatricula = `2024-${payload.cedula.slice(-3)}`;
        return { 
          success: true, 
          matricula: genericMatricula, 
          studentName: 'Estudiante Hijo Demo' 
        };
    }

    return null;
  }

  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('data', JSON.stringify(payload));

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
};

export const submitPaymentToSheet = async (data: PaymentRecord): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await callScript('registerPayment', data);
    if (!result) return { success: true, message: `Simulación: Pago ${data.id} registrado.` };
    return result;
  } catch (error) {
    console.error("Error submitting payment:", error);
    return { success: false, message: "Error de conexión." };
  }
};

export const fetchDebts = async (matricula: string): Promise<DebtStatus[]> => {
  try {
    const result = await callScript('getDebts', { matricula });
    if (!result) return MOCK_DEBTS as DebtStatus[]; // Fallback to mock
    return result.data || [];
  } catch (error) {
    console.error("Error fetching debts:", error);
    return [];
  }
};

export const fetchReport = async (filter: ReportFilter): Promise<ReportResult> => {
  try {
    const result = await callScript('getReport', filter);
    if (!result) {
      // Mock report
      return {
        totalAmount: 1250.00,
        count: 15,
        breakdown: [
          { category: 'Transferencia', amount: 800 },
          { category: 'Efectivo $', amount: 450 }
        ]
      };
    }
    return result.data;
  } catch (error) {
    console.error("Error fetching report:", error);
    return { totalAmount: 0, count: 0, breakdown: [] };
  }
};

export const registerUser = async (user: { name: string, cedula: string, password: string }) => {
  return await callScript('register', user);
};

export const loginUser = async (credentials: { cedula: string, password: string }) => {
  return await callScript('login', credentials);
};

export const getExchangeRate = async (): Promise<{ rate: number, date: string }> => {
  try {
    const result = await callScript('getExchangeRate');
    if (!result || !result.success) return { rate: 0, date: '' };
    return { rate: result.rate, date: result.date };
  } catch (e) {
    console.error("Error fetching exchange rate:", e);
    return { rate: 0, date: '' };
  }
};

export const fetchStudentByCedula = async (cedula: string): Promise<{ success: boolean, matricula?: string, studentName?: string }> => {
  try {
    const result = await callScript('getStudentByCedula', { cedula });
    return result || { success: false };
  } catch (e) {
    console.error("Error fetching student:", e);
    return { success: false };
  }
};