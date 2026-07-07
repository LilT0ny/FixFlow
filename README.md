# FixFlow

**Sistema de gestión integral para talleres de reparación — SaaS multi-tenant.**

FixFlow digitaliza el ciclo completo de un taller de reparaciones: ingreso del equipo con ticket térmico automático, seguimiento por estados con fotos de evidencia, notificaciones al cliente por WhatsApp, ventas directas, control de caja y reportes exportables a Excel. Una sola plataforma atiende a múltiples talleres, cada uno con su marca, sus usuarios y sus datos aislados.

> 📋 La especificación completa (requerimientos funcionales, no funcionales y alcance comercial) está en [`requirements.md`](./requirements.md).

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| 🏠 **Inicio** | Métricas operativas del taller en tiempo real |
| 📥 **Nuevo ingreso** | Wizard de 3 pasos con validación de cédula (Módulo 10), autocompletado de clientes e impresión térmica por duplicado |
| 📱 **Dispositivos** | Órdenes con filtros por estado, fotos de evidencia (cámara), edición y ciclo `recibido → entregado` |
| 💬 **WhatsApp** | Notificación al cliente en cada cambio de estado, con plantilla personalizable |
| 🧾 **Notas de venta** | Venta de repuestos/accesorios con impresión de comprobante |
| 👥 **Clientes** | Base de clientes con historial |
| 💰 **Transacciones** | Arqueo de caja por fecha y medio de pago |
| 📊 **Reportes** | Flujo de caja con gráficos y exportación a Excel |
| ⚙️ **Configuración** | Marca del taller, formato de impresora, plantillas y usuarios |
| 🌐 **Portal público** | El cliente final consulta su reparación en `/status/:orden` sin cuenta |
| 🏢 **Master Admin** | Alta y gestión de talleres (tenants) y planes del SaaS |

## Stack

- **Frontend:** React 19 · TypeScript · Vite 7 · Tailwind CSS v4 · React Router 7
- **Datos:** Supabase (PostgreSQL multi-tenant, Auth, Storage)
- **Extras:** Recharts (gráficos) · ExcelJS (exportación) · Lucide (iconos)
- **Deploy:** Vercel (SPA con rewrites)

## Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno (.env.local)
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>

# 3. Levantar en local
npm run dev

# Producción
npm run build && npm run preview
```

## Estructura del proyecto

```
src/
├── components/        # Design system compartido
│   ├── atoms/         # Button, Input, Select, Card...
│   ├── molecules/     # FormField, StatCard
│   ├── organisms/     # PrintManager, PrintableReceipt
│   └── design-system/ # PageHeader, Badge, DataCard, EmptyState...
├── features/          # Un directorio por módulo de negocio
│   ├── Dashboard/  ├── Registration/  ├── DeviceList/
│   ├── Sales/      ├── Clients/       ├── CashRegister/
│   ├── Reports/    ├── Settings/      └── MasterAdmin/
├── services/          # Capa de acceso a datos (Supabase)
├── hooks/             # Lógica de negocio reutilizable
├── store/             # Contextos (sesión, configuración)
├── pages/             # Login y portal público de estado
└── utils/             # Impresión, fechas, WhatsApp
```

Cada feature sigue el patrón contenedor/presentacional: el hook (`useXxx`) concentra la lógica y los componentes solo presentan.

---

© FixFlow. Todos los derechos reservados.
