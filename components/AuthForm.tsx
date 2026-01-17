import React, { useState } from 'react';
import { User, Lock, Loader2, ArrowRight, CreditCard } from 'lucide-react';
import { loginUser, registerUser } from '../services/sheetService';

interface AuthFormProps {
  onLoginSuccess: (user: any) => void;
  logoUrl: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess, logoUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Si es el campo cédula, solo permitir números
    if (name === 'cedula') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.cedula.length < 6) {
      setError('Por favor ingrese una cédula válida.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginUser({ cedula: formData.cedula, password: formData.password });
        if (result.success) {
          onLoginSuccess(result.user);
        } else {
          setError(result.message || 'Error al iniciar sesión');
        }
      } else {
        const result = await registerUser(formData);
        if (result.success) {
          onLoginSuccess(result.user);
        } else {
          setError(result.message || 'Error al registrar usuario');
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-10 blur-xl transform scale-150"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="bg-white p-3 rounded-full mb-4 shadow-lg">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
             </div>
             <h1 className="text-2xl font-bold text-white mb-1">Oficina Virtual</h1>
             <p className="text-blue-200 text-sm">Colegio LB</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre y Apellido</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cédula de Identidad</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  name="cedula"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={formData.cedula}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  placeholder="Ej. 12345678"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-1">Ingrese solo números, sin puntos ni guiones.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <span className="block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Ingresar' : 'Crear Cuenta'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            &copy; 2024 Oficina Virtual Colegio LB. Acceso seguro.
          </p>
        </div>
      </div>
    </div>
  );
};