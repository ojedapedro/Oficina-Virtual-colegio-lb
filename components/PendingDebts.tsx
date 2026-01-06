import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DebtStatus } from '../types';
import { fetchDebts } from '../services/sheetService';

export const PendingDebts: React.FC = () => {
  const [matricula, setMatricula] = useState('');
  const [debts, setDebts] = useState<DebtStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula) return;
    
    setLoading(true);
    setDebts(null);
    setSearched(false);

    const result = await fetchDebts(matricula);
    setDebts(result);
    setSearched(true);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Vencido': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pagado': return <CheckCircle size={16} />;
      case 'Vencido': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden">
      <div className="bg-slate-800 px-6 py-4">
        <h2 className="text-white text-lg font-semibold">Consulta de Saldo</h2>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Número de Matrícula
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ej: 2024-001"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 h-[42px]"
          >
            {loading ? 'Buscando...' : <><Search size={18} /> Consultar</>}
          </button>
        </form>

        {searched && debts && debts.length > 0 && (
          <div className="overflow-x-auto animate-fade-in">
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Estado de Cuenta</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                  <th className="py-3 px-4">Mes / Concepto</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">{debt.month}</td>
                    <td className="py-3 px-4 text-right font-mono">${debt.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-sm text-slate-500">
                        {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(debt.status)}`}>
                        {getStatusIcon(debt.status)}
                        {debt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="py-3 px-4 text-right">Total Pendiente:</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    ${debts.filter(d => d.status !== 'Pagado').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {searched && (!debts || debts.length === 0) && (
            <div className="text-center py-8 text-slate-500">
                <p>No se encontraron registros de deuda para esta matrícula.</p>
                <p className="text-xs mt-1">Verifique el número o contacte a administración.</p>
            </div>
        )}
      </div>
    </div>
  );
};
