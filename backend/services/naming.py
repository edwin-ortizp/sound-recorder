"""
File naming standard service
"""
import os
import re
from typing import List, Dict, Optional, Tuple
from pathlib import Path


# Standard format: "Artist - Title.mp3"
STANDARD_PATTERN = re.compile(r'^(.+?)\s*-\s*(.+?)\.mp3$', re.IGNORECASE)

# Invalid characters for filenames
INVALID_CHARS = re.compile(r'[/\\?%*:|"<>]')


def to_title_case(text: str) -> str:
    """
    Convert text to Title Case

    Args:
        text: Input text

    Returns:
        Text in Title Case
    """
    return text.strip().title()


def sanitize_filename(name: str) -> str:
    """
    Remove invalid characters and normalize spacing
    Preserves apostrophes and other valid punctuation

    Args:
        name: Filename or part of filename

    Returns:
        Sanitized string
    """
    # Remove invalid characters (but keep apostrophes, commas, periods, etc.)
    sanitized = INVALID_CHARS.sub('', name)

    # Normalize spaces
    sanitized = re.sub(r'\s+', ' ', sanitized)

    return sanitized.strip()


def generate_standard_name(artist: Optional[str], title: Optional[str]) -> Optional[str]:
    """
    Generate standardized filename from artist and title
    PRESERVES original capitalization (no forced Title Case)

    Args:
        artist: Artist name
        title: Song title

    Returns:
        Standardized filename or None if missing data
    """
    if not artist or not title:
        return None

    # Just sanitize, don't change capitalization
    artist_clean = sanitize_filename(artist)
    title_clean = sanitize_filename(title)

    return f"{artist_clean} - {title_clean}.mp3"


def matches_standard_pattern(filename: str) -> bool:
    """
    Check if filename matches standard pattern

    Args:
        filename: Filename to check

    Returns:
        True if matches "Artist - Title.mp3" pattern
    """
    return bool(STANDARD_PATTERN.match(filename))


def extract_artist_and_title(filename: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract artist and title from filename

    Args:
        filename: Filename to parse

    Returns:
        Tuple of (artist, title) or (None, None) if can't parse
    """
    match = STANDARD_PATTERN.match(filename)

    if match:
        return match.group(1).strip(), match.group(2).strip()

    return None, None


def normalize_for_comparison(text: str) -> str:
    """
    Normalize text for flexible comparison
    - Lowercase
    - Remove extra spaces
    - Remove certain punctuation variations

    Args:
        text: Text to normalize

    Returns:
        Normalized text
    """
    normalized = text.lower().strip()
    # Normalize multiple spaces to single space
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized


def analyze_filename(
    filename: str,
    metadata: Dict[str, Optional[str]]
) -> List[Dict[str, str]]:
    """
    Analyze filename and metadata for issues
    Uses FLEXIBLE comparison to avoid false positives

    Args:
        filename: Filename to analyze
        metadata: Metadata dictionary

    Returns:
        List of issues found
    """
    issues = []

    artist = metadata.get("artist")
    title = metadata.get("title")

    # Check for missing metadata
    if not artist:
        issues.append({
            "type": "no_artist",
            "severity": "high",
            "description": "Falta información del artista en los metadatos"
        })

    if not title:
        issues.append({
            "type": "no_title",
            "severity": "high",
            "description": "Falta el título de la canción en los metadatos"
        })

    # Check if file has metadata but name doesn't match standard (FLEXIBLE comparison)
    if artist and title:
        expected_name = generate_standard_name(artist, title)
        if expected_name:
            # Flexible comparison: normalize both names
            filename_normalized = normalize_for_comparison(filename)
            expected_normalized = normalize_for_comparison(expected_name)

            # Only flag if they're significantly different
            # Allow for minor variations in spacing, capitalization, etc.
            if filename_normalized != expected_normalized:
                # Additional check: does the filename at least contain artist and title?
                filename_lower = filename.lower()
                artist_lower = artist.lower()
                title_lower = title.lower()

                # If filename contains both artist and title, it's probably OK
                if artist_lower in filename_lower and title_lower in filename_lower:
                    # It's close enough, don't flag it
                    pass
                else:
                    issues.append({
                        "type": "no_standard",
                        "severity": "low",  # Reduced severity
                        "description": "El nombre no sigue el formato estándar 'Artista - Título.mp3'"
                    })

    # Check for invalid characters
    if INVALID_CHARS.search(filename):
        issues.append({
            "type": "invalid_chars",
            "severity": "high",
            "description": "El nombre contiene caracteres inválidos"
        })

    # Check if metadata is completely missing
    if not artist and not title and not metadata.get("album"):
        issues.append({
            "type": "missing_metadata",
            "severity": "high",
            "description": "El archivo no tiene metadatos ID3"
        })

    return issues


def get_suggested_name(
    filename: str,
    metadata: Dict[str, Optional[str]]
) -> Optional[str]:
    """
    Get suggested standardized filename

    Args:
        filename: Current filename
        metadata: Metadata dictionary

    Returns:
        Suggested filename or None
    """
    artist = metadata.get("artist")
    title = metadata.get("title")

    # First try to generate from metadata
    if artist and title:
        return generate_standard_name(artist, title)

    # If no metadata, try to extract from filename
    extracted_artist, extracted_title = extract_artist_and_title(filename)
    if extracted_artist and extracted_title:
        return generate_standard_name(extracted_artist, extracted_title)

    return None


def rename_file(old_path: str, new_name: str) -> Tuple[bool, str, Optional[str]]:
    """
    Rename a file

    Args:
        old_path: Current file path
        new_name: New filename (just the name, not full path)

    Returns:
        Tuple of (success, new_path, error_message)
    """
    if not os.path.exists(old_path):
        return False, old_path, "File does not exist"

    try:
        directory = os.path.dirname(old_path)
        new_path = os.path.join(directory, new_name)

        # Check if target already exists
        if os.path.exists(new_path):
            return False, old_path, "A file with that name already exists"

        # Rename
        os.rename(old_path, new_path)

        return True, new_path, None

    except Exception as e:
        return False, old_path, str(e)
