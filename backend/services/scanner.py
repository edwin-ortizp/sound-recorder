"""
Music directory scanner service
"""
import os
from typing import List, Dict, Optional, Callable
from pathlib import Path


def scan_directory(
    directory_path: str,
    recursive: bool = True,
    on_progress: Optional[Callable[[int, int], None]] = None
) -> List[str]:
    """
    Scan directory for MP3 files

    Args:
        directory_path: Path to directory to scan
        recursive: Whether to scan subdirectories
        on_progress: Optional callback for progress updates (current, total)

    Returns:
        List of absolute paths to MP3 files
    """
    mp3_files = []

    if not os.path.exists(directory_path):
        raise ValueError(f"Directory does not exist: {directory_path}")

    if not os.path.isdir(directory_path):
        raise ValueError(f"Path is not a directory: {directory_path}")

    if recursive:
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                if file.lower().endswith('.mp3'):
                    filepath = os.path.join(root, file)
                    mp3_files.append(filepath)
                    if on_progress:
                        on_progress(len(mp3_files), len(mp3_files))
    else:
        for file in os.listdir(directory_path):
            filepath = os.path.join(directory_path, file)
            if os.path.isfile(filepath) and file.lower().endswith('.mp3'):
                mp3_files.append(filepath)
                if on_progress:
                    on_progress(len(mp3_files), len(mp3_files))

    return mp3_files


def get_file_info(filepath: str) -> Dict[str, any]:
    """
    Get basic file information

    Args:
        filepath: Path to file

    Returns:
        Dictionary with file info (name, size, path, directory)
    """
    if not os.path.exists(filepath):
        raise ValueError(f"File does not exist: {filepath}")

    file_stat = os.stat(filepath)
    path_obj = Path(filepath)

    return {
        "filename": path_obj.name,
        "path": str(path_obj.absolute()),
        "directory": str(path_obj.parent),
        "size": file_stat.st_size,
        "modified": file_stat.st_mtime,
    }
