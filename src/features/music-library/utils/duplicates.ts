import { AudioFile, DuplicateGroup } from '../types';
import { createNormalizedKey } from './metadata';

/**
 * Detecta duplicados entre archivos de audio basándose en metadatos normalizados
 */
export const findDuplicates = (files: AudioFile[]): DuplicateGroup[] => {
  // Agrupar archivos por clave normalizada
  const groupedByKey = new Map<string, AudioFile[]>();

  files.forEach((file) => {
    if (!file.metadata) return;

    const normalizedKey = createNormalizedKey(file.metadata);

    if (!groupedByKey.has(normalizedKey)) {
      groupedByKey.set(normalizedKey, []);
    }

    groupedByKey.get(normalizedKey)!.push(file);
  });

  // Filtrar solo los grupos que tienen duplicados
  const duplicateGroups: DuplicateGroup[] = [];

  groupedByKey.forEach((groupFiles, normalizedKey) => {
    // Un grupo es duplicado si tiene más de un archivo
    if (groupFiles.length > 1) {
      // Separar archivos de la raíz de archivos organizados
      const rootFiles = groupFiles.filter((f) => f.isInRoot);
      const organizedFiles = groupFiles.filter((f) => !f.isInRoot);

      // Solo consideramos duplicados si hay archivos en ambos lugares
      // (raíz y subcarpetas organizadas)
      if (rootFiles.length > 0 && organizedFiles.length > 0) {
        duplicateGroups.push({
          id: crypto.randomUUID(),
          normalizedKey,
          files: groupFiles,
          rootFiles,
          organizedFiles,
        });
      }
    }
  });

  return duplicateGroups;
};

/**
 * Calcula estadísticas de duplicados
 */
export const getDuplicateStats = (duplicateGroups: DuplicateGroup[]) => {
  const totalDuplicateFiles = duplicateGroups.reduce(
    (sum, group) => sum + group.rootFiles.length,
    0
  );

  const totalSize = duplicateGroups.reduce((sum, group) => {
    return sum + group.rootFiles.reduce((fileSum, file) => fileSum + file.size, 0);
  }, 0);

  return {
    duplicateGroups: duplicateGroups.length,
    duplicateFiles: totalDuplicateFiles,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
  };
};

/**
 * Formatea bytes a formato legible (KB, MB, GB)
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
