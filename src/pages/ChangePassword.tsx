import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { AuthService } from '../services/SaaSAuthService';
import { Lock, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';

/**
 * Cambio de contraseña: landing tanto del cambio obligatorio en el primer
 * ingreso (flag debe_cambiar_password) como del link de "olvidé mi
 * contraseña" (Supabase deja la sesión de recuperación en el hash de la URL,
 * o un #error=... si el link ya venció o fue usado).
 */
export const ChangePassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAppContext();
  const navigate = useNavigate();

  // Un link de recuperación vencido o ya usado no llega como sesión: Supabase
  // redirige igual a esta página pero con #error=...&error_code=otp_expired.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('error')) {
      setLinkExpired(true);
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.changePassword(password);
      // Forzar re-login con la contraseña nueva en vez de seguir con la sesión actual.
      await logout();
      navigate('/login', {
        replace: true,
        state: { message: 'Contraseña actualizada. Iniciá sesión con tu nueva contraseña.' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('session')) {
        setLinkExpired(true);
      } else {
        setError(msg || 'Error al cambiar la contraseña.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (linkExpired) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans dark:bg-gray-950">
        <div className="w-full max-w-sm animate-fade-in-up text-center">
          <div className="w-11 h-11 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center mx-auto mb-5 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-900 mb-2 dark:text-gray-100">Link vencido</h1>
          <p className="text-sm text-surface-500 mb-8 dark:text-gray-400">
            Este link de recuperación ya expiró o ya fue usado. Pedí uno nuevo desde el login.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ChevronLeft className="w-4 h-4" /> Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans dark:bg-gray-950">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center dark:bg-blue-950/40 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-surface-900 dark:text-gray-100">Nueva contraseña</h1>
            <p className="text-sm text-surface-500 dark:text-gray-400">Por seguridad, cambiá tu contraseña temporal antes de continuar.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-surface-700 mb-1.5 dark:text-gray-300">Nueva contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400 group-focus-within:text-primary-600 transition-colors duration-150 dark:text-gray-500 dark:group-focus-within:text-blue-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 block w-full bg-white border border-surface-300 rounded-lg py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors duration-150 dark:text-gray-500 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-surface-700 mb-1.5 dark:text-gray-300">Repetir contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400 group-focus-within:text-primary-600 transition-colors duration-150 dark:text-gray-500 dark:group-focus-within:text-blue-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-10 block w-full bg-white border border-surface-300 rounded-lg py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm flex items-center gap-2.5 animate-scale-in dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium text-white bg-surface-900 hover:bg-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar y continuar'
            )}
          </button>

          <button
            type="button"
            onClick={async () => { await logout(); navigate('/login'); }}
            className="w-full text-sm text-surface-500 hover:text-surface-700 transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
};
