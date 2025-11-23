"""
Album artwork service for downloading and embedding cover art
"""
import os
import requests
from typing import Optional, Dict, Tuple
from mutagen.id3 import ID3, APIC
from mutagen.mp3 import MP3
import hashlib


class ArtworkService:
    """Service for managing album artwork"""

    def __init__(self):
        self.cache_dir = os.path.join(os.path.dirname(__file__), '..', 'cache', 'artwork')
        os.makedirs(self.cache_dir, exist_ok=True)

    def search_cover_art_archive(self, artist: str, album: str) -> Optional[str]:
        """
        Search MusicBrainz Cover Art Archive for album artwork

        Args:
            artist: Artist name
            album: Album name

        Returns:
            URL to cover art image or None
        """
        try:
            # Search MusicBrainz for release
            search_url = "https://musicbrainz.org/ws/2/release/"
            params = {
                'query': f'artist:"{artist}" AND release:"{album}"',
                'fmt': 'json',
                'limit': 1
            }
            headers = {
                'User-Agent': 'MusicLibraryOrganizer/1.0 (https://github.com/edwin-ortizp/sound-recorder)'
            }

            response = requests.get(search_url, params=params, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data.get('releases') and len(data['releases']) > 0:
                    release_id = data['releases'][0]['id']

                    # Get cover art
                    cover_url = f"https://coverartarchive.org/release/{release_id}/front"
                    cover_response = requests.head(cover_url, timeout=5)

                    if cover_response.status_code == 200:
                        return cover_url

            return None

        except Exception as e:
            print(f"Error searching Cover Art Archive: {e}")
            return None

    def search_lastfm(self, artist: str, album: str, api_key: Optional[str] = None) -> Optional[str]:
        """
        Search Last.fm for album artwork

        Args:
            artist: Artist name
            album: Album name
            api_key: Last.fm API key (optional, uses demo key if not provided)

        Returns:
            URL to cover art image or None
        """
        # Note: In production, users should provide their own API key
        # This is a placeholder that won't work without a real key
        if not api_key:
            return None

        try:
            url = "http://ws.audioscrobbler.com/2.0/"
            params = {
                'method': 'album.getinfo',
                'api_key': api_key,
                'artist': artist,
                'album': album,
                'format': 'json'
            }

            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if 'album' in data and 'image' in data['album']:
                    images = data['album']['image']
                    # Get largest image
                    for img in reversed(images):
                        if img.get('#text'):
                            return img['#text']

            return None

        except Exception as e:
            print(f"Error searching Last.fm: {e}")
            return None

    def download_artwork(self, url: str) -> Optional[bytes]:
        """
        Download artwork from URL

        Args:
            url: URL to image

        Returns:
            Image bytes or None
        """
        try:
            response = requests.get(url, timeout=15)

            if response.status_code == 200:
                # Verify it's an image
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    return response.content

            return None

        except Exception as e:
            print(f"Error downloading artwork: {e}")
            return None

    def cache_artwork(self, image_data: bytes, artist: str, album: str) -> str:
        """
        Cache artwork locally

        Args:
            image_data: Image bytes
            artist: Artist name
            album: Album name

        Returns:
            Path to cached file
        """
        # Create unique filename
        cache_key = hashlib.md5(f"{artist}-{album}".encode()).hexdigest()

        # Detect image format
        if image_data[:4] == b'\xff\xd8\xff\xe0' or image_data[:4] == b'\xff\xd8\xff\xe1':
            ext = 'jpg'
        elif image_data[:8] == b'\x89PNG\r\n\x1a\n':
            ext = 'png'
        else:
            ext = 'jpg'  # default

        cache_path = os.path.join(self.cache_dir, f"{cache_key}.{ext}")

        with open(cache_path, 'wb') as f:
            f.write(image_data)

        return cache_path

    def embed_artwork(self, filepath: str, image_data: bytes) -> bool:
        """
        Embed artwork into MP3 file

        Args:
            filepath: Path to MP3 file
            image_data: Image bytes

        Returns:
            True if successful
        """
        try:
            audio = MP3(filepath, ID3=ID3)

            # Add ID3 tag if it doesn't exist
            try:
                audio.add_tags()
            except:
                pass

            # Determine MIME type
            if image_data[:4] == b'\xff\xd8\xff\xe0' or image_data[:4] == b'\xff\xd8\xff\xe1':
                mime = 'image/jpeg'
            elif image_data[:8] == b'\x89PNG\r\n\x1a\n':
                mime = 'image/png'
            else:
                mime = 'image/jpeg'

            # Remove existing artwork
            audio.tags.delall('APIC')

            # Add new artwork
            audio.tags.add(
                APIC(
                    encoding=3,  # UTF-8
                    mime=mime,
                    type=3,  # Cover (front)
                    desc='Cover',
                    data=image_data
                )
            )

            audio.save()
            return True

        except Exception as e:
            print(f"Error embedding artwork: {e}")
            return False

    def extract_artwork(self, filepath: str) -> Optional[bytes]:
        """
        Extract artwork from MP3 file

        Args:
            filepath: Path to MP3 file

        Returns:
            Image bytes or None
        """
        try:
            audio = MP3(filepath, ID3=ID3)

            for tag in audio.tags.values():
                if isinstance(tag, APIC):
                    return tag.data

            return None

        except Exception as e:
            print(f"Error extracting artwork: {e}")
            return None

    def has_artwork(self, filepath: str) -> bool:
        """
        Check if file has embedded artwork

        Args:
            filepath: Path to MP3 file

        Returns:
            True if has artwork
        """
        return self.extract_artwork(filepath) is not None

    def find_and_embed_artwork(
        self,
        filepath: str,
        artist: str,
        album: str,
        lastfm_api_key: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Search for artwork and embed it into file

        Args:
            filepath: Path to MP3 file
            artist: Artist name
            album: Album name
            lastfm_api_key: Optional Last.fm API key

        Returns:
            Tuple of (success, message/error)
        """
        if not artist or not album:
            return False, "Artist and album required for artwork search"

        # Try Cover Art Archive first (free, no API key needed)
        artwork_url = self.search_cover_art_archive(artist, album)

        # Try Last.fm as fallback
        if not artwork_url and lastfm_api_key:
            artwork_url = self.search_lastfm(artist, album, lastfm_api_key)

        if not artwork_url:
            return False, "No artwork found"

        # Download artwork
        image_data = self.download_artwork(artwork_url)

        if not image_data:
            return False, "Failed to download artwork"

        # Cache artwork
        self.cache_artwork(image_data, artist, album)

        # Embed into file
        success = self.embed_artwork(filepath, image_data)

        if success:
            return True, "Artwork embedded successfully"
        else:
            return False, "Failed to embed artwork"


# Create singleton instance
artwork_service = ArtworkService()
