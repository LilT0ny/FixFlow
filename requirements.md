# FixFlow — Especificación de Requerimientos y Alcance Comercial

**Versión:** 1.0 · **Fecha:** Julio 2026 · **Estado:** Producto funcional en operación

---

## 1. Visión del producto

**FixFlow** es un sistema de gestión integral para talleres de reparación de dispositivos (celulares, laptops, electrodomésticos y más), diseñado como **SaaS multi-tenant**: una sola instancia de la plataforma atiende a múltiples talleres, cada uno con sus datos, usuarios y configuración aislados.

**Propuesta de valor:** digitalizar el ciclo completo del taller — desde el ingreso del equipo hasta la entrega y el cobro — reemplazando cuadernos, tickets manuales y planillas sueltas por un flujo único: registro con validación, ticket térmico impreso automáticamente, notificación al cliente por WhatsApp, control de caja y reportes exportables.

### Usuarios del sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Master Admin** | Operador de la plataforma (dueño del SaaS) | Panel maestro: alta/baja de talleres y sus usuarios |
| **Administrador** | Dueño o encargado del taller | Acceso completo a su tenant |
| **Técnico** | Personal técnico del taller | Órdenes y clientes |
| **Usuario** | Personal de mostrador | Acceso limitado |
| **Cliente final** | Cliente del taller | Portal público de consulta de estado (sin login) |

---

## 2. Alcance actual — Módulos listos para comercializar

Todos los módulos listados están **implementados y operativos**:

| # | Módulo | Valor comercial |
|---|--------|-----------------|
| 1 | **Panel de inicio (Dashboard)** | Visión operativa inmediata: equipos en taller, listos, en diagnóstico, esperando repuestos + últimos ingresos |
| 2 | **Ingreso de equipos (Check-in)** | Wizard de 3 pasos con validación de cédula ecuatoriana (Módulo 10), autocompletado de clientes frecuentes e impresión térmica automática del ticket por duplicado |
| 3 | **Gestión de dispositivos** | Tablero de órdenes con búsqueda, filtros por estado, fotos de evidencia (antes/durante/después, con cámara del dispositivo), edición y ciclo de estados completo |
| 4 | **Notificaciones WhatsApp** | Aviso automático al cliente en cada cambio de estado, con plantilla personalizable por taller |
| 5 | **Notas de venta** | Venta directa de repuestos/accesorios con múltiples ítems, consumidor final, e impresión de comprobante |
| 6 | **Clientes** | Base de datos de clientes con historial, alta/edición/baja |
| 7 | **Caja y transacciones** | Arqueo por fecha y medio de pago (efectivo/transferencia), ingresos y egresos manuales, balance consolidado |
| 8 | **Reportes** | Flujo de caja mensual con gráfico, detalle diario y **exportación a Excel** |
| 9 | **Configuración por taller** | Marca propia (logo, razón social, RUC), formato de impresora (58mm/80mm/A4), plantilla de WhatsApp, gestión de usuarios |
| 10 | **Portal público de estado** | El cliente final consulta el estado de su reparación en `/status/:orden` sin necesidad de cuenta — línea de tiempo visual |
| 11 | **Panel Master Admin** | Administración del SaaS: alta de talleres (tenants), planes (basic/professional/enterprise), activación/desactivación y gestión de usuarios por tenant |

---

## 3. Requerimientos funcionales

### RF-01 · Autenticación y control de acceso
- **RF-01.1** — Login unificado por usuario y contraseña; la sesión distingue automáticamente entre Master Admin y usuarios de tenant.
- **RF-01.2** — Opción "mantener sesión iniciada" (persistencia de sesión).
- **RF-01.3** — Rutas protegidas: sin sesión válida se redirige a `/login`; el panel maestro exige el flag `is_master`.
- **RF-01.4** — Roles por tenant: administrador, técnico y usuario, con niveles de acceso diferenciados.

