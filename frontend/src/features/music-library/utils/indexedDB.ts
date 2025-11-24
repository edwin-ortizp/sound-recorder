/**
 * IndexedDB helper for caching large music libraries
 *
 * IndexedDB is much better than localStorage for large datasets:
 * - No size limit (localStorage is ~5-10MB)
 * - Async (doesn't block UI)
 * - Faster for large datasets
 */

import type { MusicFile } from '../types';

const DB_NAME = 'music-library-db';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const METADATA_STORE = 'metadata';

interface CacheMetadata {
  key: string;
  scanTimestamp: number;
  directoryPath: string;
  totalFiles: number;
}

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for files
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      // Create object store for metadata
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Save files to IndexedDB (replaces all cached files)
 */
export const saveFilesToCache = async (
  files: MusicFile[],
  directoryPath: string
): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');

  const filesStore = transaction.objectStore(STORE_NAME);
  const metadataStore = transaction.objectStore(METADATA_STORE);

  // Clear existing data
  await new Promise<void>((resolve, reject) => {
    const clearRequest = filesStore.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  // Save all files
  for (const file of files) {
    filesStore.add(file);
  }

  // Save metadata
  const metadata: CacheMetadata = {
    key: 'cache-info',
    scanTimestamp: Date.now(),
    directoryPath,
    totalFiles: files.length,
  };
  metadataStore.put(metadata);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

/**
 * Load files from IndexedDB
 */
export const loadFilesFromCache = async (): Promise<{
  files: MusicFile[];
  metadata: CacheMetadata | null;
} | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readonly');

    const filesStore = transaction.objectStore(STORE_NAME);
    const metadataStore = transaction.objectStore(METADATA_STORE);

    // Load metadata first
    const metadataRequest = metadataStore.get('cache-info');
    const metadata = await new Promise<CacheMetadata | null>((resolve) => {
      metadataRequest.onsuccess = () => resolve(metadataRequest.result || null);
      metadataRequest.onerror = () => resolve(null);
    });

    if (!metadata) {
      db.close();
      return null;
    }

    // Load all files
    const filesRequest = filesStore.getAll();
    const files = await new Promise<MusicFile[]>((resolve, reject) => {
      filesRequest.onsuccess = () => resolve(filesRequest.result);
      filesRequest.onerror = () => reject(filesRequest.error);
    });

    db.close();

    return { files, metadata };
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
  }
};

/**
 * Update a single file in the cache
 */
export const updateFileInCache = async (file: MusicFile): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.put(file);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');

  const filesStore = transaction.objectStore(STORE_NAME);
  const metadataStore = transaction.objectStore(METADATA_STORE);

  filesStore.clear();
  metadataStore.clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

/**
 * Get cache metadata without loading all files
 */
export const getCacheMetadata = async (): Promise<CacheMetadata | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(METADATA_STORE, 'readonly');
    const store = transaction.objectStore(METADATA_STORE);

    const request = store.get('cache-info');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error getting cache metadata:', error);
    return null;
  }
};
