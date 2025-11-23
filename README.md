# 🎵 Sound Recorder & Music Library

Una aplicación completa para grabar audio y organizar tu biblioteca musical con detección inteligente de problemas de nomenclatura y metadatos.

## 🚀 Características

### 🎙️ Grabador de Audio
- Grabación de audio desde el micrófono
- Selección de dispositivo de entrada
- Visualización del nivel de volumen en tiempo real
- Descarga de grabaciones
- Lista de grabaciones con reproducción

### 🎵 Organizador de Biblioteca Musical
- **Escaneo de directorio**: Explora recursivamente tu biblioteca de música
- **Lectura de metadatos**: Extrae tags ID3 de archivos MP3
- **Detección de problemas**: Identifica archivos mal nombrados o sin metadatos
- **Edición de tags**: Modifica metadatos directamente en los archivos
- **Renombrado de archivos**: Aplica estándar de nomenclatura "Artista - Título.mp3"
- **Estadísticas**: Visualiza la salud de tu biblioteca
- **Sugerencias automáticas**: Recomienda nombres basados en metadatos

## 🏗️ Arquitectura

```
sound-recorder/
├── backend/          # FastAPI (Python)
│   ├── services/     # Lógica de negocio
│   └── main.py       # API endpoints
│
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── features/
│       │   ├── recorder/        # Grabador de audio
│       │   └── music-library/   # Organizador de música
│       └── components/
```

**Stack Tecnológico:**
- **Backend**: Python 3.11+, FastAPI, Mutagen (tags ID3)
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui

## 📦 Instalación

### Requisitos Previos

- **Python**: 3.11 o superior
- **Node.js**: 18 o superior
- **npm** o **yarn**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/edwin-ortizp/sound-recorder.git
cd sound-recorder
```

### 2. Configurar el Backend (Python)

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar el Frontend (React)

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de configuración (opcional)
cp .env.example .env
```

## 🚀 Uso

### Iniciar el Backend

```bash
cd backend

# Activar entorno virtual si no está activo
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Iniciar servidor FastAPI
python main.py

# El servidor estará disponible en http://localhost:8000
# Documentación API: http://localhost:8000/docs
```

### Iniciar el Frontend

```bash
cd frontend

# Modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Usar la Aplicación

1. **Abrir el navegador**: http://localhost:5173
2. **Grabador de Audio**:
   - Pestaña "Grabador"
   - Activar micrófono y grabar
3. **Biblioteca Musical**:
   - Pestaña "Biblioteca Musical"
   - Ingresar ruta del directorio (ej: `/home/user/Music` o `C:\Users\User\Music`)
   - Click en "Escanear Biblioteca"
   - Ver archivos con problemas
   - Editar metadatos o renombrar archivos

## 📖 API Documentation

Una vez que el backend esté corriendo, visita:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints Principales

```
POST /api/scan          - Escanear directorio de música
GET  /api/file/{path}   - Obtener info de un archivo
POST /api/metadata/update - Actualizar tags ID3
POST /api/file/rename   - Renombrar archivo
POST /api/stats         - Estadísticas de biblioteca
```

## 🛠️ Desarrollo

### Backend

```bash
cd backend

# Modo desarrollo con auto-reload
uvicorn main:app --reload

# Tests (si implementados)
pytest

# Linting
black .
flake8
```

### Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🎯 Estándar de Nomenclatura

El organizador aplica el siguiente estándar:

```
Formato: Artista - Título De La Canción.mp3

Reglas:
✅ Title Case para artista y título
✅ Separador: " - " (espacio-guión-espacio)
✅ Sin caracteres especiales: / \ ? % * : | " < >
✅ Espacios normalizados
```

**Ejemplos:**
```
❌ song.mp3
✅ The Beatles - Yesterday.mp3

❌ 01-track.mp3
✅ Pink Floyd - Wish You Were Here.mp3

