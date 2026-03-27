/**
 * Utilidades para el manejo de fechas uniforme en Ecuador (GMT-5)
 */

/**
 * Retorna la fecha actual en formato YYYY-MM-DD ajustada a la zona horaria de Ecuador.
 * Evita el saltar al día siguiente antes de tiempo debido a UTC.
 */
export const getLocalDate = (date = new Date()): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Retorna el mes actual en formato YYYY-MM ajustado a la zona horaria de Ecuador.
 */
export const getLocalMonth = (date = new Date()): string => {
  const localDate = getLocalDate(date);
  return localDate.substring(0, 7);
};

/**
 * Convierte una cadena de fecha de base de datos (UTC) a la fecha local (YYYY-MM-DD)
 * para comparación en filtros.
 */
export const formatToLocalDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return getLocalDate(date);
};

/**
 * Formatea una fecha/hora para mostrar en la interfaz (Ecuador).
 */
export const formatDisplayDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(dateStr));
};
