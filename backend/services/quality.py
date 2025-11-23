"""
Audio quality analysis service
"""
import os
from mutagen.mp3 import MP3
from typing import Dict, List, Optional


class QualityService:
    """Service for analyzing audio quality"""

    # Quality thresholds (kbps)
    QUALITY_EXCELLENT = 320
    QUALITY_GOOD = 192
    QUALITY_ACCEPTABLE = 128
    QUALITY_LOW = 96

    def analyze_file(self, filepath: str) -> Dict:
        """
        Analyze audio quality of a file

        Args:
            filepath: Path to audio file

        Returns:
            Dictionary with quality information
        """
        try:
            audio = MP3(filepath)

            bitrate = audio.info.bitrate / 1000  # Convert to kbps
            sample_rate = audio.info.sample_rate
            channels = audio.info.channels
            length = audio.info.length

            # Determine quality rating
            if bitrate >= self.QUALITY_EXCELLENT:
                quality = "excellent"
                rating = 5
            elif bitrate >= self.QUALITY_GOOD:
                quality = "good"
                rating = 4
            elif bitrate >= self.QUALITY_ACCEPTABLE:
                quality = "acceptable"
                rating = 3
            elif bitrate >= self.QUALITY_LOW:
                quality = "low"
                rating = 2
            else:
                quality = "very_low"
                rating = 1

            return {
                "bitrate_kbps": round(bitrate, 2),
                "sample_rate_hz": sample_rate,
                "channels": channels,
                "duration_seconds": round(length, 2),
                "quality_rating": quality,
                "quality_score": rating,
                "is_high_quality": bitrate >= self.QUALITY_GOOD,
                "needs_upgrade": bitrate < self.QUALITY_ACCEPTABLE,
                "file_size_mb": round(os.path.getsize(filepath) / (1024 * 1024), 2)
            }

        except Exception as e:
            return {
                "error": str(e),
                "quality_rating": "unknown",
                "quality_score": 0
            }

    def find_low_quality_files(self, files: List[str], threshold_kbps: int = 128) -> List[Dict]:
        """Find files below quality threshold"""
        low_quality = []

        for filepath in files:
            quality_info = self.analyze_file(filepath)

            if quality_info.get("bitrate_kbps", 0) < threshold_kbps:
                low_quality.append({
                    "filepath": filepath,
                    "filename": os.path.basename(filepath),
                    **quality_info
                })

        return low_quality


quality_service = QualityService()
