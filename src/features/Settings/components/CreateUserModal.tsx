import React, { useState } from 'react';
import { Users, Plus, X, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { UserManagementService } from '../../../services/UserManagementService';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'technician' | 'admin'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!username.trim()) {
      setError('El usuario es requerido');
      return;
    }

    if (username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const result = await UserManagementService.createUser({
        username: username.trim().toLowerCase(),
        password,
        role,
      });

      if (result) {
        setSuccess(`Usuario "${result.username}" creado exitosamente`);
        // Limpiar formulario
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRole('user');
        
        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          onClose();
          onUserCreated?.();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el usuario';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[32px] shadow-2xl border border-surface-200 w-full max-w-md animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-50 flex items-center justify-center text-surface-400 border border-surface-100">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Crear Nuevo Usuario</h3>
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Acceso al Sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-50 rounded-xl transition-colors text-surface-400 hover:text-surface-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100/50 text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <div className="bg-red-500 p-1.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                </div>
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <div className="bg-emerald-500 p-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Usuario del Sistema
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Ej. julio_repair"
                  disabled={isLoading}
                  className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 disabled:opacity-50 transition-all outline-none"
                />
                <p className="text-[9px] text-surface-400">Mín. 3 caracteres, solo letras y números</p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 pr-12 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 disabled:opacity-50 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-300 hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-surface-400">Mín. 8 caracteres</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 pr-12 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 disabled:opacity-50 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-300 hover:text-primary-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Rol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['user', 'technician', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      disabled={isLoading}
                      className={`px-3 py-2 border rounded-lg text-center transition-all text-xs font-black uppercase tracking-tighter active:scale-95 disabled:opacity-50 ${
                        role === r
                          ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-surface-200 text-surface-500 hover:bg-surface-50'
                      }`}
                    >
                      {r === 'user' && 'Usuario'}
                      {r === 'technician' && 'Técnico'}
                      {r === 'admin' && 'Admin'}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-surface-400">
                  {role === 'admin' && 'Acceso completo al sistema'}
                  {role === 'technician' && 'Solo órdenes y clientes'}
                  {role === 'user' && 'Acceso limitado'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-surface-200 rounded-2xl text-sm font-black text-surface-600 hover:bg-surface-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-2xl text-sm font-black hover:bg-primary-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
