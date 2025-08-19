import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SongMap from "@/components/song-map"
import PlaylistChooser from "@/components/playlist-chooser"
import TopSongs from "@/components/top-songs"
import { Music, Star, TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingScreen from "@/components/loading-screen"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function SongMapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-[60vh] w-full" />
    </div>
  )
}

import SignInButton from "@/components/auth/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-3 md:p-4 shrink-0 sticky top-0 z-10 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 border-b border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">VibeScape</h1>
            <p className="text-muted-foreground">Visualize your music, find your vibe.</p>
          </div>
          <SignInButton />
        </div>
      </header>
      <main className="flex-1 p-3 md:p-4 flex flex-col min-h-0">
        {!session ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">Get started with your Spotify</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Sign in to load your playlists and generate mood-based recommendations.</p>
              <div className="flex justify-center">
                <SignInButton />
              </div>
            </div>
          </div>
        ) : (
        <Tabs defaultValue="song-map" className="w-full h-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] mx-auto">
            <TabsTrigger value="song-map"><Music className="mr-2 h-4 w-4" />Song Map</TabsTrigger>
            <TabsTrigger value="playlist-chooser"><Star className="mr-2 h-4 w-4" />Playlist Chooser</TabsTrigger>
            <TabsTrigger value="top-songs"><TrendingUp className="mr-2 h-4 w-4" />Top Songs</TabsTrigger>
          </TabsList>
          <TabsContent value="song-map" className="mt-3 flex-1 min-h-0">
            <div className="w-full h-full">
              <Suspense fallback={<LoadingScreen messages={["Loading your favorite hits…","Analyzing your connections…","Creating the graph…"]} /> }>
                <SongMap />
              </Suspense>
            </div>
          </TabsContent>
          <TabsContent value="playlist-chooser" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <PlaylistChooser />
            </div>
          </TabsContent>
          <TabsContent value="top-songs" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <Suspense fallback={<LoadingScreen messages={["Ranking your songs…","Crunching play trends…","Sorting by popularity…"]} /> }>
                <TopSongs />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
}
