/**
 * API Client for Music Library Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiMusicFile {
  id: string;
  path: string;
  filename: string;
  directory: string;
  size: number;
  metadata: {
    artist?: string | null;
    title?: string | null;
    album?: string | null;
    year?: string | null;
    genre?: string | null;
    albumartist?: string | null;
    duration?: number | null;
  };
  issues: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  suggested_name?: string | null;
}

export interface ScanResponse {
  files: ApiMusicFile[];
  total: number;
  scanned: number;  // Number of files scanned in this batch
  offset: number;   // Current offset
  has_more: boolean; // Whether there are more files to scan
}

export interface LibraryStats {
  total_files: number;
  files_with_issues: number;
  files_without_metadata: number;
}

/**
 * Scan a directory for MP3 files (with pagination support)
 *
 * For large libraries (20k+ files):
 * 1. Use quick=true to only get file list without metadata (very fast)
 * 2. Then use pagination (offset/limit) to load metadata in batches
 */
export const scanDirectory = async (
  path: string,
  recursive: boolean = true,
  quick: boolean = false,
  offset: number = 0,
  limit: number = 100
): Promise<ScanResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      recursive,
      quick,
      offset,
      limit
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to scan directory');
  }

  return response.json();
};

/**
 * Get detailed information about a file
 */
export const getFileInfo = async (filepath: string) => {
  const response = await fetch(`${API_BASE_URL}/api/file/${encodeURIComponent(filepath)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get file info');
  }

  return response.json();
};

/**
 * Update metadata for a file
 */
export const updateMetadata = async (
  filepath: string,
  metadata: {
    artist?: string;
    title?: string;
    album?: string;
    year?: string;
    genre?: string;
    albumartist?: string;
  }
): Promise<{ success: boolean; metadata: any }> => {
  const response = await fetch(`${API_BASE_URL}/api/metadata/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filepath,
      ...metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update metadata');
  }

  return response.json();
};

/**
 * Rename a file
 */
export const renameFile = async (
  oldPath: string,
  newName: string
): Promise<{ success: boolean; old_path: string; new_path: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/file/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      old_path: oldPath,
      new_name: newName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to rename file');
  }

  return response.json();
};

/**
 * Get library statistics
 */
export const getLibraryStats = async (
  path: string,
  recursive: boolean = true
): Promise<LibraryStats> => {
  const response = await fetch(`${API_BASE_URL}/api/stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, recursive }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get stats');
  }

  return response.json();
};

/**
 * Check if API is healthy
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// ============================================================================
// Artwork & Lyrics API
// ============================================================================

/**
 * Search for album artwork
 */
export const searchArtwork = async (
  filepath: string,
  artist: string,
  album: string,
  lastfmApiKey?: string
): Promise<{ success: boolean; artwork_url?: string; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/artwork/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filepath,
      artist,
      album,
      lastfm_api_key: lastfmApiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to search artwork');
  }

  return response.json();
};

/**
 * Embed artwork into file
 */
export const embedArtwork = async (
  filepath: string,
  artist: string,
  album: string,
  lastfmApiKey?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/artwork/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filepath,
      artist,
      album,
      lastfm_api_key: lastfmApiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to embed artwork');
  }

  return response.json();
};

/**
 * Extract artwork from file
 */
export const extractArtwork = async (filepath: string): Promise<Blob> => {
  const response = await fetch(
    `${API_BASE_URL}/api/artwork/extract/${encodeURIComponent(filepath)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to extract artwork');
  }

  return response.blob();
};

/**
 * Search for lyrics
 */
export const searchLyrics = async (
  filepath: string,
  artist: string,
  title: string,
  geniusApiKey?: string
): Promise<{ success: boolean; lyrics?: string; message?: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/lyrics/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filepath,
      artist,
      title,
      genius_api_key: geniusApiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to search lyrics');
  }

  return response.json();
};

/**
 * Embed lyrics into file
 */
export const embedLyrics = async (
  filepath: string,
  artist: string,
  title: string,
  geniusApiKey?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/lyrics/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filepath,
      artist,
      title,
      genius_api_key: geniusApiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to embed lyrics');
  }

  return response.json();
};

// ============================================================================
// Batch Operations API
// ============================================================================

/**
 * Batch rename files
 */
export const batchRename = async (
  files: string[],
  useSuggestions: boolean = true,
  createBackup: boolean = true
): Promise<{
  success: any[];
  failed: any[];
  backup_id?: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/batch/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      use_suggestions: useSuggestions,
      create_backup: createBackup,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch rename');
  }

  return response.json();
};

/**
 * Batch update metadata
 */
export const batchUpdateMetadata = async (
  files: string[],
  metadata: Record<string, string>,
  createBackup: boolean = true
): Promise<{
  success: any[];
  failed: any[];
  backup_id?: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/batch/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      metadata,
      create_backup: createBackup,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch update metadata');
  }

  return response.json();
};

