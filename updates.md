# 🔄 Actualización de Flujo de Trabajo y Multimedia - Mecánica Celular

## 1. Gestión de Evidencia Fotográfica (Módulo Equipos)
* **Sistema de Registro Visual:** Implementar tres estados de captura de imagen para cada orden:
    1. **FOTO INICIAL (Antes):** Se captura al momento de crear el registro (Nuevo Dispositivo).
    2. **FOTO PROCESO (Durante):** Editable desde la ventana de "Equipos Registrados" mientras el equipo está en reparación.
    3. **FOTO FINAL (Entrega):** Obligatoria o sugerida al momento de cambiar el estado a "Entregado".
* **Visualización:** En la tabla de "Equipos Registrados", permitir previsualizar estas fotos en un modal de galería.

## 2. Lógica de Documentos y Estados
* **Estado: NUEVO / EN REPARACIÓN:**
    - El único documento generado es el **Comprobante de Retiro (Ticket Térmico)** definido previamente. 
    - No debe permitir generar Nota de Venta en estos estados.
* **Estado: ENTREGADO (Trigger de Venta):**
    - Al cambiar el estado a "Entregado", el sistema debe:
        1. Solicitar el cobro del saldo pendiente (Costo Total - Abono).
        2. Habilitar automáticamente el botón **"Generar Nota de Venta"**.
    - **Nota:** La Nota de Venta debe jalar todos los datos del registro (Cliente, Trabajo Realizado, Costos) para evitar doble digitación.

## 3. Integración de Layouts
* **Ticket de Ingreso:** Documento de control para el cliente (basado en Foto 2).
* **Nota de Venta:** Documento final de cierre (basado en Foto 1) generado ÚNICAMENTE tras la entrega exitosa y el pago.

## 4. Validaciones Multimedia
* Las fotos deben optimizarse (redimensionar) antes de subir al servidor/storage para no saturar el sistema.
* Formatos aceptados: .jpg, .jpeg, .png.