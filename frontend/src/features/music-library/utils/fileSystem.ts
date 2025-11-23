/**
 * Utilities for File System Access API
 */

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export const pickDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
    return dirHandle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled, not an error
      return null;
    }
    throw error;
  }
};

export const scanDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  recursive: boolean = true,
  onProgress?: (current: number, total: number) => void
): Promise<FileSystemFileHandle[]> => {
  const mp3Files: FileSystemFileHandle[] = [];
  let processedCount = 0;

  const scan = async (directory: FileSystemDirectoryHandle) => {
    for await (const entry of directory.values()) {
      if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.mp3')) {
        mp3Files.push(entry);
        processedCount++;
        onProgress?.(processedCount, processedCount);
      } else if (entry.kind === 'directory' && recursive) {
        await scan(entry);
      }
    }
  };

  await scan(dirHandle);
  return mp3Files;
};

export const getFilePath = async (
  fileHandle: FileSystemFileHandle,
  rootHandle: FileSystemDirectoryHandle
): Promise<string> => {
  // This is a simplified path - in reality we'd need to traverse up
  // For now, we'll just use the file name
  return fileHandle.name;
};

export const renameFile = async (
  fileHandle: FileSystemFileHandle,
  newName: string
): Promise<boolean> => {
  try {
    // Note: File System Access API doesn't have direct rename
    // We need to create a new file and delete the old one
    // This is a placeholder - actual implementation would need parent directory handle
    console.warn('Rename not fully implemented yet. Would rename to:', newName);
    return false;
  } catch (error) {
    console.error('Error renaming file:', error);
    return false;
  }
};
