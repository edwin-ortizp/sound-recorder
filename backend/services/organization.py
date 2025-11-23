"""
Library organization service for folder structuring
"""
import os
import shutil
from typing import Dict, List, Optional, Tuple
from services import metadata as md


class OrganizationService:
    """Service for organizing music library into folders"""

    def get_organized_path(
        self,
        filepath: str,
        base_dir: str,
        pattern: str = "{artist}/{album}/{filename}"
    ) -> Tuple[str, Dict]:
        """
        Generate organized path for a file

        Args:
            filepath: Current file path
            base_dir: Base directory for organized library
            pattern: Organization pattern

        Returns:
            Tuple of (new_path, metadata_used)
        """
        filename = os.path.basename(filepath)
        file_metadata = md.read_metadata(filepath)

        artist = file_metadata.get("artist") or "Unknown Artist"
        album = file_metadata.get("album") or "Unknown Album"
        title = file_metadata.get("title") or filename

        # Sanitize names for filesystem
        artist = self._sanitize_dirname(artist)
        album = self._sanitize_dirname(album)

        # Build new path
        new_path = pattern.format(
            artist=artist,
            album=album,
            filename=filename,
            title=title
        )

        full_path = os.path.join(base_dir, new_path)

        return full_path, {
            "artist": artist,
            "album": album,
            "filename": filename
        }

    def _sanitize_dirname(self, name: str) -> str:
        """Sanitize string for use as directory name"""
        # Remove invalid characters
        invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
        for char in invalid_chars:
            name = name.replace(char, '')

        return name.strip()

    def organize_library(
        self,
        files: List[str],
        target_dir: str,
        pattern: str = "{artist}/{album}/{filename}",
        copy_mode: bool = True,
        create_backup: bool = True
    ) -> Dict:
        """
        Organize entire library into folder structure

        Args:
            files: List of file paths
            target_dir: Target directory for organized library
            pattern: Organization pattern
            copy_mode: If True, copy files. If False, move files.
            create_backup: Create backup before moving

        Returns:
            Results dictionary
        """
        results = {
            "organized": [],
            "failed": [],
            "total": len(files)
        }

        # Create target directory
        os.makedirs(target_dir, exist_ok=True)

        for filepath in files:
            if not os.path.exists(filepath):
                results["failed"].append({
                    "file": filepath,
                    "error": "File not found"
                })
                continue

            try:
                new_path, metadata_info = self.get_organized_path(
                    filepath,
                    target_dir,
                    pattern
                )

                # Create directory structure
                os.makedirs(os.path.dirname(new_path), exist_ok=True)

                # Copy or move file
                if copy_mode:
                    shutil.copy2(filepath, new_path)
                    operation = "copied"
                else:
                    shutil.move(filepath, new_path)
                    operation = "moved"

                results["organized"].append({
                    "original_path": filepath,
                    "new_path": new_path,
                    "operation": operation,
                    "metadata": metadata_info
                })

            except Exception as e:
                results["failed"].append({
                    "file": filepath,
                    "error": str(e)
                })

        return results

    def get_folder_structure_preview(
        self,
        files: List[str],
        pattern: str = "{artist}/{album}"
    ) -> Dict:
        """
        Preview folder structure without actually organizing

        Args:
            files: List of file paths
            pattern: Organization pattern

        Returns:
            Dictionary with preview of folder structure
        """
        structure = {}

        for filepath in files:
            if not os.path.exists(filepath):
                continue

            file_metadata = md.read_metadata(filepath)

            artist = file_metadata.get("artist") or "Unknown Artist"
            album = file_metadata.get("album") or "Unknown Album"

            artist = self._sanitize_dirname(artist)
            album = self._sanitize_dirname(album)

            folder_path = pattern.format(artist=artist, album=album)

            if folder_path not in structure:
                structure[folder_path] = {
                    "files": [],
                    "count": 0
                }

            structure[folder_path]["files"].append(os.path.basename(filepath))
            structure[folder_path]["count"] += 1

        return {
            "total_folders": len(structure),
            "total_files": len(files),
            "structure": structure
        }


organization_service = OrganizationService()
