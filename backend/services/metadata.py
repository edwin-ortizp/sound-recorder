"""
MP3 metadata reading and writing service
"""
import os
from typing import Dict, Optional
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3NoHeaderError
from mutagen.mp3 import MP3


def read_metadata(filepath: str) -> Dict[str, Optional[str]]:
    """
    Read ID3 metadata from MP3 file

    Args:
        filepath: Path to MP3 file

    Returns:
        Dictionary with metadata fields
    """
    if not os.path.exists(filepath):
        raise ValueError(f"File does not exist: {filepath}")

    try:
        # Try to read ID3 tags
        audio = EasyID3(filepath)

        # Also get duration
        mp3 = MP3(filepath)
        duration = mp3.info.length if mp3.info else None

        # Convert duration to string for consistent typing
        duration_str = str(round(duration, 2)) if duration else None

        return {
            "artist": audio.get("artist", [None])[0],
            "title": audio.get("title", [None])[0],
            "album": audio.get("album", [None])[0],
            "year": audio.get("date", [None])[0],
            "genre": audio.get("genre", [None])[0],
            "albumartist": audio.get("albumartist", [None])[0],
            "duration": duration_str,
        }
    except ID3NoHeaderError:
        # File has no ID3 tags
        return {
            "artist": None,
            "title": None,
            "album": None,
            "year": None,
            "genre": None,
            "albumartist": None,
            "duration": None,
        }
    except Exception as e:
        raise ValueError(f"Error reading metadata: {str(e)}")


def write_metadata(
    filepath: str,
    artist: Optional[str] = None,
    title: Optional[str] = None,
    album: Optional[str] = None,
    year: Optional[str] = None,
    genre: Optional[str] = None,
    albumartist: Optional[str] = None,
) -> bool:
    """
    Write ID3 metadata to MP3 file

    Args:
        filepath: Path to MP3 file
        artist: Artist name
        title: Song title
        album: Album name
        year: Year
        genre: Genre
        albumartist: Album artist

    Returns:
        True if successful
    """
    if not os.path.exists(filepath):
        raise ValueError(f"File does not exist: {filepath}")

    try:
        # Try to load existing tags, or create new ones
        try:
            audio = EasyID3(filepath)
        except ID3NoHeaderError:
            # Create new ID3 tag
            audio = EasyID3()

        # Update only provided fields
        if artist is not None:
            audio["artist"] = artist
        if title is not None:
            audio["title"] = title
        if album is not None:
            audio["album"] = album
        if year is not None:
            audio["date"] = year
        if genre is not None:
            audio["genre"] = genre
        if albumartist is not None:
            audio["albumartist"] = albumartist

        # Save to file
        audio.save(filepath)
        return True

    except Exception as e:
        raise ValueError(f"Error writing metadata: {str(e)}")


def has_complete_metadata(metadata: Dict[str, Optional[str]]) -> bool:
    """
    Check if metadata is complete (has artist and title at minimum)

    Args:
        metadata: Metadata dictionary

    Returns:
        True if has at least artist and title
    """
    return bool(metadata.get("artist") and metadata.get("title"))


def get_metadata_completeness(metadata: Dict[str, Optional[str]]) -> float:
    """
    Calculate metadata completeness percentage

    Args:
        metadata: Metadata dictionary

    Returns:
        Percentage of filled fields (0-100)
    """
    fields = ["artist", "title", "album", "year", "genre"]
    filled = sum(1 for field in fields if metadata.get(field))
    return (filled / len(fields)) * 100
