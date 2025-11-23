# Backend - Sound Recorder & Music Library API

API REST desarrollada con FastAPI para la gestión de bibliotecas musicales.

## 🚀 Quick Start

```bash
# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python main.py

# El servidor estará disponible en http://localhost:8000
```

## 📁 Estructura

```
backend/
├── main.py              # Aplicación FastAPI principal
├── requirements.txt     # Dependencias de Python
└── services/
    ├── scanner.py       # Escaneo de directorios
    ├── metadata.py      # Lectura/escritura de tags ID3
    └── naming.py        # Análisis de nomenclatura
```

## 🔧 Servicios

### Scanner (`services/scanner.py`)

Escaneo recursivo de directorios para encontrar archivos MP3.

```python
from services import scanner

files = scanner.scan_directory("/path/to/music", recursive=True)
file_info = scanner.get_file_info("/path/to/song.mp3")
```

### Metadata (`services/metadata.py`)

Lectura y escritura de tags ID3 usando Mutagen.

```python
from services import metadata

# Leer metadatos
tags = metadata.read_metadata("/path/to/song.mp3")

# Escribir metadatos
metadata.write_metadata(
    "/path/to/song.mp3",
    artist="The Beatles",
    title="Yesterday"
)
```

### Naming (`services/naming.py`)

Análisis de nombres de archivo y detección de problemas.

```python
from services import naming

# Generar nombre estándar
name = naming.generate_standard_name("The Beatles", "Yesterday")
# Resultado: "The Beatles - Yesterday.mp3"

# Analizar archivo
issues = naming.analyze_filename("song.mp3", metadata)

# Renombrar archivo
success, new_path, error = naming.rename_file(old_path, new_name)
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Respuesta:
```json
{
  "status": "healthy"
}
```

### Escanear Directorio

```http
POST /api/scan
Content-Type: application/json

{
  "path": "/home/user/Music",
  "recursive": true
}
```

Respuesta:
```json
{
  "files": [
    {
      "id": "/path/to/file.mp3",
      "path": "/path/to/file.mp3",
      "filename": "song.mp3",
      "directory": "/path/to",
      "size": 5242880,
      "metadata": {
        "artist": "The Beatles",
        "title": "Yesterday",
        "album": "Help!",
        "year": "1965",
        "genre": "Rock",
        "duration": 125.5
      },
      "issues": [],
      "suggested_name": "The Beatles - Yesterday.mp3"
    }
  ],
  "total": 1
}
```

### Obtener Info de Archivo

```http
GET /api/file/{filepath}
```

### Actualizar Metadatos

```http
POST /api/metadata/update
Content-Type: application/json

{
  "filepath": "/path/to/song.mp3",
  "artist": "The Beatles",
  "title": "Yesterday",
  "album": "Help!",
  "year": "1965",
  "genre": "Rock"
}
```

### Renombrar Archivo

```http
POST /api/file/rename
Content-Type: application/json

{
  "old_path": "/path/to/song.mp3",
  "new_name": "The Beatles - Yesterday.mp3"
}
```

### Estadísticas

```http
POST /api/stats
Content-Type: application/json

{
  "path": "/home/user/Music",
  "recursive": true
}
```

Respuesta:
```json
{
  "total_files": 1247,
  "files_with_issues": 89,
  "files_without_metadata": 34
}
```

## 🛠️ Desarrollo

### Ejecutar en Modo Desarrollo

```bash
# Con auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Documentación Interactiva

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Tests

```bash
# Instalar dependencias de desarrollo
pip install pytest pytest-cov

# Ejecutar tests
pytest

# Con cobertura
pytest --cov=services --cov-report=html
```

## 🔒 Seguridad

### CORS

El servidor permite peticiones desde:
- http://localhost:5173 (Vite dev)
- http://localhost:3000
- http://127.0.0.1:5173
- http://127.0.0.1:3000

Para modificar, editar `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        # Agregar más orígenes aquí
    ],
    ...
)
```

### Validación de Rutas

El backend valida:
- Existencia de directorios y archivos
- Permisos de lectura/escritura
- Extensiones de archivo (.mp3)

## 📦 Dependencias

```txt
fastapi==0.115.5       # Framework web
uvicorn[standard]      # Servidor ASGI
mutagen==1.47.0        # Lectura/escritura de tags ID3
python-multipart       # Soporte para form data
pydantic==2.10.3       # Validación de datos
```

## 🐛 Debugging

### Activar logs detallados

```bash
uvicorn main:app --reload --log-level debug
```

### Verificar salud del servicio

```bash
curl http://localhost:8000/health
```

## 📝 Notas

- Solo soporta archivos MP3 actualmente
- Requiere Python 3.11 o superior
- Usa Mutagen para tags ID3 (soporta ID3v1, ID3v2.3, ID3v2.4)
- Los cambios a archivos son permanentes (se escriben al disco)
