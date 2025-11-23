import { useState, useCallback } from 'react';
import { AudioFile, DuplicateGroup, MoveOperation, ScanProgress } from '../types';
import { extractMetadata, isSupportedAudioFile } from '../utils/metadata';
import { findDuplicates, getDuplicateStats } from '../utils/duplicates';
import { generateReport, downloadReport } from '../utils/report';

export const useMusicLibrary = () => {
  const [rootDirHandle, setRootDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle',
    filesScanned: 0,
    duplicatesFound: 0,
  });
  const [moveOperations, setMoveOperations] = useState<MoveOperation[]>([]);

  /**
   * Abre el selector de carpetas y guarda el handle
   */
  const selectDirectory = async (): Promise<void> => {
    try {
      // @ts-ignore - File System Access API puede no estar en todos los tipos
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite', // Necesitamos permisos de escritura para mover archivos
      });

      setRootDirHandle(dirHandle);
      return dirHandle;
    } catch (error) {
      console.error('Error seleccionando directorio:', error);
      throw error;
    }
  };

  /**
   * Escanea recursivamente un directorio y sus subdirectorios
   */
  const scanDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    basePath: string = '',
    isRoot: boolean = true
  ): Promise<AudioFile[]> => {
    const files: AudioFile[] = [];

    try {
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

        setScanProgress((prev) => ({
          ...prev,
          currentPath,
        }));

        if (entry.kind === 'file') {
          // Verificar si es un archivo de audio soportado
          if (isSupportedAudioFile(entry.name)) {
            try {
              const fileHandle = entry as FileSystemFileHandle;
              const file = await fileHandle.getFile();

              // Extraer metadatos
              const metadata = await extractMetadata(file);

              const audioFile: AudioFile = {
                id: crypto.randomUUID(),
                name: entry.name,
                path: currentPath,
                relativePath: currentPath,
                size: file.size,
                handle: fileHandle,
                metadata,
                isInRoot: isRoot,
              };

              files.push(audioFile);

              setScanProgress((prev) => ({
                ...prev,
                filesScanned: prev.filesScanned + 1,
              }));
            } catch (error) {
              console.error(`Error procesando archivo ${currentPath}:`, error);
            }
          }
        } else if (entry.kind === 'directory') {
          // Escanear subdirectorio recursivamente (ya no está en la raíz)
          const subDirHandle = entry as FileSystemDirectoryHandle;
          const subFiles = await scanDirectory(subDirHandle, currentPath, false);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Error escaneando directorio ${basePath}:`, error);
      throw error;
    }

    return files;
  };

  /**
   * Inicia el escaneo completo de la biblioteca
   */
  const startScan = async (): Promise<void> => {
    if (!rootDirHandle) {
      throw new Error('No se ha seleccionado ningún directorio');
    }

    setScanProgress({
      status: 'scanning',
      filesScanned: 0,
      duplicatesFound: 0,
    });

    try {
      // Escanear todos los archivos
      const files = await scanDirectory(rootDirHandle, '', true);
      setAudioFiles(files);

      // Analizar duplicados
      setScanProgress((prev) => ({ ...prev, status: 'analyzing' }));
      const duplicates = findDuplicates(files);
      setDuplicateGroups(duplicates);

      setScanProgress({
        status: 'completed',
        filesScanned: files.length,
        duplicatesFound: duplicates.length,
      });
    } catch (error) {
      console.error('Error durante el escaneo:', error);
      setScanProgress({
        status: 'error',
        filesScanned: 0,
        duplicatesFound: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Mueve archivos duplicados a la carpeta Trash
   */
  const moveDuplicatesToTrash = async (
    duplicateGroupIds: string[]
  ): Promise<MoveOperation[]> => {
    if (!rootDirHandle) {
      throw new Error('No se ha seleccionado ningún directorio');
    }

    const operations: MoveOperation[] = [];

    try {
      // Crear o obtener la carpeta Trash
      // @ts-ignore
      const trashHandle = await rootDirHandle.getDirectoryHandle('Trash', {
        create: true,
      });

      // Procesar cada grupo de duplicados seleccionado
      for (const groupId of duplicateGroupIds) {
        const group = duplicateGroups.find((g) => g.id === groupId);
        if (!group) continue;

        // Mover solo los archivos de la raíz
        for (const rootFile of group.rootFiles) {
          try {
            // Obtener el archivo original
            const file = await rootFile.handle.getFile();

            // Crear el archivo en Trash
            // @ts-ignore
            const newFileHandle = await trashHandle.getFileHandle(rootFile.name, {
              create: true,
            });

            // @ts-ignore
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            // Intentar eliminar el archivo original
            // Nota: La File System Access API no soporta eliminar archivos directamente
            // El usuario tendrá que eliminarlos manualmente o usaremos un enfoque diferente

            operations.push({
              sourceFile: rootFile,
              duplicateOf: group.organizedFiles[0], // Referencia al archivo organizado
              timestamp: new Date(),
              success: true,
            });
          } catch (error) {
            operations.push({
              sourceFile: rootFile,
              duplicateOf: group.organizedFiles[0],
              timestamp: new Date(),
              success: false,
              error: error instanceof Error ? error.message : 'Error desconocido',
            });
          }
        }
      }

      setMoveOperations(operations);
      return operations;
    } catch (error) {
      console.error('Error moviendo archivos:', error);
      throw error;
    }
  };

  /**
   * Genera y descarga el reporte de operaciones
   */
  const generateAndDownloadReport = (): void => {
    const report = generateReport(moveOperations);
    downloadReport(report);
  };

  /**
   * Reinicia el estado
   */
  const reset = (): void => {
    setRootDirHandle(null);
    setAudioFiles([]);
    setDuplicateGroups([]);
    setScanProgress({
      status: 'idle',
      filesScanned: 0,
      duplicatesFound: 0,
    });
    setMoveOperations([]);
  };

  // Calcular estadísticas
  const stats = getDuplicateStats(duplicateGroups);

  return {
    // Estado
    rootDirHandle,
    audioFiles,
    duplicateGroups,
    scanProgress,
    moveOperations,
    stats,

    // Acciones
    selectDirectory,
    startScan,
    moveDuplicatesToTrash,
    generateAndDownloadReport,
    reset,
  };
};
