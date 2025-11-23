# Frontend - Sound Recorder & Music Library

Interfaz de usuario moderna construida con React, TypeScript y TailwindCSS.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

## 📁 Estructura

```
frontend/
├── src/
│   ├── App.jsx                 # Componente principal
│   ├── main.jsx                # Entry point
│   ├── components/
│   │   └── ui/                 # Componentes shadcn/ui
│   └── features/
│       ├── recorder/           # Grabador de audio
│       │   ├── Main.tsx
│       │   ├── hooks/
│       │   └── components/
│       └── music-library/      # Organizador de música
│           ├── Main.tsx
│           ├── api/
│           │   └── client.ts   # Cliente API
│           ├── hooks/
│           │   ├── useMusicLibrary.ts
│           │   ├── useMp3Metadata.ts
│           │   └── useFileNaming.ts
│           ├── components/
│           │   ├── LibraryScanner.tsx
│           │   ├── MusicFilesList.tsx
│           │   ├── NamingIssues.tsx
│           │   └── MetadataEditor.tsx
│           ├── utils/
│           └── types.ts
├── public/
├── package.json
└── vite.config.js
```

## 🏗️ Features

### 🎙️ Audio Recorder

Componentes para grabación de audio:

- **Main.tsx**: Contenedor principal
- **Recorder.tsx**: Controles de grabación
- **RecordingsList.tsx**: Lista de grabaciones
- **useAudioRecorder.ts**: Hook para lógica de grabación

### 🎵 Music Library

Sistema completo de gestión de biblioteca musical:

#### Hooks

- **useMusicLibrary**: Gestión de estado y comunicación con API
- **useFileNaming**: Análisis de nomenclatura y duplicados
- **useMp3Metadata**: Procesamiento de metadatos (deprecado en favor del backend)

#### Components

- **LibraryScanner**: Input de directorio y control de escaneo
- **MusicFilesList**: Lista de archivos con indicadores de problemas
- **NamingIssues**: Estadísticas de la biblioteca
- **MetadataEditor**: Formulario para editar tags ID3

#### API Client

```typescript
import * as api from '@/features/music-library/api/client';

// Escanear directorio
const result = await api.scanDirectory('/path/to/music', true);

// Actualizar metadatos
await api.updateMetadata(filepath, {
  artist: 'The Beatles',
  title: 'Yesterday'
});

// Renombrar archivo
await api.renameFile(oldPath, 'New Name.mp3');
```

## 🎨 UI Components

Usa **shadcn/ui** construido sobre **Radix UI**:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
```

Componentes disponibles:
- Button
- Card
- Alert
- Progress
- Select
- Tabs

## 📦 Dependencias Principales

```json
{
  "@radix-ui/react-*": "Componentes UI primitivos",
  "react": "^18.3.1",
  "lucide-react": "^0.474.0",
  "tailwindcss": "^4.0.3",
  "vite": "^6.0.5"
}
```

## 🔧 Configuración

### Variables de Entorno

Crear `.env` en la raíz de `frontend/`:

```bash
VITE_API_URL=http://localhost:8000
```

### Tailwind CSS

Configuración en `tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom theme
    }
  }
}
```

### Vite

Configuración en `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🎯 Routing

Usa **Tabs** para navegación sin router:

```tsx
<Tabs defaultValue="recorder">
  <TabsList>
    <TabsTrigger value="recorder">Grabador</TabsTrigger>
    <TabsTrigger value="library">Biblioteca Musical</TabsTrigger>
  </TabsList>

  <TabsContent value="recorder">
    <AudioRecorder />
  </TabsContent>

  <TabsContent value="library">
    <MusicLibrary />
  </TabsContent>
</Tabs>
```

## 🐛 Debugging

### DevTools de React

```bash
# Instalar extensión de navegador
# https://react.dev/learn/react-developer-tools
```

### Logs de API

El cliente API incluye logs en consola:

```typescript
console.log('Scanned ${response.total} files');
console.error('Error scanning library:', err);
```

### Verificar Conexión al Backend

```tsx
const { apiHealthy, error } = useMusicLibrary();

if (!apiHealthy) {
  console.error('Backend not available:', error);
}
```

## 🎨 Estilos

### Tailwind Utilities

```tsx
<div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
  <span className="text-sm text-slate-600">Label</span>
  <span className="font-bold text-slate-900">Value</span>
</div>
```

### CSS Variables (Theme)

Definidas en `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

## 📱 Responsive Design

Mobile-first approach:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenido */}
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🚀 Build para Producción

```bash
# Build
npm run build

# Output en /dist
ls dist/
# index.html
# assets/index-[hash].js
# assets/index-[hash].css
```

### Optimizaciones

- Tree-shaking automático
- Code splitting
- Minificación
- Asset optimization

## 📝 Notas

- TypeScript estricto habilitado
- ESLint configurado para React
- Hot Module Replacement (HMR) habilitado
- Path alias `@` apunta a `src/`
