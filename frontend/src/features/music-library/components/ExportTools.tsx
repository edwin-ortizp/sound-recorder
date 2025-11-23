import React, { useState } from 'react';
import { Download, FileText, Table, FileJson, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import * as api from '../api/client';
import type { MusicFile } from '../types';

interface ExportToolsProps {
  files: MusicFile[];
}

export const ExportTools: React.FC<ExportToolsProps> = ({ files }) => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'txt' | 'csv' | 'json' | 'issues') => {
    setLoading(true);

    try {
      // Convert MusicFile to the format expected by the API
      const apiFiles = files.map(f => ({
        id: f.id,
        path: f.path,
        filename: f.fileName,
        directory: f.directory,
        size: f.size,
        metadata: f.metadata,
        issues: f.issues,
        suggested_name: f.suggestedName,
      }));

      const blob = await api.exportLibrary(apiFiles, format, true);

      const extensions: Record<string, string> = {
        txt: 'txt',
        csv: 'csv',
        json: 'json',
        issues: 'txt',
      };

      const filename = `biblioteca_musica_${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStatistics = async () => {
    setStatsLoading(true);

    try {
      const apiFiles = files.map(f => ({
        id: f.id,
        path: f.path,
        filename: f.fileName,
        directory: f.directory,
        size: f.size,
        metadata: f.metadata,
        issues: f.issues,
        suggested_name: f.suggestedName,
      }));

      const stats = await api.getStatistics(apiFiles);
      setStatistics(stats);
    } catch (error) {
      console.error('Statistics failed:', error);
      alert(error instanceof Error ? error.message : 'Error al obtener estadísticas');
    } finally {
      setStatsLoading(false);
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exportar y Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Escanea una biblioteca para exportar datos y ver estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar y Estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            Exportar Biblioteca ({files.length} archivos)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleExport('txt')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              TXT
            </Button>

            <Button
              onClick={() => handleExport('csv')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Table className="mr-2 h-4 w-4" />
              )}
              CSV
            </Button>

            <Button
              onClick={() => handleExport('json')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              JSON
            </Button>

            <Button
              onClick={() => handleExport('issues')}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4" />
              )}
              Problemas
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <Button
            onClick={handleGetStatistics}
            disabled={statsLoading}
            variant="outline"
            className="w-full"
          >
            {statsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="mr-2 h-4 w-4" />
            )}
            Ver Estadísticas Detalladas
          </Button>
        </div>

        {statistics && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total de archivos:</span>
              <span className="font-medium">{statistics.total_files}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tamaño total:</span>
              <span className="font-medium">{statistics.total_size_mb.toFixed(2)} MB</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Salud de la biblioteca:</span>
              <span className={`font-medium ${
                statistics.health_percentage >= 80 ? 'text-green-600' :
                statistics.health_percentage >= 50 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {statistics.health_percentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Con problemas:</span>
              <span className="font-medium text-red-600">{statistics.files_with_issues}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Sin problemas:</span>
              <span className="font-medium text-green-600">{statistics.files_without_issues}</span>
            </div>

            {statistics.missing_metadata && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <p className="text-xs font-medium text-slate-700 mb-2">Metadatos faltantes:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Artista:</span>
                    <span>{statistics.missing_metadata.missing_artist}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Título:</span>
                    <span>{statistics.missing_metadata.missing_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Álbum:</span>
                    <span>{statistics.missing_metadata.missing_album}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Año:</span>
                    <span>{statistics.missing_metadata.missing_year}</span>
                  </div>
                </div>
              </div>
            )}

            {statistics.genre_distribution && Object.keys(statistics.genre_distribution).length > 0 && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <p className="text-xs font-medium text-slate-700 mb-2">Top 5 Géneros:</p>
                <div className="space-y-1">
                  {Object.entries(statistics.genre_distribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([genre, count]) => (
                      <div key={genre} className="flex justify-between text-xs">
                        <span className="text-slate-600">{genre}:</span>
                        <span>{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
