import React, { useState } from 'react';
import { Users, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { UserManagementService } from '../../../services/UserManagementService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/molecules/Modal';
import { GeneratedPasswordField } from '../../../components/molecules/GeneratedPasswordField';
import { generateTempPassword } from '../../../utils/generatePassword';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState(() => generateTempPassword());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

  const resetForm = () => {
    setEmail('');
    setNombre('');
    setPassword(generateTempPassword());
    setError('');
    setCreatedUser(null);
  };

  const handleClose = () => {
    const wasCreated = !!createdUser;
    resetForm();
    onClose();
    if (wasCreated) onUserCreated?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El correo es requerido');
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
        setCreatedUser({ email: result.email, password });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el usuario';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader
        title={createdUser ? 'Usuario creado' : 'Crear nuevo usuario'}
        subtitle="Acceso al sistema"
        icon={<Users className="w-5 h-5" />}
        onClose={handleClose}
        closeDisabled={isLoading}
      />

      {createdUser ? (
        <>
          <ModalBody className="space-y-4">
            <div className="p-3 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm flex items-center gap-2.5 animate-scale-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {`"${createdUser.email}" fue creado correctamente`}
            </div>
            <GeneratedPasswordField password={createdUser.password} />
            <p className="text-xs text-surface-500 bg-surface-50 border border-surface-200 rounded-lg p-3">
              Copiá esta contraseña ahora — no se va a volver a mostrar. El miembro deberá cambiarla en su primer inicio de sesión.
            </p>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 transition-all duration-150 active:scale-[0.98]"
            >
              Listo
            </button>
          </ModalFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="contents">
          <ModalBody className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm flex items-center gap-2.5 animate-scale-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
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

            <GeneratedPasswordField password={password} onRegenerate={() => setPassword(generateTempPassword())} />
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={handleClose}
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
      )}
    </Modal>
  );
};
