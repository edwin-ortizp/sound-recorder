import React from 'react';
import { Music, AlertTriangle, CheckCircle, FileMusic } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { MusicFile } from '../types';

interface MusicFilesListProps {
  files: MusicFile[];
  onFileSelect?: (file: MusicFile) => void;
}

export const MusicFilesList: React.FC<MusicFilesListProps> = ({
  files,
  onFileSelect,
}) => {
  if (files.length === 0) {
    return (
      <Alert>
        <Music className="h-4 w-4" />
        <AlertDescription>
          No se han encontrado archivos MP3. Escanea tu biblioteca para comenzar.
        </AlertDescription>
      </Alert>
    );
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileMusic className="h-5 w-5" />
            Archivos Encontrados
          </span>
          <span className="text-sm font-normal text-slate-600">
            {files.length} archivos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => onFileSelect?.(file)}
              className={`
                p-3 rounded-lg border transition-colors
                ${onFileSelect ? 'cursor-pointer hover:bg-slate-50' : ''}
                ${file.issues.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {file.issues.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {file.fileName}
                  </p>

                  {file.metadata.artist && file.metadata.title ? (
                    <p className="text-sm text-slate-600">
                      {file.metadata.artist} - {file.metadata.title}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Sin metadatos
                    </p>
                  )}

                  {file.suggestedName && file.suggestedName !== file.fileName && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Sugerencia: {file.suggestedName}
                    </p>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDuration(file.metadata.duration)}</span>
                    {file.metadata.album && (
                      <span className="truncate">{file.metadata.album}</span>
                    )}
                  </div>

                  {file.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {file.issues.map((issue, idx) => (
                        <p key={idx} className="text-xs text-orange-600">
                          ⚠ {issue.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
