import React, { useState } from 'react';
import { BarChart3, Filter, PieChart } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants';
import { fetchReport } from '../services/sheetService';
import { ReportResult } from '../types';

interface ReportsProps {
  exchangeRate?: number;
}

export const Reports: React.FC<ReportsProps> = ({ exchangeRate = 0 }) => {
  const [filters, setFilters] = useState({
    month: '',
    startDate: '',
    endDate: '',
    paymentMethod: ''
  });
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    const data = await fetchReport(filters);
    setReportData(data);
    setLoading(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, month: e.target.value, startDate: '', endDate: '' });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, month: '' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
      <div className="bg-slate-800 px-6 py-4">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={20} /> Reportes Administrativos
        </h2>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Logic */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Mes</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                value={filters.month}
                onChange={handleMonthChange}
                disabled={!!filters.startDate || !!filters.endDate}
              >
                <option value="">Seleccionar Mes</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filters.paymentMethod}
                onChange={e => setFilters({...filters, paymentMethod: e.target.value})}
              >
                <option value="">Todos los métodos</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-8 shadow-sm"
        >
          {loading ? 'Generando...' : <><Filter size={18} /> Generar Reporte</>}
        </button>

        {/* Results */}
        {reportData && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-center">
                <span className="text-blue-600 font-medium mb-1">Total Recaudado</span>
                <span className="text-4xl font-bold text-blue-900">${reportData.totalAmount.toFixed(2)}</span>
                {exchangeRate > 0 && (
                   <span className="text-sm font-mono text-blue-700 font-medium mt-1">
                     ≈ Bs. {(reportData.totalAmount * exchangeRate).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                   </span>
                )}
                <span className="text-sm text-blue-400 mt-2">{reportData.count} transacciones</span>
                {filters.startDate && filters.endDate && (
                   <span className="text-xs text-blue-400 mt-1 font-medium">Del {filters.startDate} al {filters.endDate}</span>
                )}
                {filters.month && !filters.startDate && (
                   <span className="text-xs text-blue-400 mt-1 font-medium">Mes de {filters.month}</span>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChart size={18} /> Desglose por Categoría
                </h3>
                <div className="space-y-3">
                  {reportData.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                      <span className="text-slate-600 font-medium">{item.category}</span>
                      <span className="font-mono font-bold text-slate-700">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {reportData.breakdown.length === 0 && (
                     <p className="text-slate-400 text-sm italic">No hay datos para mostrar con los filtros seleccionados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};