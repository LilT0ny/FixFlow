# 🔄 Actualización: Venta Directa y Adaptabilidad de Impresión

## 1. Generación de Nota de Venta Manual (Venta Directa)
* **Nueva Funcionalidad:** Permitir crear una Nota de Venta sin necesidad de que exista un dispositivo previo en estado "Entregado".
* **Flujo:** - Añadir un botón `[ + Nueva Nota de Venta ]` en el módulo de caja o facturación.
    - Permitir agregar ítems manualmente (Descripción, Cantidad, Precio Unitario).
    - Opción de seleccionar un cliente existente o usar "Consumidor Final".
* **Consistencia:** Las ventas manuales deben impactar el cuadre de caja de la misma forma que las liquidaciones de reparaciones.

## 2. Optimización de Formatos de Impresión (Responsividad de Papel)
Implementar hojas de estilo (CSS `@media print`) específicas para cada ancho:

### A. Formato 58mm (Ticket Estrecho)
* **Ajustes:** Reducir márgenes al mínimo (0mm). Tamaño de fuente: 8pt - 9pt.
* **Layout:** Logo centrado pequeño, texto de términos y condiciones en bloque denso sin sangrías para ahorrar papel. Columnas de la tabla: Cant | Descripción | Total (combinar P.Unit y Desc si es necesario).

### B. Formato 80mm (Ticket Estándar)
* **Ajustes:** Tamaño de fuente: 10pt.
* **Layout:** Columnas completas: Cant | Detalle | P.Unit | Total. Espaciado claro entre secciones y código de barras/QR legible al final.

### C. Formato A4 (Documento Legal)
* **Ajustes:** Layout profesional con bordes y sombreados ligeros.
* **Layout:** Logo en la esquina superior izquierda. Espacio amplio para descripción técnica. 
* **Firmas:** Incluir obligatoriamente campos de firma para "Entregué Conforme" y "Recibí Conforme" en la base de la página.

## 3. Selector de Impresión Pre-Render
* Antes de enviar a la impresora, el sistema debe mostrar un **Preview** (Vista previa) que cambie dinámicamente según el formato (58mm, 80mm, A4) seleccionado por el usuario en el modal de confirmación. 