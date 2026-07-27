import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Sube un archivo a qu.ax
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {Promise<string>} - URL del archivo subido
 */
export default async (buffer) => {
  try {
    // 1. Detectar tipo de archivo
    const fileInfo = await fileTypeFromBuffer(buffer);
    const ext = fileInfo?.ext || 'bin';
    const mime = fileInfo?.mime || 'application/octet-stream';

    // 2. Crear el formulario
    const form = new FormData();
    
    /**
     * Ajuste: En formdata-node, puedes pasar el Buffer directamente 
     * o convertirlo a Blob de forma más limpia.
     */
    const blob = new Blob([buffer], { type: mime });
    
    // El campo debe ser 'files[]' según tu implementación original
    form.append('files[]', blob, `file.${ext}`);

    // 3. Realizar la petición
    const response = await fetch('https://qu.ax/upload.php', {
      method: 'POST',
      body: form,
      headers: {
        // A veces es necesario un User-Agent para evitar bloqueos
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    // 4. Validar respuesta del servidor
    if (result && result.success && result.files && result.files.length > 0) {
      return result.files[0].url;
    } else {
      throw new Error(result.error || 'Error desconocido en la respuesta del servidor');
    }

  } catch (error) {
    console.error('Error en quAxUpload:', error.message);
    throw new Error(`Failed to upload to qu.ax: ${error.message}`);
  }
};
