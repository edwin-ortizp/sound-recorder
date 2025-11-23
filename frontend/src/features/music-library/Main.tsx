import React, { useState } from 'react';
import { useMusicLibrary } from './hooks/useMusicLibrary';
import { useFileNaming } from './hooks/useFileNaming';
import { LibraryScanner } from './components/LibraryScanner';
import { NamingIssues } from './components/NamingIssues';
import { MusicFilesList } from './components/MusicFilesList';
import { MetadataEditor } from './components/MetadataEditor';
import { BatchOperations } from './components/BatchOperations';
import { ExportTools } from './components/ExportTools';
import { DuplicateDetector } from './components/DuplicateDetector';
import { Button } from '@/components/ui/button';
import type { MusicFile } from './types';

const MusicLibrary: React.FC = () => {
  const {
    isSupported,
    directoryPath,
    files,
    scanning,
    scanProgress,
    error,
    setDirectory,
    scanLibrary,
    updateFileMetadata,
  } = useMusicLibrary();

  const { stats } = useFileNaming(files);
  const [selectedFile, setSelectedFile] = useState<MusicFile | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);

  const handleToggleFileSelection = (filePath: string) => {
    setSelectedFilePaths(prev =>
      prev.includes(filePath)
        ? prev.filter(p => p !== filePath)
        : [...prev, filePath]
    );
  };

  const handleSelectAll = () => {
    setSelectedFilePaths(files.map(f => f.path));
  };

  const handleDeselectAll = () => {
    setSelectedFilePaths([]);
  };

  const handleToggleMultiSelectMode = () => {
    setMultiSelectMode(prev => !prev);
    if (multiSelectMode) {
      setSelectedFilePaths([]);
    }
    setSelectedFile(null);
  };

  const handleOperationComplete = () => {
    // Rescan the library after batch operations
    scanLibrary();
    setSelectedFilePaths([]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LibraryScanner
            isSupported={isSupported}
            directoryPath={directoryPath}
            scanning={scanning}
            scanProgress={scanProgress}
            error={error}
            onSetDirectory={setDirectory}
            onScanLibrary={scanLibrary}
          />
        </div>

        <div>
          <NamingIssues stats={stats} />
        </div>
      </div>

      {files.length > 0 && directoryPath && (
        <DuplicateDetector
          allFiles={files.map(f => f.path)}
          rootDirectory={directoryPath}
        />
      )}

      {files.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleToggleMultiSelectMode}
            variant={multiSelectMode ? 'default' : 'outline'}
          >
            {multiSelectMode ? 'Modo Edición Individual' : 'Modo Selección Múltiple'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MusicFilesList
            files={files}
            onFileSelect={setSelectedFile}
            selectedFiles={selectedFilePaths}
            onToggleFileSelection={handleToggleFileSelection}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            multiSelectMode={multiSelectMode}
          />
        </div>

        <div className="space-y-4">
          {selectedFile && !multiSelectMode && (
            <MetadataEditor
              file={selectedFile}
              onSave={updateFileMetadata}
              onClose={() => setSelectedFile(null)}
            />
          )}

          {multiSelectMode && (
            <BatchOperations
              selectedFiles={selectedFilePaths}
              onOperationComplete={handleOperationComplete}
            />
          )}

          <ExportTools files={files} />
        </div>
      </div>
    </div>
  );
};

export default MusicLibrary;
