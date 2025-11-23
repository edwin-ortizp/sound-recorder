import { useState } from 'react';
import { useMusicLibrary } from '../hooks/useMusicLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScanProgress } from './ScanProgress';
import { DuplicatesList } from './DuplicatesList';
import {
  FolderOpen,
  Search,
  FileAudio,
  HardDrive,
  Download,
  AlertCircle,
} from 'lucide-react';

export const MusicLibrary = () => {
  const {
    rootDirHandle,
    duplicateGroups,
    scanProgress,
    moveOperations,
    stats,
    selectDirectory,
    startScan,
    moveDuplicatesToTrash,
    generateAndDownloadReport,
    reset,
  } = useMusicLibrary();

  const [isSelecting, setIsSelecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    try {
      await selectDirectory();
    } catch (error) {
      console.error('Error seleccionando directorio:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setShowSuccessMessage(false);
    try {
      await startScan();
    } catch (error) {
      console.error('Error durante el escaneo:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleMoveDuplicates = async (groupIds: string[]) => {
    setIsMoving(true);
    setShowSuccessMessage(false);
    try {
      await moveDuplicatesToTrash(groupIds);
      setShowSuccessMessage(true);
      // Re-escanear después de mover archivos
      await startScan();
    } catch (error) {
      console.error('Error moviendo archivos:', error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleDownloadReport = () => {
    generateAndDownloadReport();
  };

  const handleReset = () => {
    reset();
    setShowSuccessMessage(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Organizador de Biblioteca Musical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta herramienta te ayuda a encontrar y organizar canciones duplicadas en tu
              biblioteca musical. Los archivos en subcarpetas se consideran organizados y
              no se moverán. Solo se actuará sobre archivos sueltos en la carpeta raíz.
            </AlertDescription>
          </Alert>

          {/* Paso 1: Seleccionar directorio */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSelectDirectory}
              disabled={isSelecting || isScanning}
              size="lg"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              {rootDirHandle
                ? `Carpeta: ${rootDirHandle.name}`
                : 'Seleccionar Carpeta de Música'}
            </Button>

            {rootDirHandle && (
              <>
                <Button
                  onClick={handleStartScan}
                  disabled={!rootDirHandle || isScanning}
                  variant="default"
                  size="lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  {isScanning ? 'Escaneando...' : 'Escanear Biblioteca'}
                </Button>

                <Button onClick={handleReset} variant="outline" size="lg">
                  Reiniciar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <ScanProgress progress={scanProgress} />

      {/* Estadísticas */}
      {scanProgress.status === 'completed' && duplicateGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileAudio className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Grupos de duplicados</p>
                  <p className="text-2xl font-bold">{stats.duplicateGroups}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileAudio className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Archivos duplicados en raíz
                  </p>
                  <p className="text-2xl font-bold">{stats.duplicateFiles}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <HardDrive className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Espacio a liberar</p>
                  <p className="text-2xl font-bold">{stats.totalSizeFormatted}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de éxito */}
      {showSuccessMessage && moveOperations.length > 0 && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-900">
                Archivos movidos exitosamente a la carpeta Trash
              </p>
              <p className="text-sm text-green-700">
                {moveOperations.filter((op) => op.success).length} archivos movidos
              </p>
            </div>
            <Button onClick={handleDownloadReport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar Reporte
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de duplicados */}
      {duplicateGroups.length > 0 && (
        <DuplicatesList
          duplicateGroups={duplicateGroups}
          onMoveDuplicates={handleMoveDuplicates}
          isMoving={isMoving}
        />
      )}
    </div>
  );
};
