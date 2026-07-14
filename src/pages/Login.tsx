import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle, Loader2, ChevronLeft } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = (location.state as { message?: string } | null)?.message;

  const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-sent'>('login');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        if (user.debe_cambiar_password) {
          navigate('/change-password');
        } else if (user.is_master) {
          navigate('/master/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setForgotError('');
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/change-password`,
      });
      setMode('forgot-sent');
    } catch {
      setForgotError('Error al enviar el link. Intentá de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex lg:flex-row-reverse font-sans">
      {/* Credenciales — derecha en desktop, única columna en móvil */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-sm mx-auto animate-fade-in-up">
          {/* Logo compacto — solo visible cuando el panel derecho está oculto */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 flex items-center justify-center overflow-hidden">
              <img src="/FixFlowIsologo.svg" alt="FixFlow Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-surface-900">
              Fix<span className="text-primary-600">Flow</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-surface-900">
              {mode === 'login' ? 'Bienvenido' : mode === 'forgot' ? 'Recuperar contraseña' : 'Revisá tu email'}
            </h1>
            <p className="text-sm text-surface-500 mt-1.5">
              {mode === 'login'
                ? 'Ingresá tus credenciales para administrar tu taller.'
                : mode === 'forgot'
                ? 'Te mandamos un link para elegir una contraseña nueva.'
                : `Si ${email.trim() || 'ese email'} está registrado, vas a recibir un link para restablecer tu contraseña.`}
            </p>
          </div>

          {infoMessage && mode === 'login' && (
            <div className="mb-5 p-3 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm flex items-center gap-2.5 animate-scale-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {infoMessage}
            </div>
          )}

          {mode === 'forgot-sent' && (
            <div className="space-y-5">
              <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm flex items-center gap-2.5 animate-scale-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Revisá tu bandeja de entrada (y spam) en unos minutos.
              </div>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4" /> Volver a iniciar sesión
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <form className="space-y-5" onSubmit={handleForgotSubmit}>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-surface-700 mb-1.5">Correo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 group-focus-within:text-primary-600 text-surface-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 block w-full bg-white border border-surface-300 rounded-lg py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="tu@taller.com"
                    disabled={forgotLoading}
                  />
                </div>
              </div>

              {forgotError && (
                <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm flex items-center gap-2.5 animate-scale-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {forgotError}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium text-white bg-surface-900 hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperación'
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                <ChevronLeft className="w-4 h-4" /> Volver a iniciar sesión
              </button>
            </form>
          )}

          {mode === 'login' && (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">Correo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 group-focus-within:text-primary-600 text-surface-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full bg-white border border-surface-300 rounded-lg py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="tu@taller.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-surface-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotError(''); }}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 group-focus-within:text-primary-600 text-surface-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full bg-white border border-surface-300 rounded-lg py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors duration-150"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm flex items-center gap-2.5 animate-scale-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full group flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium text-white bg-surface-900 hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
          )}

          <p className="mt-10 text-xs text-surface-400">
            © {new Date().getFullYear()} FixFlow. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Panel de marca — izquierda en desktop, oculto en móvil */}
      <div className="hidden lg:flex w-1/2 bg-surface-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="flex flex-col items-center text-center animate-fade-in">
          <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-5 mb-8">
            <img
              src="/FixFlowIsologo.svg"
              alt="FixFlow Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Fix<span className="text-primary-400">Flow</span>
          </h2>
          <p className="mt-2 text-sm text-surface-400">
            Gestión integral para tu taller
          </p>

          <div className="mt-12 space-y-3 text-left">
            {[
              'Ingreso de equipos con ticket automático',
              'Notificaciones por WhatsApp en cada estado',
              'Caja, reportes y exportación a Excel',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-surface-300">
                <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-8 text-xs text-surface-500">
          Plataforma multi-taller · Datos aislados por negocio
        </p>
      </div>
    </div>
  );
};
