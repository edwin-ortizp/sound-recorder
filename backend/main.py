"""
FastAPI backend for Sound Recorder & Music Library
Version 2.0 - Full Featured
"""
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os

from services import scanner, metadata, naming, export, batch, quality, organization
from services.artwork import artwork_service
from services.lyrics import lyrics_service


# ============================================================================
# Pydantic Models
# ============================================================================

class ScanRequest(BaseModel):
    path: str
    recursive: bool = True


class MusicFile(BaseModel):
    id: str
    path: str
    filename: str
    directory: str
    size: int
    metadata: Dict[str, Optional[str]]
    issues: List[Dict[str, str]]
    suggested_name: Optional[str]


class ScanResponse(BaseModel):
    files: List[MusicFile]
    total: int


class UpdateMetadataRequest(BaseModel):
    filepath: str
    artist: Optional[str] = None
    title: Optional[str] = None
    album: Optional[str] = None
    year: Optional[str] = None
    genre: Optional[str] = None
    albumartist: Optional[str] = None


class RenameFileRequest(BaseModel):
    old_path: str
    new_name: str


class BatchRenameRequest(BaseModel):
    files: List[str]
    use_suggestions: bool = True
    create_backup: bool = True


class BatchMetadataRequest(BaseModel):
    files: List[str]
    metadata: Dict[str, str]
    create_backup: bool = True


class BatchAutoFixRequest(BaseModel):
    files: List[str]
    fix_names: bool = True
    fill_metadata: bool = True
    create_backup: bool = True


class ArtworkRequest(BaseModel):
    filepath: str
    artist: str
    album: str
    lastfm_api_key: Optional[str] = None


class LyricsRequest(BaseModel):
    filepath: str
    artist: str
    title: str
    genius_api_key: Optional[str] = None


class ExportRequest(BaseModel):
    files: List[Dict]
    format: str  # txt, csv, json, issues
    include_issues: bool = True


