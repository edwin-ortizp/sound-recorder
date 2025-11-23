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
}

export interface LibraryStats {
  total_files: number;
  files_with_issues: number;
  files_without_metadata: number;
}

/**
 * Scan a directory for MP3 files
 */
export const scanDirectory = async (
  path: string,
  recursive: boolean = true
): Promise<ScanResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, recursive }),
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
