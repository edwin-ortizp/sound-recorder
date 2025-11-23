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

export interface DuplicateFile {
  path: string;
  filename: string;
  metadata: MusicMetadata;
}

export interface DuplicateMatch {
  root_file: DuplicateFile;
  organized_matches: DuplicateFile[];
  fingerprint: string;
}

export interface DuplicateDetectionResult {
  duplicates: DuplicateMatch[];
  total_duplicates: number;
  root_files_count: number;
  organized_files_count: number;
  files_without_metadata: DuplicateFile[];
  files_without_metadata_count: number;
}

export interface DuplicateCleanupReport {
  timestamp: string;
  root_directory: string;
  trash_folder: string;
  total_moved: number;
  total_failed: number;
  moved_files: Array<{
    original_path: string;
    trash_path: string;
    filename: string;
    metadata: MusicMetadata;
    matched_with: string[];
  }>;
  failed_files: Array<{
    path: string;
    filename: string;
    error: string;
  }>;
}
