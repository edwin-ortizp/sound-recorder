import { MoveOperation } from '../types';

/**
 * Genera un reporte en formato texto de las operaciones de movimiento
 */
export const generateReport = (operations: MoveOperation[]): string => {
  const timestamp = new Date().toISOString();
  const successCount = operations.filter((op) => op.success).length;
  const failureCount = operations.filter((op) => !op.success).length;

  let report = `====================================\n`;
  report += `  REPORTE DE LIMPIEZA DE DUPLICADOS\n`;
  report += `====================================\n\n`;
  report += `Fecha: ${new Date(timestamp).toLocaleString('es-ES')}\n`;
  report += `Total de operaciones: ${operations.length}\n`;
  report += `Exitosas: ${successCount}\n`;
  report += `Fallidas: ${failureCount}\n`;
  report += `\n====================================\n\n`;

  if (successCount > 0) {
    report += `ARCHIVOS MOVIDOS A TRASH:\n`;
    report += `====================================\n\n`;

    operations
      .filter((op) => op.success)
      .forEach((op, index) => {
        report += `${index + 1}. Archivo movido:\n`;
        report += `   Origen: ${op.sourceFile.relativePath}\n`;
        report += `   Duplicado de: ${op.duplicateOf.relativePath}\n`;
        report += `   Artista: ${op.sourceFile.metadata?.artist || 'Desconocido'}\n`;
        report += `   Título: ${op.sourceFile.metadata?.title || 'Desconocido'}\n`;
        report += `   Tamaño: ${formatBytes(op.sourceFile.size)}\n`;
        report += `   Fecha: ${op.timestamp.toLocaleString('es-ES')}\n`;
        report += `\n`;
      });
  }

  if (failureCount > 0) {
    report += `\n====================================\n`;
    report += `ERRORES:\n`;
    report += `====================================\n\n`;

    operations
      .filter((op) => !op.success)
      .forEach((op, index) => {
        report += `${index + 1}. Error al mover:\n`;
        report += `   Archivo: ${op.sourceFile.relativePath}\n`;
        report += `   Error: ${op.error}\n`;
        report += `\n`;
      });
  }

  report += `\n====================================\n`;
  report += `INSTRUCCIONES:\n`;
  report += `====================================\n`;
  report += `Los archivos han sido movidos a la carpeta "Trash".\n`;
  report += `Puedes revisar el contenido y decidir si eliminarlos definitivamente.\n`;
  report += `Si encuentras archivos que no debieron moverse, puedes restaurarlos manualmente.\n`;

  return report;
};

/**
 * Descarga el reporte como archivo de texto
 */
export const downloadReport = (report: string, filename?: string): void => {
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || `reporte-duplicados-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();

  // Limpiar
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formatea bytes a formato legible
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
