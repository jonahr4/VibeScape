import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SongMap from "@/components/song-map"
import PlaylistChooser from "@/components/playlist-chooser"
import { Music, Star } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 border-b shrink-0">
        <h1 className="text-3xl font-bold text-primary font-headline">VibeScape</h1>
        <p className="text-muted-foreground">Visualize your music, find your vibe.</p>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="song-map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="song-map"><Music className="mr-2 h-4 w-4" />Song Map</TabsTrigger>
            <TabsTrigger value="playlist-chooser"><Star className="mr-2 h-4 w-4" />Playlist Chooser</TabsTrigger>
          </TabsList>
          <TabsContent value="song-map" className="mt-6">
            <SongMap />
          </TabsContent>
          <TabsContent value="playlist-chooser" className="mt-6">
            <PlaylistChooser />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
