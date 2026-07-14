# FixFlow — Planes comerciales

**Versión:** 1.0 · **Fecha:** Julio 2026 · **Estado:** Vigente para nuevas altas

> Este documento define la oferta comercial de FixFlow. Se referencia desde los
> Términos y Condiciones (`docs/terminos-y-condiciones.md`). Cualquier cambio de
> precio o alcance debe reflejarse en ambos documentos y notificarse a los
> clientes activos según la cláusula de modificación de condiciones.

---

## 1. Principio de diseño de los planes

FixFlow hoy diferencia planes por **cantidad de sucursales, usuarios y nivel de
soporte** — no por funcionalidad. La razón es técnica y hay que ser honestos
con esto: **todos los módulos del sistema están disponibles para todos los
planes** (WhatsApp, notas de venta, reportes con exportación a Excel, portal
público, marca propia en tickets, etc.), porque el código no tiene todavía
gating de features por plan (ver `requirements.md`, sección 7 — "Enforcement
de planes" está en el roadmap, no implementado).

Los límites de usuarios y sucursales **no están bloqueados por el sistema**:
se administran manualmente desde el Panel Master Admin y se controlan por
contrato. Esto se declara explícitamente en los Términos y Condiciones
(cláusula de "Límites de uso y buena fe") para que quede claro desde el día
uno con cada cliente.

---

## 2. Planes

### 🟢 Plan Básico — pensado para el taller independiente

**Precio sugerido: USD 20/mes** (facturación mensual, pago por transferencia)

| Incluye | Detalle |
|---|---|
| Sucursales | 1 taller (1 tenant) |
| Usuarios | Hasta 2 (dueño + 1 miembro) |
| Módulos | Todos los operativos: check-in, dispositivos, WhatsApp, notas de venta, clientes, caja, reportes y Excel, portal público, impresión térmica/A4 |
| Marca propia | Logo, razón social y RUC en tickets y notas |
| Soporte | Por WhatsApp/email, respuesta en 24–48 h hábiles |
| Onboarding | Guía self-service (documento/video de configuración inicial) |
| Histórico de datos | Sin límite mientras la cuenta esté activa |

Pensado para: un técnico o dos, un solo mostrador, bajo volumen de órdenes.

---

### 🔵 Plan Profesional — pensado para el taller con equipo

**Precio sugerido: USD 40/mes**

| Incluye | Detalle |
|---|---|
| Sucursales | 1 taller (1 tenant) |
| Usuarios | Hasta 5 |
| Módulos | Todos los del Plan Básico |
| Soporte | Prioritario, respuesta en menos de 24 h hábiles, canal directo |
| Onboarding | Sesión guiada de configuración inicial (llamada o videollamada, 1 vez) |
| Extras | Prioridad en solicitudes de ajuste de plantilla WhatsApp / formato de impresión |

Pensado para: taller con 3–5 técnicos/mostradores, mayor volumen de órdenes y
necesidad de respuesta rápida ante problemas.

---

### 🟣 Plan Empresarial — pensado para cadenas o múltiples locales

**Precio sugerido: desde USD 90/mes** (base 2 sucursales) **+ USD 35/mes por
sucursal adicional** — o a cotizar según cantidad.

| Incluye | Detalle |
|---|---|
| Sucursales | 2 o más talleres (cada sucursal = 1 tenant independiente, datos aislados) |
| Usuarios | Sin límite estricto (uso razonable — ver cláusula de buena fe) |
| Módulos | Todos, con prioridad de feedback para nuevas funcionalidades |
| Soporte | Dedicado, canal directo, respuesta en menos de 8 h hábiles |
| Onboarding | Personalizado + capacitación al equipo (presencial/remota) |
| Despliegue dedicado (opcional) | Instancia Vercel + proyecto Supabase exclusivos, sin compartir infraestructura con otros clientes — **precio a cotizar aparte**, requiere trabajo de aprovisionamiento real (no es un simple cambio de plan) |

Pensado para: cadenas de 2+ locales, franquicias, o clientes que por política
interna necesitan aislamiento de infraestructura (no solo de datos).

---

## 3. Qué NO diferencia a los planes (y por qué)

Para que no prometas por error algo que el sistema no puede cumplir hoy:

| Feature | Estado | Nota |
|---|---|---|
| WhatsApp automático (deep-link) | Igual en todos los planes | Decisión tomada: NO se migra a WhatsApp Business API — su costo es variable por mensaje enviado, y se prefiere mantener el deep-link gratuito antes que trasladar ese costo variable al negocio |
| Exportación a Excel | Igual en todos los planes | Sin restricción técnica de período/plan |
| Marca propia (logo, RUC) | Igual en todos los planes | Ya está implementado para todos los tenants por igual |
| Fotos de evidencia | Igual en todos los planes | Sin límite de cantidad por plan a nivel de código |
| Portal público de estado | Igual en todos los planes | No tiene costo marginal por cliente |

Si en el futuro se quiere vender alguna de estas diferencias por plan, hay
que **construir el enforcement primero** — no ponerlo en la tabla de precios
antes de que el código lo soporte.

---

## 4. Reglas de facturación (estado actual)

- **No hay pasarela de pago integrada.** El cobro es manual: transferencia
  bancaria o el medio que se acuerde con cada cliente (ver roadmap en
  `requirements.md` §7 — integración con Stripe u otra pasarela queda
  pendiente).
- Ciclo mensual, renovación automática salvo cancelación con aviso previo
  (ver Términos y Condiciones, cláusula de vigencia).
- Falta de pago → el tenant se marca `activo = false` desde el Master Admin,
  bloqueando el acceso de todos sus usuarios (mecanismo ya operativo, RF-11.3).
- Cambios de plan (upgrade/downgrade) se aplican editando el campo `plan` del
  tenant desde el Master Admin (RF-11.6); no hay prorrateo automático — se
  factura manualmente el ajuste.

---

## 5. Métrica de control de límites (manual, honor-system)

Hasta que exista enforcement en código, usá el Panel Master Admin para
auditar periódicamente:

- Cantidad de usuarios activos por tenant (Master Admin → detalle de taller).
- Cantidad de tenants (sucursales) asociados a un mismo cliente comercial
  (hoy no hay un campo que agrupe tenants de un mismo cliente "cadena" — si
  vendés el Plan Empresarial con varias sucursales, llevá esa relación
  aparte, por ejemplo en una planilla, hasta que se modele en el producto).

Si un cliente supera el límite contratado, el proceso es conversar y
ofrecer upgrade — **no hay bloqueo automático hoy**. Esto está resguardado
contractualmente en los Términos y Condiciones.
