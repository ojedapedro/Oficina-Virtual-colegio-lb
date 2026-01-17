import React, { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle2, RefreshCw, ArrowRightLeft, UserCheck, GraduationCap, User as UserIcon, Calendar, CreditCard, ChevronDown } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants';
import { PaymentRecord, PaymentMethod, User, Student } from '../types';
import { generateTransactionId, submitPaymentToSheet, fetchStudentByCedula } from '../services/sheetService';

interface PaymentFormProps {
  user?: User;
  exchangeRate?: number;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ user, exchangeRate = 0 }) => {
  const [formData, setFormData] = useState<Partial<PaymentRecord>>({
    registrationDate: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
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
  
  // State for multiple students
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);

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
    setAvailableStudents([]);
    
    const result = await fetchStudentByCedula(cedula);
    
    if (result.success && result.students && result.students.length > 0) {
      setAvailableStudents(result.students);
      // Automatically select the first student
      setFormData(prev => ({
        ...prev,
        studentMatricula: result.students![0].matricula,
        studentName: result.students![0].studentName
      }));
    }
    setIsSearchingStudent(false);
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMatricula = e.target.value;
    const selectedStudent = availableStudents.find(s => s.matricula === selectedMatricula);
    
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        studentMatricula: selectedStudent.matricula,
        studentName: selectedStudent.studentName
      }));
    }
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
    if (val && !user) { 
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
      
      {/* Header Info - Locked for User */}
      <div className="bg-slate-100 border-b border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4 text-slate-700">
          <UserIcon size={18} />
          <h3 className="font-bold uppercase text-sm tracking-wide">Datos de la Cuenta (Pre-cargados)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Representative */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative">
            <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">Representante</label>
            <div className="font-medium text-slate-700">{user?.name || formData.representativeName || '---'}</div>
            <div className="text-xs text-slate-500">C.I: {user?.cedula || formData.representativeCedula || '---'}</div>
             {/* Hidden Inputs for Form Submission */}
             <input type="hidden" name="representativeName" value={formData.representativeName} />
             <input type="hidden" name="representativeCedula" value={formData.representativeCedula} />
          </div>

          {/* Student Selector */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative">
            <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
              Estudiante {availableStudents.length > 1 && '(Seleccionar)'}
            </label>
            
            {isSearchingStudent ? (
               <div className="flex items-center gap-2 text-slate-500 text-sm h-10">
                 <Loader2 className="animate-spin" size={14} /> Cargando datos...
               </div>
            ) : availableStudents.length > 1 ? (
              // Multiple Students: Show Dropdown
              <div className="relative">
                <select 
                  value={formData.studentMatricula}
                  onChange={handleStudentChange}
                  className="w-full p-0 bg-transparent font-medium text-slate-700 outline-none appearance-none cursor-pointer pr-6 border-none focus:ring-0"
                  style={{ backgroundImage: 'none' }}
                >
                  {availableStudents.map(student => (
                    <option key={student.matricula} value={student.matricula}>
                      {student.studentName} ({student.matricula})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-0 top-1 text-slate-400 pointer-events-none" />
                <div className="text-xs text-slate-500 mt-1">
                  Matrícula: {formData.studentMatricula}
                </div>
              </div>
            ) : (
              // Single Student: Show Text
              <>
                <div className="font-medium text-slate-700 flex items-center gap-2">
                   {formData.studentName || '---'}
                   {formData.studentMatricula && <CheckCircle2 size={14} className="text-green-500" />}
                </div>
                <div className="text-xs text-slate-500">Matrícula: {formData.studentMatricula || '---'}</div>
              </>
            )}

             {/* Hidden Inputs */}
             <input type="hidden" name="studentName" value={formData.studentName} />
             <input type="hidden" name="studentMatricula" value={formData.studentMatricula} />
          </div>

          {/* Meta Info */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
            <div>
               <label className="text-xs text-slate-500 block">Fecha Registro</label>
               <input 
                  type="date" 
                  value={formData.registrationDate} 
                  disabled 
                  className="bg-transparent text-slate-700 text-sm font-medium w-full outline-none" 
               />
            </div>
             <div>
               <label className="text-xs text-slate-500 block">Año Escolar</label>
               <input 
                  type="text" 
                  value={formData.schoolYear} 
                  disabled 
                  className="bg-transparent text-slate-700 text-sm font-medium w-full outline-none" 
               />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form - Editable */}
      <div className="bg-white p-6">
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
           <CreditCard size={18} className="text-blue-600" />
           <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Detalles del Pago</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Real del Pago *</label>
              <input 
                type="date" 
                name="paymentDate"
                required
                value={formData.paymentDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
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
          </div>

          {/* Payment Amounts */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-500 uppercase">Monto a Registrar</h3>
               <button 
                  type="button" 
                  onClick={toggleCurrency}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-blue-200"
                >
                  <ArrowRightLeft size={12} />
                  Invertir Moneda ({inputCurrency})
                </button>
            </div>

             {/* Campo Bolívares */}
             <div className={`p-4 rounded-lg border transition-all ${inputCurrency === 'BS' ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-50' : 'bg-slate-100 border-slate-200 opacity-70'}`}>
               <label className="block text-sm font-medium text-slate-700 mb-1">Bolívares (Bs)</label>
               <div className="relative">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.00"
                   placeholder="0.00"
                   readOnly={inputCurrency !== 'BS'}
                   value={formData.amountBs || ''}
                   onChange={handleAmountChange}
                   className={`w-full pl-8 pr-4 py-2 border-0 bg-transparent outline-none font-bold text-xl text-slate-800`}
                 />
                 <span className="absolute left-0 top-3 text-slate-400 font-bold text-sm pl-2">Bs</span>
               </div>
             </div>

             {/* Campo Dólares */}
             <div className={`p-4 rounded-lg border transition-all ${inputCurrency === 'USD' ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-50' : 'bg-slate-100 border-slate-200 opacity-70'}`}>
               <label className="block text-sm font-medium text-slate-700 mb-1">Dólares ($)</label>
               <div className="relative">
                 <input 
                   type="number" 
                   step="0.01"
                   min="0.00"
                   placeholder="0.00"
                   readOnly={inputCurrency !== 'USD'}
                   value={formData.amountUSD || ''}
                   onChange={handleAmountChange}
                   className={`w-full pl-8 pr-4 py-2 border-0 bg-transparent outline-none font-bold text-xl text-slate-800`}
                 />
                 <span className="absolute left-0 top-3 text-slate-400 font-bold text-sm pl-3">$</span>
               </div>
               {inputCurrency !== 'USD' && exchangeRate > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    Ref: {formData.amountBs || 0} / {exchangeRate}
                  </p>
               )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Abono *</label>
               <select 
                name="paymentForm"
                required
                value={formData.paymentForm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Total">Pago Total / Completo</option>
                <option value="Abono">Abono Parcial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nro. Referencia / Comprobante *
              </label>
              <input 
                type="text" 
                name="referenceNumber"
                required={!formData.paymentMethod?.includes('Efectivo')}
                placeholder="Ej. 123456"
                value={formData.referenceNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Months Selection */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
               <Calendar size={16} />
               Meses / Conceptos a Pagar *
             </label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MONTHS.map(month => (
                  <label key={month} className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${
                      (formData.paidMonths || []).includes(month) ? 'bg-blue-100 border-blue-200' : 'hover:bg-white'
                    }`}>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones (Opcional)</label>
            <textarea 
              name="description"
              rows={2}
              placeholder="Alguna nota adicional sobre el pago..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
    </div>
  );
};