/**
 * Batch auto-fix files
 */
export const batchAutoFix = async (
  files: string[],
  fixNames: boolean = true,
  fillMetadata: boolean = true,
  createBackup: boolean = true
): Promise<{
  renamed: any[];
  metadata_updated: any[];
  failed: any[];
  backup_id?: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/batch/autofix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      fix_names: fixNames,
      fill_metadata: fillMetadata,
      create_backup: createBackup,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to batch auto-fix');
  }

  return response.json();
};

/**
 * Get backup history
 */
export const getBackupHistory = async (): Promise<{ history: any[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/batch/history`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get backup history');
  }

  return response.json();
};

/**
 * Restore from backup
 */
export const restoreBackup = async (
  backupId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/batch/restore/${backupId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to restore backup');
  }

  return response.json();
};

// ============================================================================
// Export & Statistics API
// ============================================================================

/**
 * Export library to various formats
 */
export const exportLibrary = async (
  files: any[],
  format: 'txt' | 'csv' | 'json' | 'issues',
  includeIssues: boolean = true
): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      format,
      include_issues: includeIssues,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export library');
  }

  return response.blob();
};

/**
 * Get library statistics
 */
export const getStatistics = async (files: any[]): Promise<{
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  files_with_issues: number;
  files_without_issues: number;
  health_percentage: number;
  genre_distribution: Record<string, number>;
  year_distribution: Record<string, number>;
  issue_types: Record<string, number>;
  missing_metadata: {
    missing_artist: number;
    missing_title: number;
    missing_album: number;
    missing_year: number;
    missing_genre: number;
  };
}> => {
  const response = await fetch(`${API_BASE_URL}/api/statistics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get statistics');
  }

  return response.json();
};

// ============================================================================
// Quality Analysis API
// ============================================================================

/**
 * Analyze audio quality of a file
 */
export const analyzeQuality = async (filepath: string): Promise<{
  bitrate_kbps: number;
  sample_rate_hz: number;
  channels: number;
  duration_seconds: number;
  quality_rating: string;
  quality_score: number;
  is_high_quality: boolean;
  needs_upgrade: boolean;
  file_size_mb: number;
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/quality/analyze/${encodeURIComponent(filepath)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze quality');
  }

  return response.json();
};

/**
 * Find low quality files
 */
export const findLowQuality = async (
  files: string[],
  threshold: number = 128
): Promise<{ low_quality_files: any[]; count: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/quality/find-low`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(files),
    // Note: threshold is a query parameter in the backend
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to find low quality files');
  }

  return response.json();
};

// ============================================================================
// Library Organization API
// ============================================================================

/**
 * Preview organization structure
 */
export const previewOrganization = async (
  files: string[],
  pattern: string = '{artist}/{album}'
): Promise<{
  total_folders: number;
  total_files: number;
  structure: Record<string, { files: string[]; count: number }>;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/organize/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files, pattern }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to preview organization');
  }

  return response.json();
};

/**
 * Organize library into folder structure
 */
export const organizeLibrary = async (
  files: string[],
  targetDir: string,
  pattern: string = '{artist}/{album}/{filename}',
  copyMode: boolean = true,
  createBackup: boolean = true
): Promise<{
  organized: any[];
  failed: any[];
  total: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/organize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      target_dir: targetDir,
      pattern,
      copy_mode: copyMode,
      create_backup: createBackup,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to organize library');
  }

  return response.json();
};

// ============================================================================
// Duplicate Detection API
// ============================================================================

/**
 * Detect duplicate files between root directory and subdirectories
 */
export const detectDuplicates = async (
  files: string[],
  rootDirectory: string
): Promise<{
  duplicates: any[];
  total_duplicates: number;
  root_files_count: number;
  organized_files_count: number;
  files_without_metadata: any[];
  files_without_metadata_count: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/duplicates/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files,
      root_directory: rootDirectory,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to detect duplicates');
  }

  return response.json();
};

/**
 * Move duplicate files to Trash folder and generate report
 */
export const moveDuplicatesToTrash = async (
  duplicates: any[],
  rootDirectory: string,
  trashFolderName: string = 'Trash'
): Promise<{
  success: boolean;
  message: string;
  report: {
    timestamp: string;
    root_directory: string;
    trash_folder: string;
    total_moved: number;
    total_failed: number;
    moved_files: any[];
    failed_files: any[];
  };
}> => {
  const response = await fetch(`${API_BASE_URL}/api/duplicates/move-to-trash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      duplicates,
      root_directory: rootDirectory,
      trash_folder_name: trashFolderName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to move duplicates to trash');
  }

  return response.json();
};