class OrganizeRequest(BaseModel):
    files: List[str]
    target_dir: str
    pattern: str = "{artist}/{album}/{filename}"
    copy_mode: bool = True
    create_backup: bool = True


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="Sound Recorder & Music Library API",
    description="Backend API for managing audio recordings and music library",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Basic Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "Sound Recorder & Music Library API v2.0",
        "version": "2.0.0",
        "features": [
            "Music library scanning",
            "Metadata editing",
            "Album artwork download/embedding",
            "Lyrics download/embedding",
            "Batch operations",
            "Export (TXT, CSV, JSON)",
            "Quality analysis",
            "Library organization",
            "Backup/restore"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


# ============================================================================
# Scanning & Basic Operations
# ============================================================================

@app.post("/api/scan", response_model=ScanResponse)
async def scan_directory_endpoint(request: ScanRequest):
    """Scan directory for MP3 files and analyze them"""
    try:
        if not os.path.exists(request.path):
            raise HTTPException(status_code=404, detail="Directory not found")

        mp3_files = scanner.scan_directory(request.path, request.recursive)
        music_files = []

        for filepath in mp3_files:
            try:
                file_info = scanner.get_file_info(filepath)
                file_metadata = metadata.read_metadata(filepath)
                issues = naming.analyze_filename(file_info["filename"], file_metadata)
                suggested = naming.get_suggested_name(file_info["filename"], file_metadata)

                music_file = MusicFile(
                    id=filepath,
                    path=file_info["path"],
                    filename=file_info["filename"],
                    directory=file_info["directory"],
                    size=file_info["size"],
                    metadata=file_metadata,
                    issues=issues,
                    suggested_name=suggested
                )
                music_files.append(music_file)
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
                continue

        return ScanResponse(files=music_files, total=len(music_files))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metadata/update")
async def update_metadata_endpoint(request: UpdateMetadataRequest):
    """Update ID3 metadata for a file"""
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")

        success = metadata.write_metadata(
            request.filepath,
            artist=request.artist,
            title=request.title,
            album=request.album,
            year=request.year,
            genre=request.genre,
            albumartist=request.albumartist
        )

        if success:
            updated_metadata = metadata.read_metadata(request.filepath)
            return {"success": True, "metadata": updated_metadata}
        else:
            raise HTTPException(status_code=500, detail="Failed to update metadata")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/file/rename")
async def rename_file_endpoint(request: RenameFileRequest):
    """Rename a file"""
    try:
        if not os.path.exists(request.old_path):
            raise HTTPException(status_code=404, detail="File not found")

        success, new_path, error = naming.rename_file(request.old_path, request.new_name)

        if success:
            return {"success": True, "old_path": request.old_path, "new_path": new_path}
        else:
            raise HTTPException(status_code=400, detail=error or "Failed to rename file")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Artwork & Lyrics
# ============================================================================

@app.post("/api/artwork/search")
async def search_artwork(request: ArtworkRequest):
    """Search for album artwork"""
    try:
        artwork_url = artwork_service.search_cover_art_archive(request.artist, request.album)

        if not artwork_url and request.lastfm_api_key:
            artwork_url = artwork_service.search_lastfm(
                request.artist,
                request.album,
                request.lastfm_api_key
            )

        if artwork_url:
            return {"success": True, "artwork_url": artwork_url}
        else:
            return {"success": False, "message": "No artwork found"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/artwork/embed")
async def embed_artwork(request: ArtworkRequest):
    """Search and embed artwork into file"""
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")

        success, message = artwork_service.find_and_embed_artwork(
            request.filepath,
            request.artist,
            request.album,
            request.lastfm_api_key
        )

        return {"success": success, "message": message}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/artwork/extract/{filepath:path}")
async def extract_artwork(filepath: str):
    """Extract artwork from file"""
    try:
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        artwork_data = artwork_service.extract_artwork(filepath)

        if artwork_data:
            return Response(content=artwork_data, media_type="image/jpeg")
        else:
            raise HTTPException(status_code=404, detail="No artwork found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lyrics/search")
async def search_lyrics(request: LyricsRequest):
    """Search for song lyrics"""
    try:
        lyrics = lyrics_service.search_lyrics_ovh(request.artist, request.title)

        if not lyrics and request.genius_api_key:
            lyrics = lyrics_service.search_genius(
                request.artist,
                request.title,
                request.genius_api_key
            )

        if lyrics:
            return {"success": True, "lyrics": lyrics}
        else:
            return {"success": False, "message": "No lyrics found"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lyrics/embed")
async def embed_lyrics(request: LyricsRequest):
    """Search and embed lyrics into file"""
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")

        success, message = lyrics_service.find_and_embed_lyrics(
            request.filepath,
            request.artist,
            request.title,
            request.genius_api_key
        )

        return {"success": success, "message": message}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Batch Operations
# ============================================================================

@app.post("/api/batch/rename")
async def batch_rename(request: BatchRenameRequest):
    """Batch rename files"""
    try:
        results = batch.batch_service.batch_rename(
            request.files,
            use_suggestions=request.use_suggestions,
            create_backup=request.create_backup
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/batch/metadata")
async def batch_metadata(request: BatchMetadataRequest):
    """Batch update metadata"""
    try:
        results = batch.batch_service.batch_update_metadata(
            request.files,
            request.metadata,
            request.create_backup
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/batch/autofix")
async def batch_autofix(request: BatchAutoFixRequest):
    """Automatically fix issues in files"""
    try:
        results = batch.batch_service.batch_auto_fix(
            request.files,
            request.fix_names,
            request.fill_metadata,
            request.create_backup
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/batch/history")
async def get_batch_history():
    """Get backup history"""
    try:
        history = batch.batch_service.get_backup_history()
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/batch/restore/{backup_id}")
async def restore_backup(backup_id: str):
    """Restore from backup"""
    try:
        success, message = batch.batch_service.restore_backup(backup_id)
        return {"success": success, "message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Export & Statistics
# ============================================================================

@app.post("/api/export")
async def export_library(request: ExportRequest):
    """Export library to various formats"""
    try:
        if request.format == "txt":
            content = export.export_service.export_to_txt(
                request.files,
                request.include_issues
            )
            return Response(content=content, media_type="text/plain")

        elif request.format == "csv":
            content = export.export_service.export_to_csv(request.files)
            return Response(content=content, media_type="text/csv")

        elif request.format == "json":
            content = export.export_service.export_to_json(request.files)
            return Response(content=content, media_type="application/json")

        elif request.format == "issues":
            content = export.export_service.export_issues_report(request.files)
            return Response(content=content, media_type="text/plain")

        else:
            raise HTTPException(status_code=400, detail="Invalid format")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/statistics")
async def get_statistics(request: ExportRequest):
    """Get library statistics"""
    try:
        stats = export.export_service.export_statistics(request.files)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Quality Analysis
# ============================================================================

@app.get("/api/quality/analyze/{filepath:path}")
async def analyze_quality(filepath: str):
    """Analyze audio quality of a file"""
    try:
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        quality_info = quality.quality_service.analyze_file(filepath)
        return quality_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quality/find-low")
async def find_low_quality(files: List[str], threshold: int = 128):
    """Find low quality files"""
    try:
        low_quality = quality.quality_service.find_low_quality_files(files, threshold)
        return {"low_quality_files": low_quality, "count": len(low_quality)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Library Organization
# ============================================================================

@app.post("/api/organize/preview")
async def preview_organization(files: List[str], pattern: str = "{artist}/{album}"):
    """Preview folder structure without organizing"""
    try:
        preview = organization.organization_service.get_folder_structure_preview(
            files,
            pattern
        )
        return preview
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/organize")
async def organize_library(request: OrganizeRequest):
    """Organize library into folder structure"""
    try:
        results = organization.organization_service.organize_library(
            request.files,
            request.target_dir,
            request.pattern,
            request.copy_mode,
            request.create_backup
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
