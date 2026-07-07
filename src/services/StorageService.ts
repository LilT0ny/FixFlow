// src/services/StorageService.ts
import { supabase } from '../lib/supabase';
import { AuthService } from './SaaSAuthService';

const STORAGE_BUCKET = 'evidencias';

/**
 * Convención de path: {tenant_id}/{archivo} — las policies de storage
 * solo permiten subir/borrar dentro de la carpeta del propio taller.
 */
function tenantFolder(): string {
  const tenantId = AuthService.getCurrentTenantId();
  if (!tenantId) throw new Error('Sesión sin taller activo: no se puede subir archivos');
  return tenantId;
}

/**
 * Sube una imagen a Supabase Storage y devuelve la URL pública
 */
export const uploadPhoto = async (file: File, orderId?: string, stage?: string): Promise<string> => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${tenantFolder()}/${orderId || 'temp'}_${stage || 'general'}_${timestamp}_${randomId}.${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw new Error(`Error al subir la foto: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  if (!urlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL de la foto');
  }

  return urlData.publicUrl;
};

/**
 * Sube múltiples fotos a Supabase Storage
 */
export const uploadPhotos = async (files: File[], orderId?: string): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const url = await uploadPhoto(file, orderId);
    urls.push(url);
  }

  return urls;
};

/**
 * Elimina una foto de Supabase Storage usando su URL.
 * El path dentro del bucket incluye la carpeta del tenant.
 */
export const deletePhoto = async (photoUrl: string): Promise<void> => {
  const marker = `/${STORAGE_BUCKET}/`;
  const idx = photoUrl.indexOf(marker);
  const filePath = idx >= 0 ? photoUrl.slice(idx + marker.length) : '';

  if (!filePath) {
    console.warn('Could not extract file path from URL:', photoUrl);
    return;
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting from Supabase Storage:', error);
    throw new Error(`Error al eliminar la foto: ${error.message}`);
  }
};

/**
 * Elimina múltiples fotos de Supabase Storage
 */
export const deletePhotos = async (photoUrls: string[]): Promise<void> => {
  for (const url of photoUrls) {
    await deletePhoto(url);
  }
};

/**
 * Verifica si el bucket de almacenamiento existe y está accesible
 */
export const checkStorageBucket = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(tenantFolder(), { limit: 1 });

    if (error) {
      console.warn('Storage bucket not accessible:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Storage bucket check failed:', error);
    return false;
  }
};

/**
 * Descarga una foto desde URL y la convierte a File
 * Útil para re-subir fotos existentes
 */
export const urlToFile = async (url: string, fileName: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
};
