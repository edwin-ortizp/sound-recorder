import { useState, useCallback, useEffect } from 'react';
import * as api from '../api/client';
import type { ApiMusicFile } from '../api/client';
import type { MusicFile, LibraryConfig, NamingIssue, MusicMetadata } from '../types';

const DEFAULT_CONFIG: LibraryConfig = {
  lastDirectoryName: '',
  namingPattern: '{artist} - {title}.mp3',
  autoCorrect: false,
  scanSubfolders: true,
};

const CONFIG_KEY = 'music-library-config';

// Convert API response to frontend MusicFile type
const convertApiFile = (apiFile: ApiMusicFile): MusicFile => {
  return {
    id: apiFile.id,
    path: apiFile.path,
    fileName: apiFile.filename,
    fileHandle: null as any, // No longer needed with backend
    metadata: {
      artist: apiFile.metadata.artist || undefined,
      title: apiFile.metadata.title || undefined,
      album: apiFile.metadata.album || undefined,
      year: apiFile.metadata.year ? parseInt(apiFile.metadata.year) : undefined,
      genre: apiFile.metadata.genre || undefined,
      duration: apiFile.metadata.duration || undefined,
      albumArtist: apiFile.metadata.albumartist || undefined,
    } as MusicMetadata,
    issues: apiFile.issues as NamingIssue[],
    suggestedName: apiFile.suggested_name || undefined,
    size: apiFile.size,
  };
};

export const useMusicLibrary = () => {
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [config, setConfig] = useState<LibraryConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      const healthy = await api.checkHealth();
      setApiHealthy(healthy);
      if (!healthy) {
        setError('Backend API is not available. Please make sure the Python server is running on http://localhost:8000');
      }
    };
    checkApi();
  }, []);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
        if (parsed.lastDirectoryName) {
          setDirectoryPath(parsed.lastDirectoryName);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: Partial<LibraryConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updatedConfig));
  }, [config]);

  // Set directory path (called from UI input)
  const setDirectory = useCallback((path: string) => {
    setDirectoryPath(path);
    saveConfig({ lastDirectoryName: path });
  }, [saveConfig]);

  // Scan directory for MP3 files
  const scanLibrary = useCallback(async () => {
    if (!directoryPath) {
      setError('Please enter a directory path');
      return;
    }

    setScanning(true);
    setFiles([]);
    setError(null);
    setScanProgress({ current: 0, total: 0 });

    try {
      // Call backend API to scan directory
      const response = await api.scanDirectory(directoryPath, config.scanSubfolders);

      // Convert API files to frontend format
      const musicFiles = response.files.map(convertApiFile);

      setFiles(musicFiles);
      setScanProgress({ current: response.total, total: response.total });

      console.log(`Scanned ${response.total} files`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to scan directory';
      setError(errorMsg);
      console.error('Error scanning library:', err);
    } finally {
      setScanning(false);
    }
  }, [directoryPath, config.scanSubfolders]);

  // Update a file's metadata (writes to backend)
  const updateFileMetadata = useCallback(async (
    fileId: string,
    newMetadata: Partial<MusicFile['metadata']>
  ) => {
    setError(null);

    // Find the file
    const file = files.find(f => f.id === fileId);
    if (!file) {
      setError('File not found');
      return;
    }

    try {
      // Call backend API to update metadata
      const response = await api.updateMetadata(file.path, {
        artist: newMetadata.artist,
        title: newMetadata.title,
        album: newMetadata.album,
        year: newMetadata.year?.toString(),
        genre: newMetadata.genre,
        albumartist: newMetadata.albumArtist,
      });

      if (response.success) {
        // Update local state
        setFiles(prevFiles =>
          prevFiles.map(f => {
            if (f.id === fileId) {
              const updatedMetadata = {
                ...f.metadata,
                ...newMetadata,
              };

              return {
                ...f,
                metadata: updatedMetadata,
                // Note: issues and suggestedName would need to be recalculated
                // or fetched from backend
              };
            }
            return f;
          })
        );

        console.log('Metadata updated successfully');
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update metadata';
      setError(errorMsg);
      console.error('Error updating metadata:', err);
    }
  }, [files]);

  // Rename a file (writes to backend)
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    setError(null);

    const file = files.find(f => f.id === fileId);
    if (!file) {
      setError('File not found');
      return;
    }

    try {
      const response = await api.renameFile(file.path, newName);

      if (response.success) {
        // Update local state with new path
        setFiles(prevFiles =>
          prevFiles.map(f => {
            if (f.id === fileId) {
              return {
                ...f,
                path: response.new_path,
                fileName: newName,
              };
            }
            return f;
          })
        );

        console.log('File renamed successfully');
        return true;
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMsg);
      console.error('Error renaming file:', err);
      return false;
    }
  }, [files]);

  // Clear library
  const clearLibrary = useCallback(() => {
    setFiles([]);
    setScanProgress({ current: 0, total: 0 });
    setError(null);
  }, []);

  return {
    isSupported: apiHealthy, // Using API health instead of browser support
    directoryPath,
    directoryHandle: directoryPath ? ({ name: directoryPath } as any) : null, // Mock for compatibility
    files,
    scanning,
    scanProgress,
    config,
    error,
    apiHealthy,
    setDirectory,
    openDirectory: () => Promise.resolve(false), // Not used with backend
    scanLibrary,
    updateFileMetadata,
    renameFile,
    clearLibrary,
    saveConfig,
  };
};
