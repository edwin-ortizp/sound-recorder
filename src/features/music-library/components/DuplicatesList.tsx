import { useState } from 'react';
import { DuplicateGroup } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Folder, AlertTriangle } from 'lucide-react';
import { formatBytes } from '../utils/duplicates';

interface DuplicatesListProps {
  duplicateGroups: DuplicateGroup[];
  onMoveDuplicates: (groupIds: string[]) => void;
  isMoving?: boolean;
}

export const DuplicatesList = ({
  duplicateGroups,
  onMoveDuplicates,
  isMoving = false,
}: DuplicatesListProps) => {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const selectAll = () => {
    setSelectedGroups(new Set(duplicateGroups.map((g) => g.id)));
  };

  const deselectAll = () => {
    setSelectedGroups(new Set());
  };

  const handleMoveDuplicates = () => {
    if (selectedGroups.size > 0) {
      onMoveDuplicates(Array.from(selectedGroups));
      setSelectedGroups(new Set());
    }
  };

  if (duplicateGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileAudio className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No se encontraron duplicados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedCount = selectedGroups.size;
  const totalFilesToMove = duplicateGroups
    .filter((g) => selectedGroups.has(g.id))
    .reduce((sum, g) => sum + g.rootFiles.length, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Duplicados Encontrados</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Seleccionar todos
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deseleccionar todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
            <div className="text-sm">
              <p>
                <strong>{selectedCount}</strong> grupos seleccionados
              </p>
              <p className="text-muted-foreground">
                {totalFilesToMove} archivos serán movidos a Trash
              </p>
            </div>
            <Button
              onClick={handleMoveDuplicates}
              disabled={selectedCount === 0 || isMoving}
            >
              {isMoving ? 'Moviendo...' : 'Mover a Trash'}
            </Button>
          </div>

          <div className="space-y-3">
            {duplicateGroups.map((group) => (
              <DuplicateGroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface DuplicateGroupItemProps {
  group: DuplicateGroup;
  isSelected: boolean;
  onToggle: () => void;
}

const DuplicateGroupItem = ({ group, isSelected, onToggle }: DuplicateGroupItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const firstFile = group.files[0];
  const metadata = firstFile.metadata;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} className="mt-1" />

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">
                {metadata?.title || firstFile.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {metadata?.artist || 'Artista desconocido'}
              </p>
            </div>

            <div className="flex gap-2">
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {group.rootFiles.length} duplicado(s)
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Archivos en la raíz (se moverán a Trash):
                </h4>
                <div className="space-y-1">
                  {group.rootFiles.map((file) => (
                    <div
                      key={file.id}
                      className="text-sm bg-destructive/10 p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        <span className="font-mono text-xs flex-1">{file.path}</span>
                        <Badge variant="outline">{formatBytes(file.size)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-green-600" />
                  Archivos organizados (se conservarán):
                </h4>
                <div className="space-y-1">
                  {group.organizedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="text-sm bg-green-50 p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        <span className="font-mono text-xs flex-1">{file.path}</span>
                        <Badge variant="outline">{formatBytes(file.size)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
