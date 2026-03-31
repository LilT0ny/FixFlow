// src/services/StorageService.ts
import { supabase } from '../lib/supabase';

const STORAGE_BUCKET = 'evidence-photos';

/**
 * Sube una imagen a Supabase Storage y devuelve la URL pública
 */
export const uploadPhoto = async (file: File, orderId?: string, stage?: string): Promise<string> => {
  try {
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${orderId || 'temp'}_${stage || 'general'}_${timestamp}_${randomId}.${extension}`;
    
    // Subir el archivo
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

    // Obtener la URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('No se pudo obtener la URL de la foto');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadPhoto:', error);
    throw error;
  }
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
 * Elimina una foto de Supabase Storage usando su URL
 */
export const deletePhoto = async (photoUrl: string): Promise<void> => {
  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName) {
      console.warn('Could not extract filename from URL:', photoUrl);
      return;
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting from Supabase Storage:', error);
      throw new Error(`Error al eliminar la foto: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deletePhoto:', error);
    throw error;
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
      .list('', { limit: 1 });

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