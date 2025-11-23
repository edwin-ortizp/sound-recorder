import { useState, useCallback } from 'react';
import { parseMP3Metadata } from '../utils/mp3Parser';
import type { MusicMetadata } from '../types';

export const useMp3Metadata = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMetadata = useCallback(async (
    fileHandle: FileSystemFileHandle
  ): Promise<MusicMetadata> => {
    setLoading(true);
    setError(null);

    try {
      const file = await fileHandle.getFile();
      const metadata = await parseMP3Metadata(file);
      return metadata;
    } catch (err) {
      const errorMsg = `Error al leer metadatos: ${(err as Error).message}`;
      setError(errorMsg);
      console.error(errorMsg, err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const extractBatchMetadata = useCallback(async (
    fileHandles: FileSystemFileHandle[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, MusicMetadata>> => {
    setLoading(true);
    setError(null);

    const metadataMap = new Map<string, MusicMetadata>();

    try {
      for (let i = 0; i < fileHandles.length; i++) {
        const fileHandle = fileHandles[i];
        const metadata = await extractMetadata(fileHandle);
        metadataMap.set(fileHandle.name, metadata);
        onProgress?.(i + 1, fileHandles.length);
      }
    } catch (err) {
      const errorMsg = `Error al procesar archivos: ${(err as Error).message}`;
      setError(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setLoading(false);
    }

    return metadataMap;
  }, [extractMetadata]);

  return {
    loading,
    error,
    extractMetadata,
    extractBatchMetadata,
  };
};
