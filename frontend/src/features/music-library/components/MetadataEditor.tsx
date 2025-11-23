import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import type { MusicFile, MusicMetadata } from '../types';

interface MetadataEditorProps {
  file: MusicFile | null;
  onSave: (fileId: string, metadata: Partial<MusicMetadata>) => void;
  onClose: () => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  file,
  onSave,
  onClose,
}) => {
  const [editedMetadata, setEditedMetadata] = useState<Partial<MusicMetadata>>({});

  useEffect(() => {
    if (file) {
      setEditedMetadata(file.metadata);
    }
  }, [file]);

  if (!file) {
    return null;
  }

  const handleSave = () => {
    onSave(file.id, editedMetadata);
    onClose();
  };

  const handleChange = (field: keyof MusicMetadata, value: string) => {
    setEditedMetadata(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Editar Metadatos</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Nombre del archivo
          </label>
          <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded">
            {file.fileName}
          </p>
        </div>

        <div>
          <label htmlFor="artist" className="text-sm font-medium text-slate-700 block mb-1">
            Artista *
          </label>
          <input
            id="artist"
            type="text"
            value={editedMetadata.artist || ''}
            onChange={(e) => handleChange('artist', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del artista"
          />
        </div>

        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-700 block mb-1">
            Título *
          </label>
          <input
            id="title"
            type="text"
            value={editedMetadata.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Título de la canción"
          />
        </div>

        <div>
          <label htmlFor="album" className="text-sm font-medium text-slate-700 block mb-1">
            Álbum
          </label>
          <input
            id="album"
            type="text"
            value={editedMetadata.album || ''}
            onChange={(e) => handleChange('album', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre del álbum"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="text-sm font-medium text-slate-700 block mb-1">
              Año
            </label>
            <input
              id="year"
              type="number"
              value={editedMetadata.year || ''}
              onChange={(e) => handleChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2024"
            />
          </div>

          <div>
            <label htmlFor="genre" className="text-sm font-medium text-slate-700 block mb-1">
              Género
            </label>
            <input
              id="genre"
              type="text"
              value={editedMetadata.genre || ''}
              onChange={(e) => handleChange('genre', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rock, Pop, etc."
            />
          </div>
        </div>

        {file.suggestedName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium mb-1">
              💡 Nombre sugerido:
            </p>
            <p className="text-sm text-blue-700 font-mono">
              {file.suggestedName}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  );
};
