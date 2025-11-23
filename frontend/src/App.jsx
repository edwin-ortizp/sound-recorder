import './App.css'
import AudioRecorder from './features/recorder/Main'
import MusicLibrary from './features/music-library/Main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Music } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Sound Recorder & Music Library
          </h1>
          <p className="text-slate-600">
            Graba audio y organiza tu biblioteca musical
          </p>
        </div>

        <Tabs defaultValue="recorder" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="recorder" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Grabador
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Biblioteca Musical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recorder">
            <AudioRecorder />
          </TabsContent>

          <TabsContent value="library">
            <MusicLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
