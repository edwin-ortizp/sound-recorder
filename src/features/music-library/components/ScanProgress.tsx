import { ScanProgress as ScanProgressType } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react';

interface ScanProgressProps {
  progress: ScanProgressType;
}

export const ScanProgress = ({ progress }: ScanProgressProps) => {
  const { status, filesScanned, duplicatesFound, currentPath, error } = progress;

  if (status === 'idle') {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        {status === 'scanning' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Escaneando biblioteca...</h3>
                <p className="text-sm text-muted-foreground">
                  {filesScanned} archivos procesados
                </p>
              </div>
            </div>
            {currentPath && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded overflow-hidden text-ellipsis">
                {currentPath}
              </div>
            )}
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {status === 'analyzing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 animate-pulse text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Analizando duplicados...</h3>
                <p className="text-sm text-muted-foreground">
                  Comparando {filesScanned} archivos de audio
                </p>
              </div>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {status === 'completed' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-green-900">
                  Escaneo completado exitosamente
                </p>
                <p className="text-sm text-green-700">
                  Se procesaron {filesScanned} archivos de audio
                </p>
                <p className="text-sm text-green-700">
                  Se encontraron {duplicatesFound} grupos de duplicados
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Error durante el escaneo</p>
                <p className="text-sm">{error || 'Error desconocido'}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