### RF-02 · Ingreso de equipos (órdenes de reparación)
- **RF-02.1** — Wizard de 3 pasos: cliente → equipo → detalles y presupuesto, con validación por paso (no se avanza con datos inválidos).
- **RF-02.2** — Validación de cédula/RUC ecuatoriano mediante algoritmo Módulo 10; acepta CI extranjera (11–13 dígitos) y consumidor final.
- **RF-02.3** — Autocompletado de cliente frecuente: al completar 10 o 13 dígitos de cédula, el sistema busca al cliente y precarga nombre, teléfono, email y dirección.
- **RF-02.4** — Validación de teléfono en formato local (09…) o internacional (+593…).
- **RF-02.5** — Soporte de 13 categorías de dispositivo (celular, laptop, tablet, impresora, línea blanca, TV, etc.) con validación de IMEI (15 dígitos) o número de serie según categoría.
- **RF-02.6** — Registro de costo estimado y abono inicial; el abono no puede superar el costo total.
- **RF-02.7** — Al confirmar, se genera la orden con folio secuencial (prefijo `REP`) y se imprime el ticket térmico **por duplicado** (términos + firmas) de forma automática.

### RF-03 · Gestión de dispositivos
- **RF-03.1** — Listado de órdenes con búsqueda por nombre, cédula o identificador de equipo, y filtros combinables por estado.
- **RF-03.2** — Ciclo de estados: `recibido → diagnóstico → esperando repuestos → listo → entregado`, con confirmación explícita en cada transición.
- **RF-03.3** — Fotos de evidencia por etapa (antes/durante/después, hasta 9), capturadas con la cámara del dispositivo o subidas como archivo, con visor ampliado.
- **RF-03.4** — Edición completa de la orden (cliente, equipo, costos) con las mismas validaciones del ingreso.
- **RF-03.5** — Al marcar "entregado": resumen económico (total, abonado, saldo), selección de método de cobro y generación opcional de nota de venta con datos de facturación.
- **RF-03.6** — Eliminación lógica de órdenes (soft delete) con confirmación.
- **RF-03.7** — Reimpresión de tickets y notas desde cualquier orden.

### RF-04 · Notificaciones WhatsApp
- **RF-04.1** — Envío de notificación al cliente en cambios de estado (excepto entrega) y bajo demanda desde la orden.
- **RF-04.2** — Plantilla de mensaje editable por taller con marcadores dinámicos: `{{customer}}`, `{{device}}`, `{{model}}`, `{{status}}`, `{{orderNumber}}`, `{{total}}`, `{{abono}}`, `{{saldo}}`.

### RF-05 · Notas de venta
- **RF-05.1** — Creación de notas con múltiples ítems (descripción, cantidad, precio unitario) y total calculado en tiempo real.
- **RF-05.2** — Atajo "Consumidor Final" con datos fiscales predefinidos.
- **RF-05.3** — Folio secuencial con prefijo `NT`; cada nota registra automáticamente el ingreso en caja.
- **RF-05.4** — Impresión automática del comprobante al confirmar; listado con búsqueda por cliente, documento o folio.

### RF-06 · Clientes
- **RF-06.1** — CRUD completo de clientes (nombre, cédula/RUC, teléfono, email, dirección).
- **RF-06.2** — Búsqueda por nombre o cédula; los datos alimentan el autocompletado del check-in.

### RF-07 · Caja y transacciones
- **RF-07.1** — Registro manual de ingresos y egresos con monto, concepto, medio de pago y clasificación (servicio técnico, repuestos, insumos, otro).
- **RF-07.2** — Filtros por fecha, medio de pago y concepto.
- **RF-07.3** — Indicadores en tiempo real: efectivo en caja, transferencias, egresos y balance consolidado.
- **RF-07.4** — Los cobros de reparaciones y notas de venta se registran automáticamente en caja.

### RF-08 · Reportes
- **RF-08.1** — Vista mensual: gráfico de área de ingresos vs. egresos día a día.
- **RF-08.2** — Vista diaria: detalle de movimientos con hora, concepto, categoría y método.
- **RF-08.3** — Exportación a Excel (.xlsx) del período seleccionado.

