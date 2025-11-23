export interface MusicMetadata {
  artist?: string;
  title?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration?: number;
  trackNumber?: number;
  albumArtist?: string;
}

export interface NamingIssue {
  type: 'no_standard' | 'missing_metadata' | 'invalid_chars' | 'duplicate' | 'no_artist' | 'no_title';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface MusicFile {
  id: string;
  path: string;
  fileName: string;
  fileHandle: FileSystemFileHandle;
  metadata: MusicMetadata;
  issues: NamingIssue[];
  suggestedName?: string;
  size?: number;
}

export interface LibraryConfig {
  lastDirectoryName: string;
  namingPattern: string;
  autoCorrect: boolean;
  scanSubfolders: boolean;
}

export interface LibraryStats {
  totalFiles: number;
  filesWithIssues: number;
  filesWithoutMetadata: number;
  duplicates: number;
}
