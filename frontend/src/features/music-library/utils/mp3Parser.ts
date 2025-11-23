import { parseBlob } from 'music-metadata-browser';
import type { MusicMetadata } from '../types';

export const parseMP3Metadata = async (file: File): Promise<MusicMetadata> => {
  try {
    const metadata = await parseBlob(file);

    return {
      artist: metadata.common.artist,
      title: metadata.common.title,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre?.[0],
      duration: metadata.format.duration,
      trackNumber: metadata.common.track?.no,
      albumArtist: metadata.common.albumartist,
    };
  } catch (error) {
    console.error('Error parsing MP3 metadata:', error);
    return {};
  }
};

export const hasCompleteMetadata = (metadata: MusicMetadata): boolean => {
  return !!(metadata.artist && metadata.title);
};

export const getMetadataCompleteness = (metadata: MusicMetadata): number => {
  const fields = ['artist', 'title', 'album', 'year', 'genre'];
  const filledFields = fields.filter(field =>
    metadata[field as keyof MusicMetadata]
  ).length;

  return (filledFields / fields.length) * 100;
};
