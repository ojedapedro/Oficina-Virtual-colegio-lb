import React from 'react';
import { BANK_ACCOUNTS } from '../constants';

export const BankDetails: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-6 py-4">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          Cuentas Bancarias Autorizadas
        </h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {BANK_ACCOUNTS.map((account, idx) => {
          const Icon = account.icon;
          return (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
              <div className={`p-3 rounded-full bg-white shadow-sm ${account.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{account.bank || account.email}</h3>
                {account.number && (
                  <p className="font-mono text-slate-600 text-sm mt-1">{account.number}</p>
                )}
                {account.type && (
                  <p className="text-slate-500 text-xs">{account.type}</p>
                )}
                {account.rif && (
                  <p className="text-slate-500 text-xs">RIF: {account.rif}</p>
                )}
                {account.bankName && (
                  <p className="text-slate-500 text-xs">Banco: {account.bankName}</p>
                )}
                {account.note && (
                  <p className="text-orange-600 text-xs font-medium mt-1">{account.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
