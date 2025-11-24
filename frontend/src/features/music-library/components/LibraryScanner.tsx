import React, { useState } from 'react';
import { Folder, AlertCircle, Music, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface LibraryScannerProps {
  isSupported: boolean;
  directoryPath: string;
  scanning: boolean;
  scanProgress: { current: number; total: number };
  error: string | null;
  onSetDirectory: (path: string) => void;
  onScanLibrary: () => void;
}

export const LibraryScanner: React.FC<LibraryScannerProps> = ({
  isSupported,
  directoryPath,
  scanning,
  scanProgress,
  error,
  onSetDirectory,
  onScanLibrary,
}) => {
  const [inputPath, setInputPath] = useState(directoryPath);

  const handleScan = () => {
    if (inputPath && inputPath !== directoryPath) {
      onSetDirectory(inputPath);
    }
    onScanLibrary();
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <Server className="h-4 w-4" />
        <AlertDescription>
          El backend de Python no está disponible. Por favor asegúrate de que el servidor esté corriendo en http://localhost:8000
          <br />
          <br />
          <code className="text-xs bg-slate-100 px-2 py-1 rounded">
            cd backend && pip install -r requirements.txt && python main.py
          </code>
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
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="directory-path" className="text-sm font-medium text-slate-700">
            Ruta del directorio de música:
          </label>
          <input
            id="directory-path"
            type="text"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            placeholder="/home/usuario/Música  o  C:\Users\Usuario\Music"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={scanning}
          />
          <p className="text-xs text-slate-500">
            💡 Ejemplos: <code>/home/user/Music</code> (Linux/Mac) o <code>C:\Users\User\Music</code> (Windows)
          </p>
        </div>

        {scanning ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {scanProgress.total > 0 ? 'Procesando metadata...' : 'Escaneando archivos...'}
              </span>
              <span className="font-medium">
                {scanProgress.total > 0
                  ? `${scanProgress.current} / ${scanProgress.total} procesados`
                  : `${scanProgress.current} encontrados`
                }
              </span>
            </div>
            <Progress value={progressPercentage} />
            {scanProgress.total > 0 && (
              <p className="text-xs text-slate-500">
                {Math.round(progressPercentage)}% completado - Esto puede tomar unos minutos para bibliotecas grandes
              </p>
            )}
          </div>
        ) : (
          <Button onClick={handleScan} className="w-full" disabled={!inputPath}>
            <Music className="mr-2 h-4 w-4" />
            {directoryPath ? 'Escanear Biblioteca' : 'Comenzar Escaneo'}
          </Button>
        )}

        {directoryPath && !scanning && scanProgress.total > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900">
              ✅ Escaneado completo: {scanProgress.total} archivos MP3 encontrados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
