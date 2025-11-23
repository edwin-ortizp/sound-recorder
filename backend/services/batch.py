"""
Batch operations service for mass file modifications
"""
import os
import shutil
from typing import List, Dict, Tuple, Optional, Callable
from datetime import datetime
import json

from services import metadata, naming


class BatchService:
    """Service for batch operations on music files"""

    def __init__(self):
        self.backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
        self.history_file = os.path.join(self.backup_dir, 'history.json')
        os.makedirs(self.backup_dir, exist_ok=True)

    def create_backup(self, files: List[str], operation: str) -> str:
        """
        Create backup of files before batch operation

        Args:
            files: List of file paths
            operation: Description of operation

        Returns:
            Backup ID
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_id = f"{operation}_{timestamp}"
        backup_path = os.path.join(self.backup_dir, backup_id)
        os.makedirs(backup_path, exist_ok=True)

        # Copy files to backup
        backed_up_files = []
        for filepath in files:
            if os.path.exists(filepath):
                filename = os.path.basename(filepath)
                backup_file = os.path.join(backup_path, filename)
                shutil.copy2(filepath, backup_file)
                backed_up_files.append({
                    'original': filepath,
                    'backup': backup_file
                })

        # Save backup metadata
        backup_metadata = {
            'id': backup_id,
            'operation': operation,
            'timestamp': timestamp,
            'files': backed_up_files,
            'count': len(backed_up_files)
        }

        metadata_file = os.path.join(backup_path, 'metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(backup_metadata, f, indent=2)

        # Add to history
        self._add_to_history(backup_metadata)

        return backup_id

    def _add_to_history(self, backup_metadata: Dict):
        """Add backup to history file"""
        history = []

        if os.path.exists(self.history_file):
            with open(self.history_file, 'r') as f:
                history = json.load(f)

        history.append(backup_metadata)

        with open(self.history_file, 'w') as f:
            json.dump(history, f, indent=2)

    def restore_backup(self, backup_id: str) -> Tuple[bool, str]:
        """
        Restore files from backup

        Args:
            backup_id: Backup ID to restore

        Returns:
            Tuple of (success, message)
        """
        backup_path = os.path.join(self.backup_dir, backup_id)
        metadata_file = os.path.join(backup_path, 'metadata.json')

        if not os.path.exists(metadata_file):
            return False, f"Backup {backup_id} not found"

        try:
            with open(metadata_file, 'r') as f:
                backup_metadata = json.load(f)

            restored = 0
            for file_info in backup_metadata['files']:
                backup_file = file_info['backup']
                original_file = file_info['original']

                if os.path.exists(backup_file):
                    # Restore file
                    shutil.copy2(backup_file, original_file)
                    restored += 1

            return True, f"Restored {restored} files from backup {backup_id}"

        except Exception as e:
            return False, f"Error restoring backup: {str(e)}"

    def batch_rename(
        self,
        files: List[str],
        name_pattern: Optional[str] = None,
        use_suggestions: bool = True,
        create_backup: bool = True
    ) -> Dict:
        """
        Rename multiple files

        Args:
            files: List of file paths
            name_pattern: Naming pattern or None to use suggestions
            use_suggestions: Whether to use suggested names
            create_backup: Whether to create backup before renaming

        Returns:
            Dictionary with results
        """
        if create_backup:
            backup_id = self.create_backup(files, 'batch_rename')
        else:
            backup_id = None

        results = {
            'success': [],
            'failed': [],
            'backup_id': backup_id
        }

        for filepath in files:
            if not os.path.exists(filepath):
                results['failed'].append({
                    'file': filepath,
                    'error': 'File not found'
                })
                continue

            try:
                # Get metadata for suggestions
                file_metadata = metadata.read_metadata(filepath)
                filename = os.path.basename(filepath)

                # Determine new name
                if use_suggestions:
                    new_name = naming.get_suggested_name(filename, file_metadata)
                    if not new_name:
                        results['failed'].append({
                            'file': filepath,
                            'error': 'Could not generate suggested name'
                        })
                        continue
                else:
                    new_name = filename  # Custom pattern would go here

                # Rename file
                success, new_path, error = naming.rename_file(filepath, new_name)

                if success:
                    results['success'].append({
                        'old_path': filepath,
                        'new_path': new_path,
                        'new_name': new_name
                    })
                else:
                    results['failed'].append({
                        'file': filepath,
                        'error': error or 'Unknown error'
                    })

            except Exception as e:
                results['failed'].append({
                    'file': filepath,
                    'error': str(e)
                })

        return results

    def batch_update_metadata(
        self,
        files: List[str],
        metadata_updates: Dict[str, str],
        create_backup: bool = True
    ) -> Dict:
        """
        Update metadata for multiple files

        Args:
            files: List of file paths
            metadata_updates: Dictionary of metadata to update (artist, title, etc.)
            create_backup: Whether to create backup before updating

        Returns:
            Dictionary with results
        """
        if create_backup:
            backup_id = self.create_backup(files, 'batch_metadata_update')
        else:
            backup_id = None

        results = {
            'success': [],
            'failed': [],
            'backup_id': backup_id
        }

        for filepath in files:
            if not os.path.exists(filepath):
                results['failed'].append({
                    'file': filepath,
                    'error': 'File not found'
                })
                continue

            try:
                success = metadata.write_metadata(
                    filepath,
                    artist=metadata_updates.get('artist'),
                    title=metadata_updates.get('title'),
                    album=metadata_updates.get('album'),
                    year=metadata_updates.get('year'),
                    genre=metadata_updates.get('genre'),
                    albumartist=metadata_updates.get('albumartist')
                )

                if success:
                    results['success'].append({
                        'file': filepath,
                        'updates': metadata_updates
                    })
                else:
                    results['failed'].append({
                        'file': filepath,
                        'error': 'Failed to write metadata'
                    })

            except Exception as e:
                results['failed'].append({
                    'file': filepath,
                    'error': str(e)
                })

        return results

    def batch_auto_fix(
        self,
        files: List[str],
        fix_names: bool = True,
        fill_metadata: bool = True,
        create_backup: bool = True
    ) -> Dict:
        """
        Automatically fix issues in multiple files

        Args:
            files: List of file paths
            fix_names: Whether to rename files to standard format
            fill_metadata: Whether to fill missing metadata from filename
            create_backup: Whether to create backup before fixing

        Returns:
            Dictionary with results
        """
        if create_backup:
            backup_id = self.create_backup(files, 'batch_auto_fix')
        else:
            backup_id = None

        results = {
            'renamed': [],
            'metadata_updated': [],
            'failed': [],
            'backup_id': backup_id
        }

        for filepath in files:
            if not os.path.exists(filepath):
                results['failed'].append({
                    'file': filepath,
                    'error': 'File not found'
                })
                continue

            try:
                filename = os.path.basename(filepath)
                file_metadata = metadata.read_metadata(filepath)

                # Fix missing metadata from filename
                if fill_metadata and (not file_metadata.get('artist') or not file_metadata.get('title')):
                    artist, title = naming.extract_artist_and_title(filename)

                    if artist and title:
                        metadata.write_metadata(
                            filepath,
                            artist=artist if not file_metadata.get('artist') else file_metadata.get('artist'),
                            title=title if not file_metadata.get('title') else file_metadata.get('title')
                        )

                        results['metadata_updated'].append({
                            'file': filepath,
                            'artist': artist,
                            'title': title
                        })

                # Fix filename
                if fix_names:
                    # Re-read metadata after potential update
                    file_metadata = metadata.read_metadata(filepath)
                    new_name = naming.get_suggested_name(filename, file_metadata)

                    if new_name and new_name != filename:
                        success, new_path, error = naming.rename_file(filepath, new_name)

                        if success:
                            results['renamed'].append({
                                'old_path': filepath,
                                'new_path': new_path,
                                'new_name': new_name
                            })
                        else:
                            results['failed'].append({
                                'file': filepath,
                                'error': f'Rename failed: {error}'
                            })

            except Exception as e:
                results['failed'].append({
                    'file': filepath,
                    'error': str(e)
                })

        return results

    def get_backup_history(self) -> List[Dict]:
        """Get history of all backups"""
        if not os.path.exists(self.history_file):
            return []

        with open(self.history_file, 'r') as f:
            return json.load(f)


# Create singleton instance
batch_service = BatchService()
