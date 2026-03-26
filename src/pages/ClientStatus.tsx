import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { CheckCircle2, Clock, MapPin, Wrench, PackageCheck, AlertCircle } from 'lucide-react';


export const ClientStatus = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useAppContext();
  
  const order = orders.find(o => o.orderNumber === id || o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Orden no encontrada</h2>
          <p className="text-gray-500 mb-6">Por favor verifica el número de orden o escanea nuevamente tu código QR.</p>
          <Link to="/" className="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    { status: 'recibido', label: 'Recibido', desc: 'Dispositivo ingresado al taller', icon: MapPin },
    { status: 'diagnostico', label: 'En Diagnóstico', desc: 'Revisión técnica en progreso', icon: Wrench },
    { status: 'esperando_repuestos', label: 'Esperando Repuestos', desc: 'Aguardando partes necesarias', icon: Clock },
    { status: 'listo', label: 'Listo para Entrega', desc: 'Reparación finalizada', icon: CheckCircle2 },
    { status: 'entregado', label: 'Entregado', desc: 'Retirado por el cliente', icon: PackageCheck }
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start sm:p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-none sm:rounded-3xl shadow-sm border-x border-b sm:border border-gray-100 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-blue-600 px-6 sm:px-10 py-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-bold tracking-tight mb-1">Estado de Reparación</h1>
             <p className="text-blue-100 font-medium">Orden #{order.orderNumber}</p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-center">
             <span className="block text-xs uppercase tracking-wider text-blue-100 mb-0.5">Fecha Ingreso</span>
             <span className="font-semibold text-lg">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Quick info card */}
          <div className="bg-blue-50/50 rounded-2xl p-5 sm:p-6 border border-blue-100/50 flex flex-col sm:flex-row justify-between gap-4">
             <div>
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Equipo Reportado</h3>
               <p className="font-semibold text-gray-900 text-lg">{order.device?.brand || 'GENERAL'} {order.device?.model || ''}</p>
               <p className="text-sm text-gray-600 mt-1">Falla: <span className="font-medium text-red-600">{order.repair.reportedIssue}</span></p>
             </div>
             
             <div className="sm:text-right flex flex-col justify-center">
               {order.status === 'listo' ? (
                 <p className="text-sm text-green-700 font-bold mt-1 bg-green-100 px-4 py-2 inline-block rounded-xl sm:ml-auto w-max border border-green-200">¡Tu equipo está listo para retirar!</p>
               ) : order.status === 'entregado' ? (
                 <p className="text-sm text-gray-700 font-bold mt-1 bg-gray-100 px-4 py-2 inline-block rounded-xl sm:ml-auto w-max border border-gray-200">Equipo entregado al cliente.</p>
               ) : (
                 <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-xl border border-blue-200 shadow-sm text-sm font-bold">
                   <Wrench className="w-4 h-4" />
                   En proceso de reparación
                 </div>
               )}
             </div>
          </div>

          {/* Timeline */}
          <div className="pt-4">
             <h3 className="text-lg font-bold text-gray-900 mb-6">Línea de Tiempo</h3>
             
             <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
               {timelineSteps.map((step, index) => {
                 const isCompleted = index <= currentStepIndex;
                 const isCurrent = index === currentStepIndex;
                 // Waiting for parts is an optional middle step, so slightly different logic if we want to skip it, but here we show all.
                 
                 let iconBg = 'bg-white border-2 border-gray-200 text-gray-400';
                 if (isCompleted) iconBg = 'bg-blue-600 text-white shadow-md shadow-blue-200';
                 if (isCurrent) iconBg = 'bg-blue-600 text-white shadow-lg shadow-blue-300 ring-4 ring-blue-50';

                 return (
                   <div key={step.status} className="relative pl-8">
                     <span className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${iconBg}`}>
                       <step.icon className="w-4 h-4" strokeWidth={isCurrent ? 3 : 2} />
                     </span>
                     
                     <div className={`transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                       <h4 className={`text-base font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                         {step.label}
                       </h4>
                       <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm pb-8">
        Sistema de Reparación de Celulares &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};
