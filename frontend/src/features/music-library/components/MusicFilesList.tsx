import React, { useState, useMemo } from 'react';
import { Music, AlertTriangle, CheckCircle, FileMusic, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { List } from 'react-window';
import type { MusicFile } from '../types';

interface MusicFilesListProps {
  files: MusicFile[];
  onFileSelect?: (file: MusicFile) => void;
  selectedFiles?: string[];
  onToggleFileSelection?: (filePath: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  multiSelectMode?: boolean;
}

export const MusicFilesList: React.FC<MusicFilesListProps> = ({
  files,
  onFileSelect,
  selectedFiles = [],
  onToggleFileSelection,
  onSelectAll,
  onDeselectAll,
  multiSelectMode = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);
  const [filterArtist, setFilterArtist] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterIssueType, setFilterIssueType] = useState('all');

  // Get unique artists and genres for filter dropdowns (must be before early return)
  const uniqueArtists = useMemo(() => {
    const artists = files
      .map(f => f.metadata.artist)
      .filter((a): a is string => Boolean(a));
    return Array.from(new Set(artists)).sort();
  }, [files]);

  const uniqueGenres = useMemo(() => {
    const genres = files
      .map(f => f.metadata.genre)
      .filter((g): g is string => Boolean(g));
    return Array.from(new Set(genres)).sort();
  }, [files]);

  // Filter files based on current filter settings (must be before early return)
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Filter by issues
      if (filterIssuesOnly && file.issues.length === 0) return false;

      // Filter by issue type
      if (filterIssueType !== 'all') {
        const hasIssueType = file.issues.some(i => i.type === filterIssueType);
        if (!hasIssueType) return false;
      }

      // Filter by artist
      if (filterArtist && file.metadata.artist !== filterArtist) return false;

      // Filter by genre
      if (filterGenre && file.metadata.genre !== filterGenre) return false;

      return true;
    });
  }, [files, filterIssuesOnly, filterArtist, filterGenre, filterIssueType]);

  // Early return after all hooks
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

  const formatDuration = (seconds?: number | string): string => {
    if (!seconds) return '—';
    const secondsNum = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    const mins = Math.floor(secondsNum / 60);
    const secs = Math.floor(secondsNum % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFileSelected = (filePath: string) => selectedFiles.includes(filePath);

  const clearFilters = () => {
    setFilterIssuesOnly(false);
    setFilterArtist('');
    setFilterGenre('');
    setFilterIssueType('all');
  };

  const activeFiltersCount = [
    filterIssuesOnly,
    filterArtist,
    filterGenre,
    filterIssueType !== 'all'
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileMusic className="h-5 w-5" />
            Archivos Encontrados
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            {filteredFiles.length} de {files.length} archivos
          </span>
          {multiSelectMode && selectedFiles.length > 0 && (
            <span className="text-blue-600">
              ({selectedFiles.length} seleccionados)
            </span>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Filter by artist */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Artista
                </label>
                <select
                  value={filterArtist}
                  onChange={(e) => setFilterArtist(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los artistas</option>
                  {uniqueArtists.map(artist => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </select>
              </div>

              {/* Filter by genre */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Género
                </label>
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los géneros</option>
                  {uniqueGenres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Filter by issue type */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Tipo de problema
                </label>
                <select
                  value={filterIssueType}
                  onChange={(e) => setFilterIssueType(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="no_artist">Sin artista</option>
                  <option value="no_title">Sin título</option>
                  <option value="no_standard">Formato no estándar</option>
                  <option value="missing_metadata">Sin metadatos</option>
                  <option value="invalid_chars">Caracteres inválidos</option>
                </select>
              </div>

              {/* Filter issues only */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterIssuesOnly}
                    onChange={(e) => setFilterIssuesOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Solo archivos con problemas
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={clearFilters} variant="ghost" size="sm">
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        {multiSelectMode && (
          <div className="flex gap-2 mt-2">
            <Button onClick={onSelectAll} variant="outline" size="sm">
              Seleccionar Todos
            </Button>
            <Button onClick={onDeselectAll} variant="outline" size="sm">
              Deseleccionar Todos
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <List
          defaultHeight={500}
          rowCount={filteredFiles.length}
          rowHeight={120}
          overscanCount={5}
          rowComponent={({ index, style }) => {
            const file = filteredFiles[index];
            return (
              <div style={style} className="px-1 py-1">
                <div
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${multiSelectMode ? 'cursor-default' : onFileSelect ? 'cursor-pointer hover:bg-slate-50 hover:shadow-md' : ''}
                    ${isFileSelected(file.path) ? 'border-blue-500 bg-blue-50' :
                      file.issues.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}
                  `}
                  onClick={() => {
                    if (!multiSelectMode && onFileSelect) {
                      onFileSelect(file);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {multiSelectMode && onToggleFileSelection && (
                      <div
                        className="flex-shrink-0 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isFileSelected(file.path)}
                          onChange={() => onToggleFileSelection(file.path)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}

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
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};
