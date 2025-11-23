"""
Export service for generating reports in various formats
"""
import os
import csv
import json
from typing import List, Dict, Optional
from datetime import datetime
import io


class ExportService:
    """Service for exporting library data to various formats"""

    def __init__(self):
        self.export_dir = os.path.join(os.path.dirname(__file__), '..', 'exports')
        os.makedirs(self.export_dir, exist_ok=True)

    def export_to_txt(self, files: List[Dict], include_issues: bool = True) -> str:
        """
        Export library to plain text format

        Args:
            files: List of music files
            include_issues: Whether to include issues in output

        Returns:
            Text content
        """
        lines = []
        lines.append("=" * 80)
        lines.append("MUSIC LIBRARY REPORT")
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"Total Files: {len(files)}")
        lines.append("=" * 80)
        lines.append("")

        for i, file in enumerate(files, 1):
            lines.append(f"{i}. {file['filename']}")
            lines.append(f"   Path: {file['path']}")

            metadata = file.get('metadata', {})
            if metadata.get('artist'):
                lines.append(f"   Artist: {metadata['artist']}")
            if metadata.get('title'):
                lines.append(f"   Title: {metadata['title']}")
            if metadata.get('album'):
                lines.append(f"   Album: {metadata['album']}")
            if metadata.get('year'):
                lines.append(f"   Year: {metadata['year']}")

            if include_issues and file.get('issues'):
                lines.append(f"   ⚠ Issues: {len(file['issues'])}")
                for issue in file['issues']:
                    lines.append(f"     - {issue['description']}")

            if file.get('suggested_name'):
                lines.append(f"   💡 Suggested: {file['suggested_name']}")

            lines.append("")

        return '\n'.join(lines)

    def export_to_csv(self, files: List[Dict]) -> str:
        """
        Export library to CSV format

        Args:
            files: List of music files

        Returns:
            CSV content
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            'Filename',
            'Path',
            'Artist',
            'Title',
            'Album',
            'Year',
            'Genre',
            'Duration (s)',
            'Size (bytes)',
            'Has Issues',
            'Issues Count',
            'Suggested Name'
        ])

        # Data
        for file in files:
            metadata = file.get('metadata', {})
            writer.writerow([
                file.get('filename', ''),
                file.get('path', ''),
                metadata.get('artist', ''),
                metadata.get('title', ''),
                metadata.get('album', ''),
                metadata.get('year', ''),
                metadata.get('genre', ''),
                metadata.get('duration', ''),
                file.get('size', ''),
                'Yes' if file.get('issues') else 'No',
                len(file.get('issues', [])),
                file.get('suggested_name', '')
            ])

        return output.getvalue()

    def export_to_json(self, files: List[Dict], pretty: bool = True) -> str:
        """
        Export library to JSON format

        Args:
            files: List of music files
            pretty: Whether to format JSON with indentation

        Returns:
            JSON content
        """
        data = {
            'generated': datetime.now().isoformat(),
            'total_files': len(files),
            'files': files
        }

        if pretty:
            return json.dumps(data, indent=2, ensure_ascii=False)
        else:
            return json.dumps(data, ensure_ascii=False)

    def export_issues_report(self, files: List[Dict]) -> str:
        """
        Export report of files with issues only

        Args:
            files: List of music files

        Returns:
            Text content
        """
        files_with_issues = [f for f in files if f.get('issues')]

        lines = []
        lines.append("=" * 80)
        lines.append("MUSIC LIBRARY - ISSUES REPORT")
        lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"Total Files: {len(files)}")
        lines.append(f"Files with Issues: {len(files_with_issues)}")
        lines.append("=" * 80)
        lines.append("")

        # Group by issue type
        issue_types = {}
        for file in files_with_issues:
            for issue in file.get('issues', []):
                issue_type = issue['type']
                if issue_type not in issue_types:
                    issue_types[issue_type] = []
                issue_types[issue_type].append(file)

        # Print summary
        lines.append("ISSUES SUMMARY:")
        lines.append("-" * 80)
        for issue_type, affected_files in issue_types.items():
            lines.append(f"{issue_type}: {len(affected_files)} files")
        lines.append("")

        # Print detailed issues
        lines.append("DETAILED ISSUES:")
        lines.append("-" * 80)
        for i, file in enumerate(files_with_issues, 1):
            lines.append(f"{i}. {file['filename']}")
            lines.append(f"   Path: {file['path']}")
            lines.append(f"   Issues:")
            for issue in file.get('issues', []):
                lines.append(f"     - [{issue['severity'].upper()}] {issue['description']}")
            if file.get('suggested_name'):
                lines.append(f"   💡 Suggested fix: {file['suggested_name']}")
            lines.append("")

        return '\n'.join(lines)

    def export_statistics(self, files: List[Dict]) -> Dict:
        """
        Generate library statistics

        Args:
            files: List of music files

        Returns:
            Statistics dictionary
        """
        total = len(files)
        with_issues = len([f for f in files if f.get('issues')])
        without_metadata = len([f for f in files if not f.get('metadata', {}).get('artist')])

        # Genre distribution
        genres = {}
        for file in files:
            genre = file.get('metadata', {}).get('genre')
            if genre:
                genres[genre] = genres.get(genre, 0) + 1

        # Year distribution
        years = {}
        for file in files:
            year = file.get('metadata', {}).get('year')
            if year:
                years[year] = years.get(year, 0) + 1

        # Issue types distribution
        issue_types = {}
        for file in files:
            for issue in file.get('issues', []):
                issue_type = issue['type']
                issue_types[issue_type] = issue_types.get(issue_type, 0) + 1

        return {
            'total_files': total,
            'files_with_issues': with_issues,
            'files_without_metadata': without_metadata,
            'health_percentage': ((total - with_issues) / total * 100) if total > 0 else 0,
            'genre_distribution': genres,
            'year_distribution': years,
            'issue_types_distribution': issue_types,
            'top_genres': sorted(genres.items(), key=lambda x: x[1], reverse=True)[:10],
            'generated': datetime.now().isoformat()
        }

    def save_export(self, content: str, filename: str) -> str:
        """
        Save export to file

        Args:
            content: Content to save
            filename: Filename

        Returns:
            Full path to saved file
        """
        filepath = os.path.join(self.export_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        return filepath


# Create singleton instance
export_service = ExportService()
