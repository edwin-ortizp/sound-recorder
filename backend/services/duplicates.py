"""
Duplicate detection service with intelligent metadata matching
"""
import os
import re
import shutil
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from pathlib import Path
from .metadata import read_metadata
from .scanner import get_file_info


def normalize_string(text: Optional[str]) -> str:
    """
    Normalize a string for intelligent comparison.
    Ignores case, spaces, hyphens, and special characters.

    Args:
        text: String to normalize

    Returns:
        Normalized string for comparison
    """
    if not text:
        return ""

    # Convert to lowercase
    normalized = text.lower()

    # Remove common words that don't matter for comparison
    common_words = [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'feat', 'ft', 'featuring', 'with', 'vs', 'versus', 'remix', 'remaster',
        'remastered', 'version', 'edit', 'extended', 'radio', 'original'
    ]

    # Remove parentheses and their content (often contains version info)
    normalized = re.sub(r'\([^)]*\)', '', normalized)
    normalized = re.sub(r'\[[^\]]*\]', '', normalized)

    # Remove special characters except letters and numbers
    normalized = re.sub(r'[^a-z0-9\s]', '', normalized)

    # Split into words and filter common words
    words = normalized.split()
    words = [w for w in words if w not in common_words]

    # Join back and remove extra spaces
    normalized = ' '.join(words)
    normalized = re.sub(r'\s+', '', normalized)

    return normalized.strip()


def create_metadata_fingerprint(metadata: Dict) -> str:
    """
    Create a unique fingerprint from metadata for comparison.

    Args:
        metadata: Metadata dictionary with artist and title

    Returns:
        Fingerprint string
    """
    artist = normalize_string(metadata.get('artist', ''))
    title = normalize_string(metadata.get('title', ''))

    # Combine artist and title for the fingerprint
    fingerprint = f"{artist}||{title}"
    return fingerprint


def is_in_root_directory(filepath: str, root_dir: str) -> bool:
    """
    Check if a file is directly in the root directory (not in subdirectories).

    Args:
        filepath: Path to the file
        root_dir: Root directory path

    Returns:
        True if file is in root, False if in subdirectory
    """
    file_parent = str(Path(filepath).parent)
    root_normalized = os.path.normpath(root_dir)
    file_parent_normalized = os.path.normpath(file_parent)

    return file_parent_normalized == root_normalized


def detect_duplicates(
    files: List[str],
    root_directory: str
) -> Dict[str, any]:
    """
    Detect duplicate files between root directory and subdirectories.

    Files in subdirectories are considered "organized" (good).
    Files in root directory are considered "loose" (candidates for cleanup).

    Args:
        files: List of file paths to analyze
        root_directory: Root directory path

    Returns:
        Dictionary with duplicate information
    """
    # Separate files into root files and organized files
    root_files = []
    organized_files = []

    for filepath in files:
        if is_in_root_directory(filepath, root_directory):
            root_files.append(filepath)
        else:
            organized_files.append(filepath)

    # Create fingerprints for organized files
    organized_fingerprints = {}
    for filepath in organized_files:
        try:
            metadata = read_metadata(filepath)
            fingerprint = create_metadata_fingerprint(metadata)

            # Only consider files with valid metadata
            if fingerprint and fingerprint != "||":
                if fingerprint not in organized_fingerprints:
                    organized_fingerprints[fingerprint] = []
                organized_fingerprints[fingerprint].append({
                    'path': filepath,
                    'metadata': metadata
                })
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            continue

    # Find duplicates in root directory
    duplicates = []
    root_files_without_metadata = []

    for filepath in root_files:
        try:
            metadata = read_metadata(filepath)
            fingerprint = create_metadata_fingerprint(metadata)

            # Check if file has no metadata
            if fingerprint == "||" or not metadata.get('artist') or not metadata.get('title'):
                root_files_without_metadata.append({
                    'path': filepath,
                    'filename': os.path.basename(filepath),
                    'metadata': metadata,
                    'reason': 'No metadata (artist or title missing)'
                })
                continue

            # Check if this fingerprint exists in organized files
            if fingerprint in organized_fingerprints:
                organized_matches = organized_fingerprints[fingerprint]

                duplicates.append({
                    'root_file': {
                        'path': filepath,
                        'filename': os.path.basename(filepath),
                        'metadata': metadata
                    },
                    'organized_matches': organized_matches,
                    'fingerprint': fingerprint
                })
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            continue

    return {
        'duplicates': duplicates,
        'total_duplicates': len(duplicates),
        'root_files_count': len(root_files),
        'organized_files_count': len(organized_files),
        'files_without_metadata': root_files_without_metadata,
        'files_without_metadata_count': len(root_files_without_metadata)
    }


