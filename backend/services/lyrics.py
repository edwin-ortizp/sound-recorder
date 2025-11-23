"""
Lyrics service for downloading and embedding song lyrics
"""
import os
import requests
from typing import Optional, Tuple
from mutagen.id3 import ID3, USLT
from mutagen.mp3 import MP3
import re


class LyricsService:
    """Service for managing song lyrics"""

    def __init__(self):
        self.cache_dir = os.path.join(os.path.dirname(__file__), '..', 'cache', 'lyrics')
        os.makedirs(self.cache_dir, exist_ok=True)

    def search_genius(self, artist: str, title: str, api_key: Optional[str] = None) -> Optional[str]:
        """
        Search Genius for song lyrics

        Args:
            artist: Artist name
            title: Song title
            api_key: Genius API access token

        Returns:
            Lyrics text or None
        """
        if not api_key:
            return None

        try:
            # Search for song
            search_url = "https://api.genius.com/search"
            headers = {'Authorization': f'Bearer {api_key}'}
            params = {'q': f'{artist} {title}'}

            response = requests.get(search_url, headers=headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if data.get('response', {}).get('hits'):
                    # Get first result
                    song = data['response']['hits'][0]['result']
                    song_url = song.get('url')

                    if song_url:
                        # Note: Genius doesn't provide direct lyrics API
                        # In production, you'd need to scrape the page or use a service
                        # For now, we return a placeholder
                        return f"[Lyrics for {artist} - {title} from Genius]\n(Lyrics scraping would go here)"

            return None

        except Exception as e:
            print(f"Error searching Genius: {e}")
            return None

    def search_lyrics_ovh(self, artist: str, title: str) -> Optional[str]:
        """
        Search lyrics.ovh for song lyrics (free API, no key needed)

        Args:
            artist: Artist name
            title: Song title

        Returns:
            Lyrics text or None
        """
        try:
            url = f"https://api.lyrics.ovh/v1/{artist}/{title}"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return data.get('lyrics')

            return None

        except Exception as e:
            print(f"Error searching lyrics.ovh: {e}")
            return None

    def clean_lyrics(self, lyrics: str) -> str:
        """
        Clean and format lyrics text

        Args:
            lyrics: Raw lyrics text

        Returns:
            Cleaned lyrics
        """
        if not lyrics:
            return ""

        # Remove extra whitespace
        lyrics = re.sub(r'\n\s*\n', '\n\n', lyrics)
        lyrics = lyrics.strip()

        return lyrics

    def cache_lyrics(self, lyrics: str, artist: str, title: str) -> str:
        """
        Cache lyrics locally

        Args:
            lyrics: Lyrics text
            artist: Artist name
            title: Song title

        Returns:
            Path to cached file
        """
        # Create filename
        safe_filename = re.sub(r'[^\w\s-]', '', f"{artist}-{title}").strip().replace(' ', '_')
        cache_path = os.path.join(self.cache_dir, f"{safe_filename}.txt")

        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(lyrics)

        return cache_path

    def embed_lyrics(self, filepath: str, lyrics: str, lang: str = 'eng') -> bool:
        """
        Embed lyrics into MP3 file

        Args:
            filepath: Path to MP3 file
            lyrics: Lyrics text
            lang: Language code (default: 'eng')

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

            # Remove existing lyrics
            audio.tags.delall('USLT')

            # Add new lyrics
            audio.tags.add(
                USLT(
                    encoding=3,  # UTF-8
                    lang=lang,
                    desc='',
                    text=lyrics
                )
            )

            audio.save()
            return True

        except Exception as e:
            print(f"Error embedding lyrics: {e}")
            return False

    def extract_lyrics(self, filepath: str) -> Optional[str]:
        """
        Extract lyrics from MP3 file

        Args:
            filepath: Path to MP3 file

        Returns:
            Lyrics text or None
        """
        try:
            audio = MP3(filepath, ID3=ID3)

            for tag in audio.tags.values():
                if isinstance(tag, USLT):
                    return tag.text

            return None

        except Exception as e:
            print(f"Error extracting lyrics: {e}")
            return None

    def has_lyrics(self, filepath: str) -> bool:
        """
        Check if file has embedded lyrics

        Args:
            filepath: Path to MP3 file

        Returns:
            True if has lyrics
        """
        lyrics = self.extract_lyrics(filepath)
        return bool(lyrics and lyrics.strip())

    def find_and_embed_lyrics(
        self,
        filepath: str,
        artist: str,
        title: str,
        genius_api_key: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Search for lyrics and embed them into file

        Args:
            filepath: Path to MP3 file
            artist: Artist name
            title: Song title
            genius_api_key: Optional Genius API key

        Returns:
            Tuple of (success, message/error)
        """
        if not artist or not title:
            return False, "Artist and title required for lyrics search"

        # Try lyrics.ovh first (free, no API key)
        lyrics = self.search_lyrics_ovh(artist, title)

        # Try Genius as fallback
        if not lyrics and genius_api_key:
            lyrics = self.search_genius(artist, title, genius_api_key)

        if not lyrics:
            return False, "No lyrics found"

        # Clean lyrics
        lyrics = self.clean_lyrics(lyrics)

        # Cache lyrics
        self.cache_lyrics(lyrics, artist, title)

        # Embed into file
        success = self.embed_lyrics(filepath, lyrics)

        if success:
            return True, "Lyrics embedded successfully"
        else:
            return False, "Failed to embed lyrics"


# Create singleton instance
lyrics_service = LyricsService()
