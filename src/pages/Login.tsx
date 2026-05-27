import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password, rememberMe);
      if (success) {
        // Leer la sesión guardada para determinar a dónde ir
        const session = (await import('../services/SaaSAuthService')).AuthService.getSession();
        if (session?.is_master) {
          navigate('/master/dashboard');
        } else {
          navigate('/');
        }
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
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decorations - More subtle and premium */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-100/30 blur-[120px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-100/30 blur-[100px] opacity-60"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4 sm:px-0">
        <div className="flex justify-center flex-col items-center mb-6 md:mb-8">
          <div className="w-44 h-44 md:w-52 md:h-52 flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-105 group relative">
            <div className="absolute inset-0 bg-primary-500/10 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img 
              src="/FixFlowIsologo.svg" 
              alt="FixFlow Logo" 
              className="w-full h-full object-contain relative z-10" 
            />
          </div>
          <h2 className="mt-4 text-center text-3xl md:text-4xl font-black text-surface-900 tracking-tighter leading-none">
            Fix<span className="text-primary-600">Flow</span>
          </h2>
          <p className="mt-3.5 text-center text-[9px] md:text-[11px] text-surface-400 font-black uppercase tracking-[0.4em] opacity-80">
            Ecosistema de Gestión Tecnológica
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl py-10 px-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] sm:rounded-[40px] border border-white sm:px-12 relative overflow-hidden">
          {/* Subtle line at the top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 opacity-80"></div>
          
          <div className="mb-8 md:mb-10 text-center">
            <h3 className="text-xl md:text-2xl font-black text-surface-900 tracking-tight flex items-center justify-center gap-2">
              Bienvenido
            </h3>
            <p className="text-xs md:text-sm font-medium text-surface-400 mt-2">Ingresa tus credenciales para administrar tu taller.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1 mb-2">Usuario del Sistema</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600 text-surface-300">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-14 block w-full bg-surface-50 border border-surface-100 rounded-[22px] focus:ring-[6px] focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white py-4 text-sm font-bold text-surface-900 transition-all outline-none"
                  placeholder="Ej. admin_repair"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1 mb-2">Clave Maestra</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600 text-surface-300">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 pr-14 block w-full bg-surface-50 border border-surface-100 rounded-[22px] focus:ring-[6px] focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white py-4 text-sm font-bold text-surface-900 transition-all outline-none"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-surface-300 hover:text-primary-600 transition-colors outline-none focus:outline-none active:scale-90"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center group cursor-pointer select-none">
                <div className="relative flex items-center justify-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none h-5 w-5 bg-surface-100 border border-surface-200 rounded-lg checked:bg-primary-600 checked:border-primary-600 transition-all cursor-pointer"
                  />
                  <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="ml-3 text-xs font-bold text-surface-500 group-hover:text-surface-700 transition-colors">
                  Mantener mi sesión iniciada
                </span>
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100/50 text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <div className="bg-red-500 p-1.5 rounded-full shadow-sm shadow-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                </div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full group relative overflow-hidden flex justify-center py-4 px-6 rounded-[22px] shadow-[0_20px_40px_-12px_rgba(37,99,235,0.3)] text-xs md:text-sm font-black uppercase tracking-widest text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-[6px] focus:ring-primary-500/20 transition-all active:scale-[0.96] disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-10 text-center text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-60">
          © {new Date().getFullYear()} Software de Alta Precisión. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