### RF-09 · Configuración del taller
- **RF-09.1** — Perfil de empresa: razón social, RUC, teléfono, dirección y logo (se reflejan en tickets y en toda la interfaz).
- **RF-09.2** — Formato de impresión predeterminado: térmica 58mm, 80mm u hoja A4.
- **RF-09.3** — Alta de usuarios del taller con rol, desde la propia configuración (contraseña mínima de 8 caracteres).

### RF-10 · Portal público de consulta
- **RF-10.1** — Página pública `/status/:orden` sin autenticación, con marca del sistema.
- **RF-10.2** — Línea de tiempo visual de los 5 estados con el estado actual destacado y datos del equipo/falla.

### RF-11 · Administración del SaaS (Master Admin)
- **RF-11.1** — Alta de talleres (tenants) con nombre, slug autogenerado, email, RUC, teléfono y dirección.
- **RF-11.2** — Planes comerciales por tenant: `basic`, `professional`, `enterprise`.
- **RF-11.3** — Activación/desactivación de tenants: un tenant inactivo bloquea el acceso de todos sus usuarios.
- **RF-11.4** — Gestión de usuarios por tenant (crear, activar, desactivar) con rol.
- **RF-11.5** — Indicadores del SaaS: talleres activos, total de clientes, estado del sistema.

### RF-12 · Impresión
- **RF-12.1** — Generación de tickets de ingreso (doble copia con términos y firmas) y notas de venta.
- **RF-12.2** — Formatos soportados: térmica 58mm, 80mm y hoja A4, con logo y datos del taller.

---

## 4. Requerimientos no funcionales

### RNF-01 · Diseño y usabilidad
- **RNF-01.1** — Interfaz **100% responsive** con enfoque *mobile-first*: operable desde 360px (móvil de mostrador) hasta escritorio. Tablas con scroll horizontal contenido o colapso a tarjetas; menú lateral fijo en escritorio y drawer en móvil.
- **RNF-01.2** — Sistema de diseño unificado (atomic design): un acento de color, escala tipográfica Inter, componentes compartidos (`Button`, `Input`, `Badge`, `DataCard`, `PageHeader`, `EmptyState`, etc.).
- **RNF-01.3** — Micro-animaciones con propósito (entradas suaves, transiciones de 150ms) con respeto de `prefers-reduced-motion` (accesibilidad).
- **RNF-01.4** — Targets táctiles de mínimo 40–44px en controles principales.
- **RNF-01.5** — Idioma: español (interfaz completa y documentos impresos).

### RNF-02 · Rendimiento
- **RNF-02.1** — SPA servida como archivos estáticos con build optimizado (Vite: tree-shaking, code-splitting, minificación).
- **RNF-02.2** — Tailwind CSS v4 con generación bajo demanda: solo se envía el CSS utilizado.
- **RNF-02.3** — Fotos de evidencia comprimidas a JPEG (calidad 0.85) antes de subir.
- **RNF-02.4** — Búsquedas y filtros resueltos en memoria sobre datos ya cargados (respuesta inmediata en listados operativos).

### RNF-03 · Seguridad
- **RNF-03.1** — Aislamiento multi-tenant: cada consulta se acota al tenant de la sesión; los datos de un taller no son visibles para otro.
- **RNF-03.2** — Backend gestionado por Supabase (PostgreSQL) con clave anónima restringida; credenciales fuera del código vía variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **RNF-03.3** — Contraseñas con longitud mínima de 8 caracteres; usuarios desactivables sin pérdida de historial.
- **RNF-03.4** — Eliminaciones lógicas (soft delete) en órdenes: trazabilidad y recuperación ante errores.
- **RNF-03.5** — Sin vulnerabilidades altas conocidas en dependencias (migración de `xlsx` a `exceljs` ya realizada por CVEs).

