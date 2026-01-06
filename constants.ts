import { EducationLevel, PaymentMethod } from './types';
import { Building2, CreditCard, Smartphone, Wallet, Banknote } from 'lucide-react';

// Replace this with the URL you get after deploying the Google Apps Script
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXsr826Ds3IQhqybMyysu8kx6k0-AO2IIdHIGbWl0TkjvgtdQzbYF6t6jJOnVw_M2P/exec';

export const EDUCATION_LEVELS = Object.values(EducationLevel);
export const PAYMENT_METHODS = Object.values(PaymentMethod);

export const BANK_ACCOUNTS = [
  {
    bank: 'Banco Mercantil',
    number: '0105-0000-00-0000000000',
    type: 'Cuenta Corriente',
    holder: 'U.E. Colegio GestionAdminLB',
    rif: 'J-00000000-0',
    icon: Building2,
    color: 'text-blue-600'
  },
  {
    bank: 'Banesco',
    number: '0134-0000-00-0000000000',
    type: 'Cuenta Corriente',
    holder: 'U.E. Colegio GestionAdminLB',
    rif: 'J-00000000-0',
    icon: Building2,
    color: 'text-green-600'
  },
  {
    bank: 'Pago Móvil (Mercantil)',
    number: '0414-0000000',
    rif: 'J-00000000-0',
    bankName: 'Mercantil (0105)',
    icon: Smartphone,
    color: 'text-purple-600'
  },
  {
    bank: 'Zelle / Binance',
    email: 'pagos@colegio.edu.ve',
    note: 'Indicar nombre del alumno en la nota',
    icon: Wallet,
    color: 'text-yellow-600'
  }
];

export const MOCK_DEBTS = [
  { month: 'Septiembre 2024', amount: 150, status: 'Pagado' },
  { month: 'Octubre 2024', amount: 150, status: 'Pagado' },
  { month: 'Noviembre 2024', amount: 150, status: 'Vencido' },
  { month: 'Diciembre 2024', amount: 150, status: 'Pendiente' },
  { month: 'Enero 2025', amount: 150, status: 'Pendiente' },
];
