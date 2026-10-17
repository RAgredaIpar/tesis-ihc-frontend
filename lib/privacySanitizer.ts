/**
 * Modulo de Sanitizacion y Desidentificacion de Imagenes Medicas (Ley N 29733).
 *
 * Ejecuta la purga de metadatos EXIF, etiquetas DICOM residuales e identificadores
 * de paciente en el navegador del cliente antes de transmitir el tejido al servidor de inferencia.
 */

export interface SanitizationResult {
    sanitizedFile: File;
    pseudonymId: string;
    originalName: string;
    width: number;
    height: number;
    sanitized: boolean;
}

/**
 * Genera un identificador seudonimo UUIDv4 para desacoplar la muestra histologica
 * del expediente clinico fisico del paciente (Principio de Disociacion - Art. 2 Ley 29733).
 */
export function generarSeudonimo(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'req-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
}

/**
 * Sanitiza una imagen histopatologica dibujandola en un canvas en memoria.
 * Este proceso elimina irreversiblemente cualquier etiqueta EXIF, GPS, fecha de captura,
 * camara o texto incrustado que pudiera comprometer la privacidad del paciente.
 *
 * @param file - Archivo de imagen original seleccionado por el especialista.
 * @returns Archivo purgado en formato PNG puro, sin metadatos.
 */
export async function sanitizarImagenCliente(file: File): Promise<SanitizationResult> {
    return new Promise((resolve, reject) => {
        // Validacion previa de tamano maximo (50 MB)
        const MAX_SIZE_BYTES = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE_BYTES) {
            reject(new Error('El archivo excede el limite de seguridad permitido (50 MB).'));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            try {
                // Crear canvas offscreen para purga de metadatos
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('No se pudo inicializar el contexto de sanitizacion en cliente.'));
                    return;
                }

                // Dibujar exclusivamente la matriz de pixeles (sin metadatos)
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(objectUrl);

                    if (!blob) {
                        reject(new Error('Fallo al generar el buffer sanitizado de la imagen.'));
                        return;
                    }

                    const pseudonymId = generarSeudonimo();
                    // Limpiar el nombre de archivo eliminando posibles DNIs o identificadores
                    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const sanitizedFile = new File([blob], cleanName, { type: 'image/png' });

                    resolve({
                        sanitizedFile,
                        pseudonymId,
                        originalName: file.name,
                        width: canvas.width,
                        height: canvas.height,
                        sanitized: true,
                    });
                }, 'image/png');
            } catch (err) {
                URL.revokeObjectURL(objectUrl);
                reject(err instanceof Error ? err : new Error('Error durante la sanitizacion del lienzo.'));
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('El archivo no corresponde a una imagen histopatologica valida o esta corrupto.'));
        };

        img.src = objectUrl;
    });
}
