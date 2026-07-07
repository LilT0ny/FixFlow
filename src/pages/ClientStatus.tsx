import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, MapPin, Wrench, PackageCheck, AlertCircle, Search, Loader2, XCircle } from 'lucide-react';

interface PublicOrderStatus {
  numero_orden: string;
  estado: string;
  taller: string;
  dispositivo: string;
  creado: string;
  historial: { estado: string; fecha: string }[] | null;
}

/**
 * Portal público de consulta: el cliente final ingresa su cédula para
 * ver el estado de su orden. No requiere cuenta — usa el RPC
 * consultar_orden_publica (security definer, único acceso anónimo).
 */
export const ClientStatus = () => {
  const { id } = useParams<{ id: string }>();
  const [cedula, setCedula] = useState('');
  const [order, setOrder] = useState<PublicOrderStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !cedula.trim()) return;

    setLoading(true);
    setNotFound(false);
    try {
      const { data, error } = await supabase.rpc('consultar_orden_publica', {
        p_numero: id,
        p_cedula: cedula.trim(),
      });
      if (error) throw error;
      if (data) {
        setOrder(data as PublicOrderStatus);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error consultando orden:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const timelineSteps = [
    { status: 'recibido', label: 'Recibido', desc: 'Dispositivo ingresado al taller', icon: MapPin },
    { status: 'diagnostico', label: 'En Diagnóstico', desc: 'Revisión técnica en progreso', icon: Wrench },
    { status: 'esperando_repuestos', label: 'Esperando Repuestos', desc: 'Aguardando partes necesarias', icon: Clock },
    { status: 'listo', label: 'Listo para Entrega', desc: 'Reparación finalizada', icon: CheckCircle2 },
    { status: 'entregado', label: 'Entregado', desc: 'Retirado por el cliente', icon: PackageCheck }
  ];

  // ── Formulario de verificación de identidad ──
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full animate-scale-in">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-1 text-center">Estado de tu reparación</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Orden <span className="font-medium text-gray-900">#{id}</span> — ingresá tu cédula para verificar tu identidad.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              required
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Número de cédula"
              className="block w-full bg-white border border-gray-300 rounded-lg py-2.5 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors duration-150 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={loading}
            />

            {notFound && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No encontramos una orden con esos datos. Verificá el número y la cédula.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-150 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-gray-400 text-xs">
          <img src="/FixFlow.svg" alt="FixFlow Logo" className="h-8 opacity-50" />
          <span>Impulsado por FixFlow &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    );
  }

  // ── Vista de estado ──
  const isNoReparado = order.estado === 'no_reparado';
  const currentStepIndex = timelineSteps.findIndex(s => s.status === order.estado);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start sm:p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-none sm:rounded-xl shadow-sm border-x border-b sm:border border-gray-200 overflow-hidden animate-fade-in-up">
        {/* Header Branding */}
        <div className="bg-blue-600 px-6 sm:px-10 py-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Estado de reparación</h1>
            <p className="text-blue-100">Orden #{order.numero_orden} · {order.taller}</p>
          </div>
          <div className="bg-white/15 px-4 py-2 rounded-lg text-center">
            <span className="block text-xs text-blue-100 mb-0.5">Fecha de ingreso</span>
            <span className="font-semibold text-lg">{new Date(order.creado).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8">

          {/* Quick info card */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-2">Equipo reportado</h3>
              <p className="font-semibold text-gray-900 text-lg">{order.dispositivo || 'GENERAL'}</p>
            </div>

            <div className="sm:text-right flex flex-col justify-center">
              {order.estado === 'listo' ? (
                <p className="text-sm text-green-700 font-medium mt-1 bg-green-50 px-3.5 py-2 inline-block rounded-lg sm:ml-auto w-max border border-green-200">¡Tu equipo está listo para retirar!</p>
              ) : order.estado === 'entregado' ? (
                <p className="text-sm text-gray-700 font-medium mt-1 bg-gray-100 px-3.5 py-2 inline-block rounded-lg sm:ml-auto w-max border border-gray-200">Equipo entregado al cliente.</p>
              ) : isNoReparado ? (
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3.5 py-2 rounded-lg border border-red-200 text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  No fue posible reparar el equipo
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-2 rounded-lg border border-blue-200 text-sm font-medium">
                  <Wrench className="w-4 h-4" />
                  En proceso de reparación
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {!isNoReparado && (
            <div className="pt-4">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Línea de tiempo</h3>

              <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const fecha = order.historial?.find(h => h.estado === step.status)?.fecha;

                  let iconBg = 'bg-white border-2 border-gray-200 text-gray-400';
                  if (isCompleted) iconBg = 'bg-blue-600 text-white';
                  if (isCurrent) iconBg = 'bg-blue-600 text-white ring-4 ring-blue-100';

                  return (
                    <div key={step.status} style={{ animationDelay: `${index * 80}ms` }} className="relative pl-8 animate-fade-in-up">
                      <span className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${iconBg}`}>
                        <step.icon className="w-4 h-4" strokeWidth={isCurrent ? 3 : 2} />
                      </span>

                      <div className={`transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                        <h4 className={`text-base font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                          {step.label}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                        {isCompleted && fecha && (
                          <p className="text-xs text-gray-400 mt-1">{new Date(fecha).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 text-gray-400 text-xs pb-12">
        <img
          src="/FixFlow.svg"
          alt="FixFlow Logo"
          className="h-8 opacity-50 hover:opacity-90 transition-opacity duration-300"
        />
        <span>Impulsado por FixFlow &copy; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
};
