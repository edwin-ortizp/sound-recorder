import type { MusicMetadata, NamingIssue } from '../types';

// Standard format: "Artist - Title.mp3"
const STANDARD_PATTERN = /^(.+?)\s*-\s*(.+?)\.mp3$/i;

// Invalid characters for filenames
const INVALID_CHARS = /[/\\?%*:|"<>]/g;

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const sanitizeFileName = (name: string): string => {
  return name
    .replace(INVALID_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const generateStandardName = (metadata: MusicMetadata): string | null => {
  if (!metadata.artist || !metadata.title) {
    return null;
  }

  const artist = sanitizeFileName(toTitleCase(metadata.artist));
  const title = sanitizeFileName(toTitleCase(metadata.title));

  return `${artist} - ${title}.mp3`;
};

export const matchesStandardPattern = (fileName: string): boolean => {
  return STANDARD_PATTERN.test(fileName);
};

export const extractArtistAndTitle = (fileName: string): { artist?: string; title?: string } => {
  const match = fileName.match(STANDARD_PATTERN);

  if (match) {
    return {
      artist: match[1].trim(),
      title: match[2].trim(),
    };
  }

  return {};
};

export const analyzeFileName = (
  fileName: string,
  metadata: MusicMetadata
): NamingIssue[] => {
  const issues: NamingIssue[] = [];

  // Check for missing metadata
  if (!metadata.artist) {
    issues.push({
      type: 'no_artist',
      severity: 'high',
      description: 'Falta información del artista en los metadatos',
    });
  }

  if (!metadata.title) {
    issues.push({
      type: 'no_title',
      severity: 'high',
      description: 'Falta el título de la canción en los metadatos',
    });
  }

  // Check if file has metadata but name doesn't match standard
  if (metadata.artist && metadata.title) {
    const expectedName = generateStandardName(metadata);
    if (expectedName && fileName !== expectedName) {
      issues.push({
        type: 'no_standard',
        severity: 'medium',
        description: `El nombre no sigue el formato estándar "Artista - Título.mp3"`,
      });
    }
  }

  // Check for invalid characters
  if (INVALID_CHARS.test(fileName)) {
    issues.push({
      type: 'invalid_chars',
      severity: 'high',
      description: 'El nombre contiene caracteres inválidos',
    });
  }

  // Check if metadata is completely missing
  if (!metadata.artist && !metadata.title && !metadata.album) {
    issues.push({
      type: 'missing_metadata',
      severity: 'high',
      description: 'El archivo no tiene metadatos ID3',
    });
  }

  return issues;
};

export const getSuggestedName = (
  fileName: string,
  metadata: MusicMetadata
): string | undefined => {
  // First try to generate from metadata
  const standardName = generateStandardName(metadata);
  if (standardName) {
    return standardName;
  }

  // If no metadata, try to extract from filename
  const extracted = extractArtistAndTitle(fileName);
  if (extracted.artist && extracted.title) {
    return generateStandardName(extracted as MusicMetadata);
  }

  return undefined;
};
