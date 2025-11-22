import React from 'react';
import { Folder, AlertCircle, Loader2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface LibraryScannerProps {
  isSupported: boolean;
  directoryName: string | null;
  scanning: boolean;
  scanProgress: { current: number; total: number };
  onOpenDirectory: () => void;
  onScanLibrary: () => void;
}

export const LibraryScanner: React.FC<LibraryScannerProps> = ({
  isSupported,
  directoryName,
  scanning,
  scanProgress,
  onOpenDirectory,
  onScanLibrary,
}) => {
  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tu navegador no soporta la API de acceso a archivos.
          Por favor usa Chrome o Edge para esta funcionalidad.
        </AlertDescription>
      </Alert>
    );
  }

  const progressPercentage = scanProgress.total > 0
    ? (scanProgress.current / scanProgress.total) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Biblioteca Musical
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!directoryName ? (
          <div className="text-center py-8">
            <Folder className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 mb-4">
              Selecciona tu directorio de música para comenzar
            </p>
            <Button onClick={onOpenDirectory}>
              <Folder className="mr-2 h-4 w-4" />
              Abrir Directorio de Música
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Directorio actual:</p>
              <p className="font-semibold text-slate-900">{directoryName}</p>
            </div>

            {scanning ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Escaneando archivos...</span>
                  <span className="font-medium">
                    {scanProgress.current} / {scanProgress.total}
                  </span>
                </div>
                <Progress value={progressPercentage} />
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={onScanLibrary} className="flex-1">
                  <Music className="mr-2 h-4 w-4" />
                  Escanear Biblioteca
                </Button>
                <Button onClick={onOpenDirectory} variant="outline">
                  <Folder className="mr-2 h-4 w-4" />
                  Cambiar Directorio
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
