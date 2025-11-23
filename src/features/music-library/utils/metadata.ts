import jsmediatags from 'jsmediatags';
import { AudioFileMetadata } from '../types';

/**
 * Extrae metadatos de un archivo de audio usando jsmediatags
 */
export const extractMetadata = async (file: File): Promise<AudioFileMetadata | null> => {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const tags = tag.tags;

        // Extraer artista y título
        const artist = tags.artist || tags.TPE1 || '';
        const title = tags.title || tags.TIT2 || '';

        // Si no hay artista o título en los metadatos, intentar extraer del nombre del archivo
        if (!artist && !title) {
          const metadata = extractFromFilename(file.name);
          resolve(metadata);
          return;
        }

        resolve({
          artist: artist || 'Unknown Artist',
          title: title || file.name.replace(/\.(mp3|wav|m4a|flac|ogg|webm)$/i, ''),
          album: tags.album || tags.TALB,
          year: tags.year || tags.TYER,
        });
      },
      onError: (error) => {
        console.warn('Error leyendo metadatos:', error);
        // Si falla la lectura de metadatos, intentar extraer del nombre del archivo
        const metadata = extractFromFilename(file.name);
        resolve(metadata);
      },
    });
  });
};

/**
 * Intenta extraer artista y título del nombre del archivo
 * Formatos comunes: "Artista - Título.mp3", "Artista-Título.mp3", etc.
 */
const extractFromFilename = (filename: string): AudioFileMetadata | null => {
  // Remover extensión
  const nameWithoutExt = filename.replace(/\.(mp3|wav|m4a|flac|ogg|webm)$/i, '');

  // Intentar separar por " - " o "-"
  const separators = [' - ', ' – ', '–', '-'];

  for (const separator of separators) {
    if (nameWithoutExt.includes(separator)) {
      const parts = nameWithoutExt.split(separator);
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(separator).trim(),
        };
      }
    }
  }

  // Si no se puede separar, usar el nombre completo como título
  return {
    artist: 'Unknown Artist',
    title: nameWithoutExt,
  };
};

/**
 * Normaliza un string para comparación (ignora mayúsculas, espacios, guiones, caracteres especiales)
 */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/[^a-z0-9]/g, '') // Eliminar todo excepto letras y números
    .trim();
};

/**
 * Crea una clave única normalizada para un archivo basada en artista y título
 */
export const createNormalizedKey = (metadata: AudioFileMetadata): string => {
  const artist = normalizeString(metadata.artist);
  const title = normalizeString(metadata.title);
  return `${artist}::${title}`;
};

/**
 * Verifica si un archivo es un archivo de audio soportado
 */
export const isSupportedAudioFile = (filename: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm', '.aac'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return audioExtensions.includes(ext);
};