def move_duplicates_to_trash(
    duplicates: List[Dict],
    root_directory: str,
    trash_folder_name: str = "Trash"
) -> Tuple[bool, str, List[Dict]]:
    """
    Move duplicate files from root to Trash folder and generate report.

    Args:
        duplicates: List of duplicate file information
        root_directory: Root directory path
        trash_folder_name: Name of the trash folder (default: "Trash")

    Returns:
        Tuple of (success, message, report_data)
    """
    try:
        # Create Trash folder in root directory
        trash_path = os.path.join(root_directory, trash_folder_name)
        os.makedirs(trash_path, exist_ok=True)

        moved_files = []
        failed_files = []

        for duplicate in duplicates:
            root_file = duplicate['root_file']
            source_path = root_file['path']
            filename = os.path.basename(source_path)
            destination_path = os.path.join(trash_path, filename)

            # Handle filename conflicts in Trash folder
            if os.path.exists(destination_path):
                base, ext = os.path.splitext(filename)
                counter = 1
                while os.path.exists(destination_path):
                    new_filename = f"{base}_{counter}{ext}"
                    destination_path = os.path.join(trash_path, new_filename)
                    counter += 1

            try:
                # Move file to Trash
                shutil.move(source_path, destination_path)

                moved_files.append({
                    'original_path': source_path,
                    'trash_path': destination_path,
                    'filename': filename,
                    'metadata': root_file['metadata'],
                    'matched_with': [m['path'] for m in duplicate['organized_matches']],
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                failed_files.append({
                    'path': source_path,
                    'filename': filename,
                    'error': str(e)
                })

        # Generate report
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'root_directory': root_directory,
            'trash_folder': trash_path,
            'total_moved': len(moved_files),
            'total_failed': len(failed_files),
            'moved_files': moved_files,
            'failed_files': failed_files
        }

        # Save report to file
        report_path = os.path.join(trash_path, f"duplicate_cleanup_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
        save_report_to_file(report_data, report_path)

        message = f"Successfully moved {len(moved_files)} duplicates to Trash"
        if failed_files:
            message += f" ({len(failed_files)} failed)"

        return True, message, report_data

    except Exception as e:
        return False, f"Error moving files to Trash: {str(e)}", {}


def save_report_to_file(report_data: Dict, report_path: str):
    """
    Save duplicate cleanup report to a text file.

    Args:
        report_data: Report data dictionary
        report_path: Path where to save the report
    """
    try:
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("DUPLICATE CLEANUP REPORT\n")
            f.write("=" * 80 + "\n\n")

            f.write(f"Timestamp: {report_data['timestamp']}\n")
            f.write(f"Root Directory: {report_data['root_directory']}\n")
            f.write(f"Trash Folder: {report_data['trash_folder']}\n")
            f.write(f"Total Files Moved: {report_data['total_moved']}\n")
            f.write(f"Total Failed: {report_data['total_failed']}\n\n")

            if report_data['moved_files']:
                f.write("-" * 80 + "\n")
                f.write("MOVED FILES\n")
                f.write("-" * 80 + "\n\n")

                for i, file_info in enumerate(report_data['moved_files'], 1):
                    f.write(f"{i}. {file_info['filename']}\n")
                    f.write(f"   Original Path: {file_info['original_path']}\n")
                    f.write(f"   Trash Path: {file_info['trash_path']}\n")
                    f.write(f"   Artist: {file_info['metadata'].get('artist', 'N/A')}\n")
                    f.write(f"   Title: {file_info['metadata'].get('title', 'N/A')}\n")
                    f.write(f"   Matched with organized files:\n")
                    for match in file_info['matched_with']:
                        f.write(f"      - {match}\n")
                    f.write("\n")

            if report_data['failed_files']:
                f.write("-" * 80 + "\n")
                f.write("FAILED OPERATIONS\n")
                f.write("-" * 80 + "\n\n")

                for i, file_info in enumerate(report_data['failed_files'], 1):
                    f.write(f"{i}. {file_info['filename']}\n")
                    f.write(f"   Path: {file_info['path']}\n")
                    f.write(f"   Error: {file_info['error']}\n\n")

            f.write("=" * 80 + "\n")
            f.write("END OF REPORT\n")
            f.write("=" * 80 + "\n")

    except Exception as e:
        print(f"Error saving report to file: {e}")
