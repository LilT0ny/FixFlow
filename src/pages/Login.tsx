import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Wrench, Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-100 blur-3xl opacity-50 mix-blend-multiply border border-blue-200"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-100 blur-3xl opacity-50 mix-blend-multiply border border-indigo-200"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            RepairSys
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            Gestión Inteligente de Servicio Técnico
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl border border-gray-100 sm:px-10">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Shield className="w-5 h-5 text-blue-600" />
              Acceso Administrativo
            </h3>
            <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 py-3 border bg-gray-50/50 transition-colors"
                  placeholder="tu_usuario"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 py-3 border bg-gray-50/50 transition-colors"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Ingresar <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
