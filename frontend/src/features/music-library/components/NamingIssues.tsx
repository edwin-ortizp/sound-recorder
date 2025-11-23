import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LibraryStats } from '../types';

interface NamingIssuesProps {
  stats: LibraryStats;
}

export const NamingIssues: React.FC<NamingIssuesProps> = ({ stats }) => {
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const healthPercentage = stats.totalFiles > 0
    ? ((stats.totalFiles - stats.filesWithIssues) / stats.totalFiles) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Estado de la Biblioteca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.totalFiles === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Escanea tu biblioteca para ver estadísticas
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Total de Archivos</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalFiles}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Salud de la Biblioteca</p>
                <p className={`text-2xl font-bold ${getHealthColor(healthPercentage)}`}>
                  {healthPercentage.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-900">
                    Problemas de nomenclatura
                  </span>
                </div>
                <span className="font-bold text-orange-900">
                  {stats.filesWithIssues}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-900">
                    Sin metadatos
                  </span>
                </div>
                <span className="font-bold text-red-900">
                  {stats.filesWithoutMetadata}
                </span>
              </div>

              {stats.duplicates > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-900">
                      Posibles duplicados
                    </span>
                  </div>
                  <span className="font-bold text-yellow-900">
                    {stats.duplicates}
                  </span>
                </div>
              )}

              {stats.filesWithIssues === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-900">
                    ¡Tu biblioteca está perfectamente organizada!
                  </span>
                </div>
              )}
            </div>

            {stats.filesWithIssues > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600">
                  Se encontraron {stats.filesWithIssues} archivos con problemas que pueden
                  ser corregidos siguiendo el estándar de nomenclatura:
                </p>
                <p className="text-sm font-mono bg-slate-100 p-2 rounded mt-2">
                  Artista - Título De La Canción.mp3
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
