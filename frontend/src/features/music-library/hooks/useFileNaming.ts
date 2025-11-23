import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { analyzeFileName, getSuggestedName } from '../utils/namingStandard';
import type { MusicFile, NamingIssue } from '../types';

export const useFileNaming = (files: MusicFile[]) => {
  // Analyze all files for naming issues
  const filesWithIssues = useMemo(() => {
    return files.filter(file => file.issues.length > 0);
  }, [files]);

  // Find potential duplicates using fuzzy search
  const findDuplicates = useMemo(() => {
    const fuse = new Fuse(files, {
      keys: ['metadata.artist', 'metadata.title'],
      threshold: 0.3,
    });

    const duplicateGroups: MusicFile[][] = [];
    const processed = new Set<string>();

    files.forEach(file => {
      if (processed.has(file.id)) return;

      if (file.metadata.artist && file.metadata.title) {
        const results = fuse.search({
          $and: [
            { 'metadata.artist': file.metadata.artist },
            { 'metadata.title': file.metadata.title },
          ],
        });

        if (results.length > 1) {
          const group = results.map(r => r.item);
          group.forEach(f => processed.add(f.id));
          duplicateGroups.push(group);
        }
      }
    });

    return duplicateGroups;
  }, [files]);

  // Get statistics
  const stats = useMemo(() => {
    const totalFiles = files.length;
    const filesWithIssuesCount = filesWithIssues.length;
    const filesWithoutMetadata = files.filter(
      f => !f.metadata.artist && !f.metadata.title
    ).length;
    const duplicates = findDuplicates.reduce(
      (sum, group) => sum + group.length,
      0
    );

    return {
      totalFiles,
      filesWithIssues: filesWithIssuesCount,
      filesWithoutMetadata,
      duplicates,
    };
  }, [files, filesWithIssues, findDuplicates]);

  const analyzeFile = (fileName: string, metadata: MusicFile['metadata']) => {
    const issues = analyzeFileName(fileName, metadata);
    const suggestedName = getSuggestedName(fileName, metadata);

    return {
      issues,
      suggestedName,
    };
  };

  return {
    filesWithIssues,
    duplicates: findDuplicates,
    stats,
    analyzeFile,
  };
};
