import React, { useState } from 'react';
import { useMusicLibrary } from './hooks/useMusicLibrary';
import { useFileNaming } from './hooks/useFileNaming';
import { LibraryScanner } from './components/LibraryScanner';
import { NamingIssues } from './components/NamingIssues';
import { MusicFilesList } from './components/MusicFilesList';
import { MetadataEditor } from './components/MetadataEditor';
import type { MusicFile } from './types';

const MusicLibrary: React.FC = () => {
  const {
    isSupported,
    directoryHandle,
    files,
    scanning,
    scanProgress,
    openDirectory,
    scanLibrary,
    updateFileMetadata,
  } = useMusicLibrary();

  const { stats } = useFileNaming(files);
  const [selectedFile, setSelectedFile] = useState<MusicFile | null>(null);

  const handleOpenDirectory = async () => {
    const success = await openDirectory();
    if (success) {
      // Auto-scan after opening directory
      setTimeout(() => {
        scanLibrary();
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LibraryScanner
            isSupported={isSupported}
            directoryName={directoryHandle?.name || null}
            scanning={scanning}
            scanProgress={scanProgress}
            onOpenDirectory={handleOpenDirectory}
            onScanLibrary={scanLibrary}
          />
        </div>

        <div>
          <NamingIssues stats={stats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MusicFilesList
            files={files}
            onFileSelect={setSelectedFile}
          />
        </div>

        {selectedFile && (
          <div>
            <MetadataEditor
              file={selectedFile}
              onSave={updateFileMetadata}
              onClose={() => setSelectedFile(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicLibrary;
