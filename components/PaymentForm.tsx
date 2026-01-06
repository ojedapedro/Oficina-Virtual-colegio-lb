import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { EDUCATION_LEVELS, PAYMENT_METHODS } from '../constants';
import { PaymentRecord, EducationLevel, PaymentMethod, User } from '../types';
import { generateTransactionId, submitPaymentToSheet } from '../services/sheetService';

interface PaymentFormProps {
  user?: User;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ user }) => {
  const [formData, setFormData] = useState<Partial<PaymentRecord>>({
    registrationDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    level: EducationLevel.MATERNAL,
    paymentMethod: PaymentMethod.TRANSFERENCIA,
    amount: 0,
    referenceNumber: '',
    representativeId: user?.cedula || '',
    representativeName: user?.name || '',
    studentMatricula: '',
    studentName: '',
    schoolYear: '2024-2025',
    paidMonths: [],
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const MONTHS = [
    'Inscripción', 'Septiembre', 'Octubre', 'Noviembre', 
    'Diciembre', 'Enero', 'Febrero', 'Marzo', 
    'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMonthToggle = (month: string) => {
    setFormData(prev => {
      const currentMonths = prev.paidMonths || [];
      if (currentMonths.includes(month)) {
        return { ...prev, paidMonths: currentMonths.filter(m => m !== month) };
      } else {
        return { ...prev, paidMonths: [...currentMonths, month] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paidMonths || formData.paidMonths.length === 0) {
      setErrorMsg("Debe seleccionar al menos un mes o concepto a pagar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessId(null);

    const newId = generateTransactionId();
    
    const record: PaymentRecord = {
      ...formData as PaymentRecord,
      id: newId,
      amount: Number(formData.amount), // Ensure number
      // Ensure user info is attached if not editable
      representativeId: user?.cedula || formData.representativeId || '',
      representativeName: user?.name || formData.representativeName || ''
    };

    const result = await submitPaymentToSheet(record);

    if (result.success) {
      setSuccessId(newId);
      // Reset form but keep some defaults
      setFormData(prev => ({
        ...prev,
        amount: 0,
        referenceNumber: '',
        paidMonths: [],
        description: ''
      }));
    } else {
      setErrorMsg(result.message);
    }
    
    setIsSubmitting(false);
  };

  if (successId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-green-100 p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Registro Exitoso!</h2>
        <p className="text-slate-600 mb-6">El pago ha sido registrado en el sistema.</p>
        <div className="bg-slate-50 p-4 rounded-lg inline-block mb-6 border border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">ID de Transacción</p>
          <p className="text-xl font-mono font-bold text-blue-700">{successId}</p>
        </div>
        <br />
        <button 
          onClick={() => setSuccessId(null)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Registrar Nuevo Pago
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-blue-900 px-6 py-4 border-b border-blue-800">
        <h2 className="text-white text-lg font-semibold">Registro de Pago</h2>
        <p className="text-blue-200 text-sm">Ingrese los datos del pago realizado</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Dates Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Registro</label>
            <input 
              type="date" 
              name="registrationDate"
              value={formData.registrationDate}
              onChange={handleChange}
              disabled
              className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Pago *</label>
            <input 
              type="date" 
              name="paymentDate"
              required
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Representative Info (Read Only if Logged In) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Representante</label>
            <input 
              type="text" 
              name="representativeId"
              value={user?.cedula || formData.representativeId}
              onChange={handleChange}
              disabled={!!user} // Disable if user is logged in
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg ${!!user ? 'bg-slate-100 text-slate-600' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Representante</label>
            <input 
              type="text" 
              name="representativeName"
              value={user?.name || formData.representativeName}
              onChange={handleChange}
              disabled={!!user}
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg ${!!user ? 'bg-slate-100 text-slate-600' : ''}`}
            />
          </div>
        </div>

        {/* Student ID Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Estudiante *</label>
            <input 
              type="text" 
              name="studentName"
              required
              placeholder="Nombre y Apellido del Alumno"
              value={formData.studentName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Matrícula *</label>
            <input 
              type="text" 
              name="studentMatricula"
              required
              placeholder="Nro Matrícula"
              value={formData.studentMatricula}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Level & Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nivel Educativo *</label>
            <select 
              name="level"
              required
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {EDUCATION_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Año Escolar *</label>
            <input 
              type="text" 
              name="schoolYear"
              required
              placeholder="Ej. 2024-2025"
              value={formData.schoolYear}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Months Selection */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
           <label className="block text-sm font-medium text-slate-700 mb-3">Meses / Conceptos a Pagar *</label>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MONTHS.map(month => (
                <label key={month} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={(formData.paidMonths || []).includes(month)}
                    onChange={() => handleMonthToggle(month)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-slate-700">{month}</span>
                </label>
              ))}
           </div>
        </div>

        {/* Payment Details */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="md:col-span-2">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Detalles de la Transacción</h3>
           </div>
           
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago *</label>
            <select 
              name="paymentMethod"
              required
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto Total *</label>
            <div className="relative">
              <input 
                type="number" 
                name="amount"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Referencia / Comprobante
              {formData.paymentMethod?.includes('Efectivo') ? ' (Opcional)' : ' *'}
            </label>
            <input 
              type="text" 
              name="referenceNumber"
              required={!formData.paymentMethod?.includes('Efectivo')}
              placeholder="Últimos dígitos de referencia o código"
              value={formData.referenceNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones (Opcional)</label>
          <textarea 
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          ></textarea>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {isSubmitting ? 'Procesando...' : 'Registrar Pago'}
          </button>
        </div>

      </form>
    </div>
  );
};