### RNF-04 · Compatibilidad
- **RNF-04.1** — Navegadores modernos (Chrome, Edge, Firefox, Safari) en escritorio y móvil.
- **RNF-04.2** — Impresoras térmicas de 58mm y 80mm e impresoras estándar A4, vía diálogo de impresión del navegador.
- **RNF-04.3** — Cámara del dispositivo (getUserMedia) para captura de evidencias en móvil y escritorio.

### RNF-05 · Mantenibilidad y escalabilidad
- **RNF-05.1** — TypeScript estricto en todo el frontend; tipado de dominio centralizado (`src/types`).
- **RNF-05.2** — Arquitectura por features con separación clara: `services/` (acceso a datos), `hooks/` (lógica de negocio), `components/` (presentación) — patrón contenedor/presentacional.
- **RNF-05.3** — Multi-tenancy por fila (tenant_id) sobre una única base: agregar un taller no requiere infraestructura nueva.
- **RNF-05.4** — Despliegue continuo como sitio estático (Vercel, con rewrites SPA configurados).

### RNF-06 · Disponibilidad
- **RNF-06.1** — Frontend en CDN global (Vercel) y backend gestionado (Supabase), ambos con SLA de proveedor; sin servidores propios que mantener.

---

## 5. Arquitectura y stack técnico

```
┌─────────────────────────────────────────────┐
│  Frontend SPA — React 19 + TypeScript       │
│  Vite 7 · Tailwind CSS v4 · React Router 7  │
│  Recharts (gráficos) · ExcelJS (export)     │
│  Desplegado en Vercel (CDN + rewrites SPA)  │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (supabase-js)
┌──────────────────▼──────────────────────────┐
│  Supabase (BaaS)                            │
│  PostgreSQL multi-tenant · Auth · Storage   │
│  (fotos de evidencia)                       │
└─────────────────────────────────────────────┘
```

- **Patrones:** atomic design + feature folders, servicios como capa de acceso a datos, contextos de React para sesión y configuración.
- **Integraciones:** WhatsApp (deep-link `wa.me` con mensaje plantillado), impresión vía ventana del navegador.

---

## 6. Modelo comercial (SaaS)

| Concepto | Estado |
|----------|--------|
| Aprovisionamiento de talleres desde panel maestro | ✅ Operativo |
| Planes por tenant (`basic` / `professional` / `enterprise`) | ✅ Campo operativo — *la diferenciación de features por plan aún no se aplica en runtime* |
| Suspensión de servicio (tenant inactivo = acceso bloqueado) | ✅ Operativo |
| Marca blanca por taller (logo + datos en app y tickets) | ✅ Operativo |
| Facturación/cobro de suscripciones | ❌ Fuera de alcance actual (manual) |

**Modalidades de venta viables hoy:**
1. **SaaS por suscripción** — un despliegue central, alta de cada cliente en minutos desde el panel maestro.
2. **Licencia cerrada (on-premise/single-tenant)** — un despliegue Vercel + proyecto Supabase dedicados por cliente.

---

## 7. Limitaciones conocidas y roadmap sugerido

| Ítem | Detalle | Prioridad |
|------|---------|-----------|
| **QR en el ticket** | El portal público existe, pero el ticket impreso aún no incluye el código QR que enlace a `/status/:orden` (`qrcode.react` está instalado sin uso) | Alta |
| **Portal público y datos** | La página de estado consume el contexto de la app; conviene un endpoint público dedicado de solo lectura | Alta |
| **Enforcement de planes** | Los planes existen como dato pero no limitan funcionalidades por nivel | Media |
| **Permisos por rol en UI** | Los roles existen; falta granularidad visible por pantalla (técnico vs. admin) | Media |
| **Facturación de suscripciones** | Integrar pasarela (Stripe u otra) para el cobro del SaaS | Media |
| **Notificaciones WhatsApp API** | Hoy se usa deep-link (requiere acción del operador); migrar a WhatsApp Business API permitiría envío automático real | Baja |
| **Auditoría** | Bitácora de acciones por usuario (quién cambió qué) | Baja |

---

*Documento generado a partir del código fuente en producción — refleja funcionalidad implementada, no planificada.*
