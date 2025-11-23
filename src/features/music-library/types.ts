export interface AudioFileMetadata {
  artist: string;
  title: string;
  album?: string;
  year?: string;
  duration?: number;
}

export interface AudioFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  size: number;
  handle: FileSystemFileHandle;
  metadata: AudioFileMetadata | null;
  isInRoot: boolean; // true si está en la carpeta raíz, false si está en subcarpetas
}

export interface DuplicateGroup {
  id: string;
  normalizedKey: string; // clave normalizada para comparación
  files: AudioFile[];
  rootFiles: AudioFile[]; // archivos en la raíz (candidatos a mover)
  organizedFiles: AudioFile[]; // archivos en subcarpetas (no tocar)
}

export interface MoveOperation {
  sourceFile: AudioFile;
  duplicateOf: AudioFile;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ScanProgress {
  status: 'idle' | 'scanning' | 'analyzing' | 'completed' | 'error';
  filesScanned: number;
  duplicatesFound: number;
  currentPath?: string;
  error?: string;
}
