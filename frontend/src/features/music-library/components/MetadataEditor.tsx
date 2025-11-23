import React, { useState, useEffect } from 'react';
import { Save, X, Image, Music2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import type { MusicFile, MusicMetadata } from '../types';
import * as api from '../api/client';

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
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (file) {
      setEditedMetadata(file.metadata);
      // Try to load existing artwork
      loadArtwork();
    }
  }, [file]);

  const loadArtwork = async () => {
    if (!file) return;
    try {
      const blob = await api.extractArtwork(file.path);
      const url = URL.createObjectURL(blob);
      setArtworkUrl(url);
    } catch (error) {
      // No artwork found, that's okay
      setArtworkUrl(null);
    }
  };

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

  const handleDownloadArtwork = async () => {
    if (!file || !editedMetadata.artist || !editedMetadata.album) {
      setStatusMessage({
        type: 'error',
        text: 'Necesitas artista y álbum para buscar artwork'
      });
      return;
    }

    setArtworkLoading(true);
    setStatusMessage({ type: 'info', text: 'Buscando artwork...' });

    try {
      const result = await api.embedArtwork(
        file.path,
        editedMetadata.artist,
        editedMetadata.album
      );

      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        // Reload artwork
        await loadArtwork();
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al descargar artwork'
      });
    } finally {
      setArtworkLoading(false);
    }
  };

  const handleDownloadLyrics = async () => {
    if (!file || !editedMetadata.artist || !editedMetadata.title) {
      setStatusMessage({
        type: 'error',
        text: 'Necesitas artista y título para buscar lyrics'
      });
      return;
    }

    setLyricsLoading(true);
    setStatusMessage({ type: 'info', text: 'Buscando lyrics...' });

    try {
      const result = await api.embedLyrics(
        file.path,
        editedMetadata.artist,
        editedMetadata.title
      );

      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al descargar lyrics'
      });
    } finally {
      setLyricsLoading(false);
    }
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
        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Nombre del archivo
          </label>
          <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded">
            {file.fileName}
          </p>
        </div>

        {artworkUrl && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Artwork Actual
            </label>
            <img
              src={artworkUrl}
              alt="Album artwork"
              className="w-32 h-32 object-cover rounded-lg border border-slate-200"
            />
          </div>
        )}

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

        <div className="border-t border-slate-200 pt-4 mt-4">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Herramientas Adicionales
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDownloadArtwork}
              variant="outline"
              size="sm"
              disabled={artworkLoading || !editedMetadata.artist || !editedMetadata.album}
            >
              {artworkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-2 h-4 w-4" />
              )}
              Descargar Artwork
            </Button>
            <Button
              onClick={handleDownloadLyrics}
              variant="outline"
              size="sm"
              disabled={lyricsLoading || !editedMetadata.artist || !editedMetadata.title}
            >
              {lyricsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Music2 className="mr-2 h-4 w-4" />
              )}
              Descargar Lyrics
            </Button>
          </div>
        </div>
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
