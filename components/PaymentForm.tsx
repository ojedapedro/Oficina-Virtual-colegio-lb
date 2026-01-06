import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, RefreshCw, ArrowRightLeft, UserCheck } from 'lucide-react';
import { EDUCATION_LEVELS, PAYMENT_METHODS } from '../constants';
import { PaymentRecord, EducationLevel, PaymentMethod, User } from '../types';
import { generateTransactionId, submitPaymentToSheet, fetchStudentByCedula } from '../services/sheetService';

interface PaymentFormProps {
  user?: User;
  exchangeRate?: number;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ user, exchangeRate = 0 }) => {
  const [formData, setFormData] = useState<Partial<PaymentRecord>>({
    registrationDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    level: EducationLevel.MATERNAL,
    paymentMethod: PaymentMethod.PAGO_MOVIL, 
    amountUSD: 0,
    amountBs: 0,
    paymentForm: 'Total',
    referenceNumber: '',
    representativeCedula: user?.cedula || '',
    representativeName: user?.name || '',
    studentMatricula: '',
    studentName: '',
    schoolYear: '2024-2025',
    paidMonths: [],
    description: ''
  });

  const [inputCurrency, setInputCurrency] = useState<'USD' | 'BS'>('BS'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  const MONTHS = [
    'Inscripción', 'Septiembre', 'Octubre', 'Noviembre', 
    'Diciembre', 'Enero', 'Febrero', 'Marzo', 
    'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'
  ];

  // Auto-fill student data if user is logged in
  useEffect(() => {
    if (user?.cedula) {
      handleSearchStudent(user.cedula);
    }
  }, [user]);

  const handleSearchStudent = async (cedula: string) => {
    if (!cedula || cedula.length < 5) return;
    
    setIsSearchingStudent(true);
    const result = await fetchStudentByCedula(cedula);
    
    if (result.success && result.matricula) {
      setFormData(prev => ({
        ...prev,
        studentMatricula: result.matricula,
        studentName: result.studentName || prev.studentName // Actualiza nombre si viene, sino mantiene
      }));
    }
    setIsSearchingStudent(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCedulaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && !user) { // Solo buscar al salir del campo si no es usuario logueado (que ya se buscó)
      handleSearchStudent(val);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value); 
    
    if (inputCurrency === 'BS') {
      const calculatedUSD = exchangeRate > 0 ? Number((val / exchangeRate).toFixed(2)) : 0;
      setFormData(prev => ({
        ...prev,
        amountBs: val,
        amountUSD: calculatedUSD
      }));
    } else {
      const calculatedBs = exchangeRate > 0 ? Number((val * exchangeRate).toFixed(2)) : 0;
      setFormData(prev => ({
        ...prev,
        amountUSD: val,
        amountBs: calculatedBs
      }));
    }
  };

  const toggleCurrency = () => {
    setInputCurrency(prev => prev === 'USD' ? 'BS' : 'USD');
    setFormData(prev => ({ ...prev, amountUSD: 0, amountBs: 0 }));
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

    if (!formData.amountBs || formData.amountBs <= 0) {
      setErrorMsg("El monto debe ser mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessId(null);

    const newId = generateTransactionId();
    
    const record: PaymentRecord = {
      ...formData as PaymentRecord,
      id: newId,
      amountUSD: Number(formData.amountUSD), 
      amountBs: Number(formData.amountBs),
      representativeCedula: user?.cedula || formData.representativeCedula || '',
      representativeName: user?.name || formData.representativeName || ''
    };

    const result = await submitPaymentToSheet(record);

    if (result.success) {
      setSuccessId(newId);
      setFormData(prev => ({
        ...prev,
        amountUSD: 0,
        amountBs: 0,
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
      <div className="bg-blue-900 px-6 py-4 border-b border-blue-800 flex justify-between items-center">
        <div>
          <h2 className="text-white text-lg font-semibold">Registro de Pago</h2>
          <p className="text-blue-200 text-sm">Ingrese los datos del pago realizado</p>
        </div>
        {exchangeRate > 0 && (
          <div className="bg-blue-800/50 px-3 py-1 rounded text-right">
             <p className="text-blue-200 text-xs">Tasa Configurada</p>
             <p className="text-white font-mono font-bold">Bs. {exchangeRate}</p>
          </div>
        )}
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

        {/* Representative Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula del Representante</label>
            <div className="relative">
              <input 
                type="text" 
                name="representativeCedula"
                value={user?.cedula || formData.representativeCedula}
                onChange={handleChange}
                onBlur={handleCedulaBlur}
                disabled={!!user} 
                className={`w-full px-4 py-2 border border-slate-300 rounded-lg ${!!user ? 'bg-slate-100 text-slate-600' : ''}`}
                placeholder="Ingrese Cédula para buscar alumno"
              />
              {isSearchingStudent && (
                 <div className="absolute right-3 top-2.5">
                    <Loader2 className="animate-spin text-blue-500" size={18} />
                 </div>
              )}
            </div>
            {!user && <p className="text-xs text-slate-400 mt-1">Presione tabulador o haga click fuera para buscar.</p>}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del Estudiante *
              {formData.studentMatricula && <UserCheck size={14} className="inline ml-2 text-green-600"/>}
            </label>
            <input 
              type="text" 
              name="studentName"
              required
              placeholder="Nombre y Apellido del Alumno"
              value={formData.studentName}
              onChange={handleChange}
              disabled={!!user}
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${!!user ? 'bg-slate-100 text-slate-600' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Matrícula *</label>
            <input 
              type="text" 
              name="studentMatricula"
              required
              placeholder="Nro Matrícula (Autocargado)"
              value={formData.studentMatricula}
              onChange={handleChange}
              disabled={!!user}
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold ${!!user ? 'bg-slate-100 text-slate-600' : 'text-slate-800'}`}
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
           <div className="md:col-span-2 flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Montos y Conversión</h3>
             <button 
                type="button" 
                onClick={toggleCurrency}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-blue-200"
              >
                <ArrowRightLeft size={12} />
                Invertir Moneda Principal (Actualmente: {inputCurrency})
              </button>
           </div>
           
           {/* Campo Bolívares */}
           <div className={`p-4 rounded-lg border ${inputCurrency === 'BS' ? 'bg-white border-blue-300 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
             <label className="block text-sm font-medium text-slate-700 mb-1">Monto en Bolívares (Bs)</label>
             <div className="relative">
               <input 
                 type="number" 
                 step="0.01"
                 min="0.00"
                 placeholder="0.00"
                 readOnly={inputCurrency !== 'BS'}
                 value={formData.amountBs || ''}
                 onChange={handleAmountChange}
                 className={`w-full pl-8 pr-4 py-2 border rounded-lg outline-none font-bold text-lg 
                    ${inputCurrency === 'BS' 
                      ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 text-slate-800' 
                      : 'border-slate-300 text-slate-500 bg-slate-50 cursor-not-allowed'}`}
               />
               <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">Bs</span>
             </div>
             {inputCurrency === 'BS' && (
                <p className="text-xs text-blue-600 mt-1">Escriba aquí el monto pagado</p>
             )}
           </div>

           {/* Campo Dólares */}
           <div className={`p-4 rounded-lg border ${inputCurrency === 'USD' ? 'bg-white border-blue-300 shadow-sm' : 'bg-slate-100 border-slate-200'}`}>
             <label className="block text-sm font-medium text-slate-700 mb-1">Monto en Dólares ($)</label>
             <div className="relative">
               <input 
                 type="number" 
                 step="0.01"
                 min="0.00"
                 placeholder="0.00"
                 readOnly={inputCurrency !== 'USD'}
                 value={formData.amountUSD || ''}
                 onChange={handleAmountChange}
                 className={`w-full pl-8 pr-4 py-2 border rounded-lg outline-none font-bold text-lg 
                    ${inputCurrency === 'USD' 
                      ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 text-slate-800' 
                      : 'border-slate-300 text-slate-500 bg-slate-50 cursor-not-allowed'}`}
               />
               <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
             </div>
             {inputCurrency !== 'USD' && exchangeRate > 0 && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <RefreshCw size={10} /> {formData.amountBs || 0} / {exchangeRate} = {formData.amountUSD}
                </p>
             )}
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
             <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Pago *</label>
             <select 
              name="paymentForm"
              required
              value={formData.paymentForm}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Total">Pago Total / Completo</option>
              <option value="Abono">Abono</option>
            </select>
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