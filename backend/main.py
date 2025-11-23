"""
FastAPI backend for Sound Recorder & Music Library
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os

from services import scanner, metadata, naming


# Pydantic models for request/response
class ScanRequest(BaseModel):
    path: str = Field(..., description="Path to directory to scan")
    recursive: bool = Field(True, description="Whether to scan subdirectories")


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


class LibraryStats(BaseModel):
    total_files: int
    files_with_issues: int
    files_without_metadata: int


# Initialize FastAPI app
app = FastAPI(
    title="Sound Recorder & Music Library API",
    description="Backend API for managing audio recordings and music library",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sound Recorder & Music Library API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/scan", response_model=ScanResponse)
async def scan_directory_endpoint(request: ScanRequest):
    """
    Scan a directory for MP3 files and analyze them

    This endpoint will:
    1. Scan the directory for MP3 files
    2. Read metadata from each file
    3. Analyze filenames for issues
    4. Return complete file information
    """
    try:
        # Validate directory exists
        if not os.path.exists(request.path):
            raise HTTPException(status_code=404, detail="Directory not found")

        if not os.path.isdir(request.path):
            raise HTTPException(status_code=400, detail="Path is not a directory")

        # Scan for MP3 files
        mp3_files = scanner.scan_directory(request.path, request.recursive)

        # Process each file
        music_files = []
        for filepath in mp3_files:
            try:
                # Get file info
                file_info = scanner.get_file_info(filepath)

                # Read metadata
                file_metadata = metadata.read_metadata(filepath)

                # Analyze filename
                issues = naming.analyze_filename(file_info["filename"], file_metadata)

                # Get suggested name
                suggested = naming.get_suggested_name(file_info["filename"], file_metadata)

                # Create music file object
                music_file = MusicFile(
                    id=filepath,  # Using filepath as unique ID
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
                # Skip files that can't be processed
                print(f"Error processing {filepath}: {str(e)}")
                continue

        return ScanResponse(
            files=music_files,
            total=len(music_files)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/file/{filepath:path}")
async def get_file_info(filepath: str):
    """Get detailed information about a specific file"""
    try:
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        # Get file info
        file_info = scanner.get_file_info(filepath)

        # Read metadata
        file_metadata = metadata.read_metadata(filepath)

        # Analyze filename
        issues = naming.analyze_filename(file_info["filename"], file_metadata)

        # Get suggested name
        suggested = naming.get_suggested_name(file_info["filename"], file_metadata)

        return {
            **file_info,
            "metadata": file_metadata,
            "issues": issues,
            "suggested_name": suggested,
            "metadata_complete": metadata.has_complete_metadata(file_metadata),
            "metadata_completeness": metadata.get_metadata_completeness(file_metadata)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metadata/update")
async def update_metadata_endpoint(request: UpdateMetadataRequest):
    """
    Update ID3 metadata for a file

    This will write the new metadata to the MP3 file's ID3 tags
    """
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")

        # Update metadata
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
            # Return updated metadata
            updated_metadata = metadata.read_metadata(request.filepath)
            return {
                "success": True,
                "metadata": updated_metadata
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update metadata")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/file/rename")
async def rename_file_endpoint(request: RenameFileRequest):
    """
    Rename a file

    This will physically rename the file on the filesystem
    """
    try:
        if not os.path.exists(request.old_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Validate new name
        if not request.new_name.endswith('.mp3'):
            raise HTTPException(status_code=400, detail="New name must end with .mp3")

        # Rename file
        success, new_path, error = naming.rename_file(request.old_path, request.new_name)

        if success:
            return {
                "success": True,
                "old_path": request.old_path,
                "new_path": new_path
            }
        else:
            raise HTTPException(status_code=400, detail=error or "Failed to rename file")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stats", response_model=LibraryStats)
async def get_library_stats(request: ScanRequest):
    """
    Get statistics about a music library

    Returns counts of files with issues, missing metadata, etc.
    """
    try:
        # Scan directory
        mp3_files = scanner.scan_directory(request.path, request.recursive)

        total = len(mp3_files)
        with_issues = 0
        without_metadata = 0

        # Analyze each file
        for filepath in mp3_files:
            try:
                file_info = scanner.get_file_info(filepath)
                file_metadata = metadata.read_metadata(filepath)
                issues = naming.analyze_filename(file_info["filename"], file_metadata)

                if issues:
                    with_issues += 1

                if not metadata.has_complete_metadata(file_metadata):
                    without_metadata += 1

            except:
                continue

        return LibraryStats(
            total_files=total,
            files_with_issues=with_issues,
            files_without_metadata=without_metadata
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
