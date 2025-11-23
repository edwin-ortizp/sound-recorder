import React, { useState } from 'react';
import { Copy, Trash2, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { detectDuplicates, moveDuplicatesToTrash } from '../api/client';
import type { DuplicateDetectionResult, DuplicateCleanupReport } from '../types';

interface DuplicateDetectorProps {
  allFiles: string[];
  rootDirectory: string;
}

export const DuplicateDetector: React.FC<DuplicateDetectorProps> = ({
  allFiles,
  rootDirectory,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set());
  const [movingToTrash, setMovingToTrash] = useState(false);
  const [cleanupReport, setCleanupReport] = useState<DuplicateCleanupReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetectDuplicates = async () => {
    if (!allFiles || allFiles.length === 0) {
      setError('No hay archivos para analizar. Primero escanea tu biblioteca.');
      return;
    }

    if (!rootDirectory) {
      setError('No se ha especificado el directorio raíz.');
      return;
    }

    setDetecting(true);
    setError(null);
    setDuplicateResult(null);
    setCleanupReport(null);

    try {
      const result = await detectDuplicates(allFiles, rootDirectory);
      setDuplicateResult(result);

      // Select all duplicates by default
      const allIndices = new Set(result.duplicates.map((_, idx) => idx));
      setSelectedDuplicates(allIndices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al detectar duplicados');
    } finally {
      setDetecting(false);
    }
  };

  const handleToggleDuplicate = (index: number) => {
    const newSelection = new Set(selectedDuplicates);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedDuplicates(newSelection);
  };

  const handleSelectAll = () => {
    if (!duplicateResult) return;
    const allIndices = new Set(duplicateResult.duplicates.map((_, idx) => idx));
    setSelectedDuplicates(allIndices);
  };

  const handleDeselectAll = () => {
    setSelectedDuplicates(new Set());
  };

  const handleMoveToTrash = async () => {
    if (!duplicateResult || selectedDuplicates.size === 0) return;

    const selectedDuplicatesList = Array.from(selectedDuplicates).map(
      (idx) => duplicateResult.duplicates[idx]
    );

    setMovingToTrash(true);
    setError(null);

    try {
      const result = await moveDuplicatesToTrash(selectedDuplicatesList, rootDirectory);

      if (result.success) {
        setCleanupReport(result.report);
        setDuplicateResult(null);
        setSelectedDuplicates(new Set());
      } else {
        setError(result.message || 'Error al mover archivos a Trash');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover archivos a Trash');
    } finally {
      setMovingToTrash(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Detector de Duplicados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600 flex-1">
              <p className="mb-2">
                Esta herramienta detecta canciones duplicadas comparando los metadatos
                (artista y título) de forma inteligente, ignorando mayúsculas, espacios
                y caracteres especiales.
              </p>
              <p className="mb-2">
                <strong>Importante:</strong> Solo se consideran duplicados los archivos
                que están sueltos en la carpeta raíz y que también existen en subcarpetas
                organizadas. Las subcarpetas organizadas NO se tocarán.
              </p>
              <p>
                Los archivos duplicados se moverán a una carpeta "Trash" desde donde
                podrás revisarlos antes de eliminarlos definitivamente.
              </p>
            </div>
          </div>

          <Button
            onClick={handleDetectDuplicates}
            disabled={detecting || !allFiles || allFiles.length === 0}
            className="w-full"
          >
            {detecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detectando duplicados...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Detectar Duplicados
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {duplicateResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados de la Detección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Archivos en raíz:</p>
                <p className="text-2xl font-bold">{duplicateResult.root_files_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Archivos organizados:</p>
                <p className="text-2xl font-bold">{duplicateResult.organized_files_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duplicados encontrados:</p>
                <p className="text-2xl font-bold text-orange-600">
                  {duplicateResult.total_duplicates}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sin metadatos:</p>
                <p className="text-2xl font-bold text-red-600">
                  {duplicateResult.files_without_metadata_count}
                </p>
              </div>
            </div>

            {duplicateResult.files_without_metadata_count > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Hay {duplicateResult.files_without_metadata_count} archivos en la raíz sin
                  metadatos (artista o título). Estos archivos no pueden ser detectados como
                  duplicados automáticamente.
                </AlertDescription>
              </Alert>
            )}

            {duplicateResult.total_duplicates > 0 ? (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Seleccionar todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deseleccionar todos
                  </Button>
                  <div className="flex-1" />
                  <span className="text-sm text-gray-600 self-center">
                    {selectedDuplicates.size} de {duplicateResult.total_duplicates} seleccionados
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {duplicateResult.duplicates.map((duplicate, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        selectedDuplicates.has(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDuplicates.has(index)}
                          onChange={() => handleToggleDuplicate(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="bg-orange-100 p-3 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Archivo en raíz (será movido a Trash):
                            </p>
                            <p className="font-medium text-sm break-all">
                              {duplicate.root_file.filename}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {duplicate.root_file.metadata.artist} -{' '}
                              {duplicate.root_file.metadata.title}
                            </p>
                          </div>

                          <div className="bg-green-100 p-3 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Coincide con {duplicate.organized_matches.length} archivo(s)
                              organizado(s):
                            </p>
                            {duplicate.organized_matches.map((match: any, matchIndex: number) => (
                              <div key={matchIndex} className="mt-2 text-xs">
                                <p className="font-medium break-all">{match.path}</p>
                                <p className="text-gray-600">
                                  {match.metadata?.artist} - {match.metadata?.title}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleMoveToTrash}
                  disabled={selectedDuplicates.size === 0 || movingToTrash}
                  variant="destructive"
                  className="w-full"
                >
                  {movingToTrash ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Moviendo a Trash...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Mover {selectedDuplicates.size} duplicado(s) a Trash
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  ¡Excelente! No se encontraron duplicados en tu biblioteca.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {cleanupReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Limpieza Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Se movieron {cleanupReport.total_moved} archivos a la carpeta Trash.
                {cleanupReport.total_failed > 0 && (
                  <> {cleanupReport.total_failed} archivos fallaron.</>
                )}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Carpeta Trash:</p>
              <p className="text-sm text-gray-600 break-all">{cleanupReport.trash_folder}</p>
              <p className="text-xs text-gray-500 mt-2">
                Se generó un reporte detallado en la carpeta Trash con la lista completa de
                archivos movidos.
              </p>
            </div>

            {cleanupReport.moved_files.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Archivos movidos:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cleanupReport.moved_files.map((file, index) => (
                    <div key={index} className="bg-white border p-3 rounded text-sm">
                      <p className="font-medium break-all">{file.filename}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {file.metadata.artist} - {file.metadata.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coincidía con: {file.matched_with.length} archivo(s)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cleanupReport.failed_files.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    Errores ({cleanupReport.failed_files.length}):
                  </p>
                  {cleanupReport.failed_files.map((file, index) => (
                    <p key={index} className="text-xs mt-1">
                      {file.filename}: {file.error}
                    </p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => {
                setCleanupReport(null);
                handleDetectDuplicates();
              }}
              className="w-full"
            >
              Detectar duplicados nuevamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
