import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, FileText, Menu, X, BarChart3, LogOut, User as UserIcon } from 'lucide-react';
import { PaymentForm } from './components/PaymentForm';
import { BankDetails } from './components/BankDetails';
import { PendingDebts } from './components/PendingDebts';
import { Reports } from './components/Reports';
import { AuthForm } from './components/AuthForm';
import { User } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'balance' | 'reports'>('register');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const LOGO_URL = "https://i.ibb.co/FbHJbvVT/images.png";

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('colegio_lb_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('colegio_lb_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('colegio_lb_user');
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // AUTH VIEW
  if (!user) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} logoUrl={LOGO_URL} />;
  }

  // APP DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar / Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
              <img 
                src={LOGO_URL} 
                alt="Logo Institucional" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Colegio LB</h1>
              <p className="text-xs text-slate-400">Oficina Virtual</p>
            </div>
          </div>
          <button onClick={toggleMobileMenu} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* User Info in Sidebar */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-full">
                    <UserIcon size={16} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">V-{user.cedula}</p>
                </div>
            </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Receipt size={20} />
            <span className="font-medium">Registrar Pago</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('balance'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'balance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={20} />
            <span className="font-medium">Consultar Saldo</span>
          </button>

          <button 
             onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Reportes</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
            </button>
          <p className="text-xs text-slate-600 text-center mt-4 pb-2">
            &copy; 2024 GestionAdminLB
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <img 
              src={LOGO_URL} 
              alt="Logo Institucional" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-slate-800">Oficina Virtual</span>
          </div>
          <button onClick={toggleMobileMenu} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {activeTab === 'register' ? 'Gestión de Pagos' : 
                   activeTab === 'balance' ? 'Estado de Cuenta' : 'Reportes Administrativos'}
                </h2>
                <p className="text-slate-500 mt-1">
                  {activeTab === 'register' ? 'Complete el formulario para notificar una transferencia o pago.' : 
                   activeTab === 'balance' ? 'Verifique las mensualidades pendientes por alumno.' :
                   'Genere reportes detallados de ingresos.'}
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900">Bienvenido, {user.name}</p>
                <p className="text-slate-500 font-mono text-xs">{new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Dynamic Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {activeTab === 'register' && <PaymentForm user={user} />}
                {activeTab === 'balance' && <PendingDebts />}
                {activeTab === 'reports' && <Reports />}
              </div>

              {/* Sidebar Info (Always Visible on Desktop) */}
              <div className="space-y-6">
                <BankDetails />
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                  <h3 className="text-blue-900 font-bold mb-2">Información Importante</h3>
                  <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                    <li>Los pagos en efectivo deben registrarse presencialmente para validar el billete.</li>
                    <li>Conserve su comprobante digital generado al final del registro.</li>
                    <li>Los pagos móviles se validan automáticamente en 24h.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;