❌ Artist/Song Name.mp3
✅ Artist - Song Name.mp3
```

## 🔧 Configuración

### Variables de Entorno (Frontend)

Crear `/frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
```

### Configuración de CORS (Backend)

Editar `/backend/main.py` para agregar orígenes permitidos:

```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    # Agregar más orígenes aquí
]
```

## 🐛 Troubleshooting

### Backend no arranca

```bash
# Verificar que Python 3.11+ esté instalado
python --version

# Reinstalar dependencias
pip install --force-reinstall -r requirements.txt
```

### Frontend no puede conectarse al backend

1. Verificar que el backend esté corriendo: http://localhost:8000/health
2. Verificar CORS en `backend/main.py`
3. Verificar `VITE_API_URL` en `.env`

### "Directory not found" al escanear

- Verificar que la ruta sea absoluta
- En Windows, usar barras invertidas: `C:\Users\User\Music`
- Verificar permisos de lectura del directorio

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para detalles

## 👨‍💻 Autor

Edwin Ortiz - [GitHub](https://github.com/edwin-ortizp)

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📊 Roadmap

### Versión Actual (v1.0)
- ✅ Grabador de audio
- ✅ Escaneo de biblioteca musical
- ✅ Detección de problemas de nomenclatura
- ✅ Edición de metadatos ID3
- ✅ Renombrado de archivos
- ✅ Estadísticas de biblioteca

### Próximas Versiones

#### v1.1 - Metadatos Avanzados
- [ ] **Letras de canciones**: Descarga e incrustación de lyrics desde APIs (Genius, Musixmatch)
- [ ] **Portadas de álbumes**: Descarga e incrustación de artwork desde APIs (Cover Art Archive, Last.fm)
- [ ] **Verificación de artwork**: Detectar archivos sin portada
- [ ] **Editar portadas**: Subir o seleccionar artwork personalizado

#### v1.2 - Automatización e IA
- [ ] **Corrección automática por lotes**: Aplicar cambios sugeridos masivamente
- [ ] **Integración con IA**: Sugerencias inteligentes de metadatos usando GPT
- [ ] **Reconocimiento de audio**: Identificar canciones usando fingerprinting (AcoustID)
- [ ] **Detección de duplicados avanzada**: Comparación por audio fingerprint

#### v1.3 - Exportación y Reportes
- [ ] **Exportar lista a TXT/CSV**: Listado completo de la biblioteca
- [ ] **Exportar reporte de problemas**: PDF/Excel con archivos problemáticos
- [ ] **Estadísticas avanzadas**: Gráficos de géneros, años, calidad, etc.
- [ ] **Comparar bibliotecas**: Detectar cambios entre escaneos

#### v1.4 - Formatos Adicionales
- [ ] Soporte para FLAC
- [ ] Soporte para M4A/AAC
- [ ] Soporte para OGG Vorbis
- [ ] Soporte para WAV con tags (BWF/RF64)

#### v1.5 - UX Mejorada
- [ ] Modo oscuro
- [ ] Drag & drop para portadas
- [ ] Vista previa de audio inline
- [ ] Búsqueda y filtros avanzados
- [ ] Playlist generator

#### v2.0 - Aplicación Standalone
- [ ] Empaquetado con Electron/Tauri
- [ ] Instaladores para Windows/Mac/Linux
- [ ] Menú de contexto del sistema
- [ ] Sincronización con servicios en la nube

### APIs Externas Planeadas

```python
# Metadatos
- MusicBrainz API: Información completa de álbumes
- Discogs API: Datos de lanzamientos
- Last.fm API: Tags, scrobbles, similar artists

# Artwork
- Cover Art Archive: Portadas oficiales
- Deezer API: Imágenes de alta calidad
- Spotify API: Artwork y metadatos

# Lyrics
- Genius API: Letras con anotaciones
- Musixmatch API: Letras sincronizadas
- LyricFind API: Base de datos comercial

# Fingerprinting
- AcoustID/MusicBrainz: Identificación de audio
- Chromaprint: Generación de fingerprints
```

### Contribuye con Ideas

¿Tienes una idea para mejorar la app? [Abre un issue](https://github.com/edwin-ortizp/sound-recorder/issues) con la etiqueta `enhancement`.
