import React, { useState } from 'react';
import { Users, Plus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { UserManagementService } from '../../../services/UserManagementService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/molecules/Modal';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('El correo es requerido');
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
      // El owner crea miembros de su taller; el miembro deberá cambiar
      // esta contraseña temporal en su primer ingreso.
      const result = await UserManagementService.createUser({
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        password,
        role: 'member',
      });

      if (result) {
        setSuccess(`Usuario "${result.email}" creado exitosamente`);
        setEmail('');
        setNombre('');
        setPassword('');
        setConfirmPassword('');

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title="Crear nuevo usuario"
        subtitle="Acceso al sistema"
        icon={<Users className="w-5 h-5" />}
        onClose={onClose}
        closeDisabled={isLoading}
      />

      <form onSubmit={handleSubmit} className="contents">
        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm flex items-center gap-2.5 animate-scale-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm flex items-center gap-2.5 animate-scale-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-600">Correo del miembro</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="Ej. julio@taller.com"
              disabled={isLoading}
              className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 transition-colors duration-150 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-600">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Julio Pérez"
              disabled={isLoading}
              className="w-full bg-white border border-surface-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 transition-colors duration-150 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-600">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 transition-colors duration-150 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-300 hover:text-primary-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-surface-400">Mín. 8 caracteres</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-surface-600">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full bg-white border border-surface-300 rounded-lg px-3.5 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 transition-colors duration-150 outline-none"
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

          <p className="text-xs text-surface-500 bg-surface-50 border border-surface-200 rounded-lg p-3">
            El miembro ingresará con esta contraseña temporal y el sistema le pedirá cambiarla en su primer inicio de sesión.
          </p>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 border border-surface-300 bg-white rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear usuario
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
