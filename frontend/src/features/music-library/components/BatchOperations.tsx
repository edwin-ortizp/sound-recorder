import React, { useState } from 'react';
import { Wand2, FileEdit, Save, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import * as api from '../api/client';

interface BatchOperationsProps {
  selectedFiles: string[];
  onOperationComplete: () => void;
}

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  selectedFiles,
  onOperationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [results, setResults] = useState<{
    success: any[];
    failed: any[];
    renamed?: any[];
    metadata_updated?: any[];
    backup_id?: string;
  } | null>(null);

  const handleBatchRename = async () => {
    setLoading(true);
    setOperation('Renombrando archivos...');
    setResults(null);

    try {
      const result = await api.batchRename(selectedFiles, true, true);
      setResults(result);
      onOperationComplete();
    } catch (error) {
      console.error('Batch rename failed:', error);
      alert(error instanceof Error ? error.message : 'Error al renombrar archivos');
    } finally {
      setLoading(false);
      setOperation(null);
    }
  };

  const handleBatchAutoFix = async () => {
    setLoading(true);
    setOperation('Aplicando correcciones automáticas...');
    setResults(null);

    try {
      const result = await api.batchAutoFix(selectedFiles, true, true, true);
      setResults(result);
      onOperationComplete();
    } catch (error) {
      console.error('Batch auto-fix failed:', error);
      alert(error instanceof Error ? error.message : 'Error al auto-corregir archivos');
    } finally {
      setLoading(false);
      setOperation(null);
    }
  };

  const handleBatchMetadata = async () => {
    const genre = prompt('Ingrese el género para todos los archivos (dejar vacío para omitir):');
    if (genre === null) return; // User cancelled

    const year = prompt('Ingrese el año para todos los archivos (dejar vacío para omitir):');
    if (year === null) return; // User cancelled

    const metadata: Record<string, string> = {};
    if (genre) metadata.genre = genre;
    if (year) metadata.year = year;

    if (Object.keys(metadata).length === 0) {
      alert('No se proporcionaron datos para actualizar');
      return;
    }

    setLoading(true);
    setOperation('Actualizando metadatos...');
    setResults(null);

    try {
      const result = await api.batchUpdateMetadata(selectedFiles, metadata, true);
      setResults(result);
      onOperationComplete();
    } catch (error) {
      console.error('Batch metadata update failed:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar metadatos');
    } finally {
      setLoading(false);
      setOperation(null);
    }
  };

  if (selectedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operaciones en Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Selecciona archivos para habilitar las operaciones en lote
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Operaciones en Lote ({selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && operation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-3" />
              <span className="text-sm text-blue-900 font-medium">{operation}</span>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  Exitosos: {results.success?.length || results.renamed?.length || 0}
                </span>
              </div>
            </div>

            {results.failed && results.failed.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-900">
                    Fallidos: {results.failed.length}
                  </span>
                </div>
              </div>
            )}

            {results.backup_id && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  💾 Backup creado: {results.backup_id}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleBatchAutoFix}
            disabled={loading}
            className="w-full"
          >
            {loading && operation?.includes('correcciones') ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Auto-Corregir Todo
          </Button>

          <Button
            onClick={handleBatchRename}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading && operation?.includes('Renombrando') ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileEdit className="mr-2 h-4 w-4" />
            )}
            Renombrar con Sugerencias
          </Button>

          <Button
            onClick={handleBatchMetadata}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading && operation?.includes('metadatos') ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Actualizar Metadatos
          </Button>
        </div>

        <div className="text-xs text-slate-500 mt-4">
          <p>✓ Todas las operaciones crean un backup automático</p>
          <p>✓ Puedes revertir cambios usando el historial de backups</p>
        </div>
      </CardContent>
    </Card>
  );
};
