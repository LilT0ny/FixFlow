# FixFlow — Términos y Condiciones del Servicio

**Versión:** 1.0 (borrador) · **Fecha:** Julio 2026
**Estado: BORRADOR — requiere revisión de un abogado ecuatoriano antes de
usarse como contrato vinculante.** Este documento resuelve la estructura y el
contenido comercial/técnico; no reemplaza asesoría legal, en particular en lo
referido a la Ley Orgánica de Protección de Datos Personales (LOPDP) de
Ecuador.

> Se referencia junto con `docs/pricing-plans.md`, que define alcance y
> precio de cada plan.

---

## 1. Objeto

FixFlow ("el Proveedor") ofrece un servicio de software como servicio (SaaS)
para la gestión integral de talleres de reparación de dispositivos
("el Servicio"), bajo modalidad multi-tenant: una misma plataforma atiende a
múltiples talleres clientes ("el Cliente"), con datos aislados por tenant.

El Cliente contrata el Servicio bajo el plan comercial acordado
(Básico / Profesional / Empresarial, según `docs/pricing-plans.md`), aceptando
estos Términos y Condiciones al momento del alta de su cuenta.

---

## 2. Descripción del servicio y alcance funcional

El Servicio incluye, de forma no exhaustiva, los módulos operativos vigentes
a la fecha de este documento (dashboard, ingreso de equipos, gestión de
dispositivos, notificaciones por WhatsApp, notas de venta, clientes, caja y
transacciones, reportes, configuración de marca propia, portal público de
consulta, impresión de tickets). El detalle funcional completo está en
`requirements.md`.

**El Proveedor puede modificar, agregar o quitar funcionalidades** en el
curso normal de evolución del producto, sin que esto constituya
incumplimiento contractual, siempre que no reduzca sustancialmente el
valor del plan contratado sin aviso previo (ver cláusula 9).

---

## 3. Planes, límites de uso y buena fe

- Cada plan tiene límites de sucursales (tenants) y usuarios definidos en
  `docs/pricing-plans.md`.
- **El Cliente reconoce y acepta que, a la fecha, estos límites no están
  técnicamente bloqueados por el sistema** y su cumplimiento se basa en la
  buena fe contractual, sujeto a auditoría periódica por parte del
  Proveedor.
- Si el Proveedor detecta que el uso real supera el plan contratado,
  notificará al Cliente y ofrecerá el upgrade correspondiente. El uso
  sostenido por encima del plan sin regularización dentro de los 15 días
  de notificado habilita al Proveedor a suspender el acceso hasta
  resolver la situación.

---

## 4. Propiedad de los datos

- **Los datos ingresados por el Cliente** (información de sus propios
  clientes finales, órdenes, fotos de evidencia, transacciones, configuración
  de marca) **son propiedad del Cliente**. El Proveedor actúa como
  custodio técnico y encargado del tratamiento sobre esa información,
  no como propietario.
- El Proveedor no utilizará los datos del Cliente con fines distintos a la
  prestación del Servicio, salvo agregación estadística no identificable
  para mejora del producto, o requerimiento legal.
- **Portabilidad de datos:** el Cliente puede exportar en cualquier momento,
  desde Configuración → Exportar, un archivo Excel (`.xlsx`) con la
  totalidad de sus datos operativos: clientes, órdenes de reparación,
  transacciones de caja y notas de venta. Las fotos de evidencia (archivos
  binarios en Storage) quedan fuera de este export y se gestionan aparte.
  Ante una cancelación, el Cliente puede además solicitar un export asistido
  dentro de los 30 días posteriores a la baja; pasado ese plazo, el
  Proveedor puede eliminar definitivamente los datos del tenant.

---

## 5. Protección de datos personales (LOPDP — Ecuador)

El Servicio procesa datos personales de terceros (clientes finales del
Cliente): nombre, cédula/RUC, teléfono, dirección, email, y en algunos casos
fotografías de equipos que pueden incluir información visible del portador.

- El **Cliente** es responsable del tratamiento de los datos personales de
  sus propios clientes finales frente a la Ley Orgánica de Protección de
  Datos Personales (LOPDP) — es decir, el taller debe tener base legal para
  recolectar y tratar esos datos (consentimiento, relación contractual de
  servicio, etc.).
- El **Proveedor** actúa como encargado del tratamiento a nivel técnico
  (almacenamiento y procesamiento en la infraestructura del Servicio) y se
  compromete a implementar medidas de seguridad razonables (aislamiento
  multi-tenant por fila, credenciales fuera de código, HTTPS).
- **Esta sección requiere validación explícita de un abogado especializado
  en protección de datos en Ecuador** antes de presentarse como cumplimiento
  formal de LOPDP en un due diligence. No se debe declarar "cumplimiento
  LOPDP" sin ese respaldo.

