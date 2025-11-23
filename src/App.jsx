import './App.css'
import AudioRecorder from './features/recorder/Main'
import { MusicLibraryFeature } from './features/music-library/Main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Library } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="recorder" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="recorder" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Grabador de Audio
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Organizador de Biblioteca
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recorder">
            <AudioRecorder />
          </TabsContent>

          <TabsContent value="library">
            <MusicLibraryFeature />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
