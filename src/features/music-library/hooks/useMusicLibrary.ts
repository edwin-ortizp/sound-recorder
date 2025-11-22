import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  isFileSystemAccessSupported,
  pickDirectory,
  scanDirectory,
} from '../utils/fileSystem';
import { useMp3Metadata } from './useMp3Metadata';
import { analyzeFileName, getSuggestedName } from '../utils/namingStandard';
import type { MusicFile, LibraryConfig } from '../types';

const DEFAULT_CONFIG: LibraryConfig = {
  lastDirectoryName: '',
  namingPattern: '{artist} - {title}.mp3',
  autoCorrect: false,
  scanSubfolders: true,
};

const CONFIG_KEY = 'music-library-config';

export const useMusicLibrary = () => {
  const [isSupported] = useState(isFileSystemAccessSupported());
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [config, setConfig] = useState<LibraryConfig>(DEFAULT_CONFIG);
  const { extractMetadata } = useMp3Metadata();

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
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

  // Open directory picker
  const openDirectory = useCallback(async () => {
    try {
      const handle = await pickDirectory();
      if (handle) {
        setDirectoryHandle(handle);
        saveConfig({ lastDirectoryName: handle.name });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening directory:', error);
      return false;
    }
  }, [saveConfig]);

  // Scan directory for MP3 files
  const scanLibrary = useCallback(async () => {
    if (!directoryHandle) {
      console.error('No directory selected');
      return;
    }

    setScanning(true);
    setFiles([]);
    setScanProgress({ current: 0, total: 0 });

    try {
      // Scan for MP3 files
      const fileHandles = await scanDirectory(
        directoryHandle,
        config.scanSubfolders,
        (current, total) => setScanProgress({ current, total })
      );

      console.log(`Found ${fileHandles.length} MP3 files`);

      // Process each file
      const musicFiles: MusicFile[] = [];

      for (let i = 0; i < fileHandles.length; i++) {
        const fileHandle = fileHandles[i];
        setScanProgress({ current: i + 1, total: fileHandles.length });

        try {
          // Extract metadata
          const metadata = await extractMetadata(fileHandle);

          // Analyze filename
          const issues = analyzeFileName(fileHandle.name, metadata);
          const suggestedName = getSuggestedName(fileHandle.name, metadata);

          // Get file size
          const file = await fileHandle.getFile();

          const musicFile: MusicFile = {
            id: uuidv4(),
            path: fileHandle.name, // Simplified - would need full path
            fileName: fileHandle.name,
            fileHandle,
            metadata,
            issues,
            suggestedName,
            size: file.size,
          };

          musicFiles.push(musicFile);
        } catch (error) {
          console.error(`Error processing file ${fileHandle.name}:`, error);
        }
      }

      setFiles(musicFiles);
      console.log(`Processed ${musicFiles.length} files`);
    } catch (error) {
      console.error('Error scanning library:', error);
    } finally {
      setScanning(false);
    }
  }, [directoryHandle, config.scanSubfolders, extractMetadata]);

  // Update a file's metadata
  const updateFileMetadata = useCallback((fileId: string, newMetadata: Partial<MusicFile['metadata']>) => {
    setFiles(prevFiles =>
      prevFiles.map(file => {
        if (file.id === fileId) {
          const updatedMetadata = { ...file.metadata, ...newMetadata };
          const issues = analyzeFileName(file.fileName, updatedMetadata);
          const suggestedName = getSuggestedName(file.fileName, updatedMetadata);

          return {
            ...file,
            metadata: updatedMetadata,
            issues,
            suggestedName,
          };
        }
        return file;
      })
    );
  }, []);

  // Clear library
  const clearLibrary = useCallback(() => {
    setFiles([]);
    setDirectoryHandle(null);
    setScanProgress({ current: 0, total: 0 });
  }, []);

  return {
    isSupported,
    directoryHandle,
    files,
    scanning,
    scanProgress,
    config,
    openDirectory,
    scanLibrary,
    updateFileMetadata,
    clearLibrary,
    saveConfig,
  };
};