---

## 6. Disponibilidad del servicio (sin SLA garantizado)

- El Servicio se presta sobre infraestructura de terceros gestionada
  (Vercel para el frontend, Supabase para base de datos, autenticación y
  almacenamiento). El Proveedor no opera servidores propios.
- El Proveedor realiza esfuerzos razonables ("mejor esfuerzo") para mantener
  el Servicio disponible, pero **no garantiza un porcentaje de uptime ni
  ofrece créditos de servicio** por interrupciones, salvo que se acuerde
  expresamente un anexo de SLA para un cliente puntual (típicamente Plan
  Empresarial con despliegue dedicado).
- Interrupciones atribuibles a los proveedores de infraestructura (Vercel,
  Supabase) o a causas de fuerza mayor no generan responsabilidad del
  Proveedor.

---

## 7. Soporte técnico

Los tiempos de respuesta por plan están definidos en `docs/pricing-plans.md`.
El soporte cubre: dudas de uso, errores del sistema, y solicitudes de ajuste
de configuración (plantillas, formato de impresión). No incluye desarrollo
de funcionalidades a medida fuera de lo pactado en el Plan Empresarial.

---

## 8. Limitación de responsabilidad

- El Servicio se ofrece "tal cual" ("as-is"), sin garantía de ausencia
  total de errores, dado que es un producto en evolución activa.
- El Proveedor no será responsable por lucro cesante, pérdida de clientes,
  o daños indirectos derivados del uso o imposibilidad de uso del Servicio.
- El Proveedor no será responsable por pérdida de datos causada por uso
  indebido del Cliente (por ejemplo, borrado de información por parte de
  un usuario del propio taller) ni por fuerza mayor.
- La responsabilidad total del Proveedor frente al Cliente, en cualquier
  caso, no podrá superar el monto pagado por el Cliente en los últimos
  3 meses de servicio. *(Ajustar este tope según lo que el abogado
  recomiende — es un valor de referencia estándar en SaaS chicos, no un
  número mágico.)*

---

## 9. Modificación de precios y condiciones

- El Proveedor puede modificar precios o condiciones con **al menos 30 días
  de aviso previo** por email o WhatsApp al contacto registrado del Cliente.
- Los cambios no aplican retroactivamente al período ya facturado.
- Si el Cliente no acepta el cambio, puede cancelar sin penalidad antes de
  que entre en vigencia la modificación.

---

## 10. Vigencia, cancelación y terminación

- Contrato de vigencia mensual con renovación automática.
- El Cliente puede cancelar en cualquier momento, con efecto al fin del
  ciclo de facturación en curso (sin reembolso del período ya pagado, salvo
  acuerdo específico).
- El Proveedor puede suspender o dar de baja una cuenta por: falta de pago
  (cláusula 3), uso indebido del Servicio, o incumplimiento de estos
  Términos, con notificación previa salvo casos de riesgo de seguridad.
- Post-cancelación: ver cláusula 4 (portabilidad y retención de datos).

---

## 11. Propiedad intelectual

El código, diseño, marca "FixFlow" y la plataforma en general son propiedad
del Proveedor. El Cliente recibe una licencia de uso no exclusiva e
intransferible sobre el Servicio durante la vigencia del contrato — no
adquiere derechos sobre el software.

---

## 12. Uso aceptable

El Cliente se compromete a no: intentar vulnerar el aislamiento
multi-tenant, realizar ingeniería inversa del Servicio, usar la plataforma
para actividades ilícitas, o revender el acceso a terceros sin autorización
del Proveedor.

---

## 13. Ley aplicable y jurisdicción

Este contrato se rige por las leyes de la República del Ecuador. Cualquier
disputa se someterá a los jueces competentes del domicilio del Proveedor,
salvo acuerdo de mediación previa entre las partes. *(Confirmar domicilio
fiscal/jurisdicción exacta con el abogado al momento de formalizar.)*

---

## 14. Contacto

Canal de soporte y notificaciones formales: a definir con datos de contacto
reales del Proveedor antes de publicar la versión final de este documento.

---

## Checklist antes de usar esto con un cliente real

- [ ] Revisión por abogado ecuatoriano (mínimo: cláusulas 5 LOPDP, 8
      responsabilidad, 13 jurisdicción).
- [ ] Completar cláusula 14 con datos reales de contacto/domicilio.
- [ ] Definir si se ofrece un anexo de SLA para Plan Empresarial con
      despliegue dedicado.
- [x] Export completo de datos (cláusula 4) — implementado y verificado en
      producción: Configuración → Exportar.
