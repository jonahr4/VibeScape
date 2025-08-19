import { getPlaylistsWithTracks, getAllSongsFromPlaylists } from '@/services/spotify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SongMapClient from './song-map-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Info, Music, Star } from 'lucide-react';

export default async function SongMap() {
  try {
    const playlists = await getPlaylistsWithTracks();
    const songs = await getAllSongsFromPlaylists(playlists);
    
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="py-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base md:text-lg">Interactive Song Map</CardTitle>
              <CardDescription className="text-xs md:text-sm">Explore your music library as a visual graph. Pan and zoom to discover connections.</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="How to read the song map">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to Read the Song Map</DialogTitle>
                  <DialogDescription>
                    This visualization helps you discover connections in your music library. Here's what everything means:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 mt-1"></div>
                    <div>
                      <h3 className="font-semibold text-foreground">Playlists</h3>
                      <p>The large, colored circles represent your playlists. Songs are clustered around the playlists they belong to. Click a playlist to see its songs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Music className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Songs</h3>
                      <p>The smaller circles with album art are individual songs. Hover over a song to see its name and artist. Click a song to highlight its connections.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Star className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Song Popularity</h3>
                      <p>The size of a song's circle is determined by its popularity on Spotify. Bigger circles mean more popular songs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full border border-primary/50 flex-shrink-0 mt-1"></div>
                    <div>
                      <h3 className="font-semibold text-foreground">Connections</h3>
                      <p>Lines are drawn between songs that appear in the same playlist, revealing the musical fabric connecting your tracks.</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <SongMapClient allPlaylists={playlists} allSongs={songs} />
        </CardContent>
      </Card>
    );
  } catch (e: any) {
    console.error(e);
    return (
       <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Spotify Data</AlertTitle>
        <AlertDescription>
         <p>Could not fetch data from Spotify. Please check the details below:</p>
         <pre className="mt-2 whitespace-pre-wrap rounded-md bg-destructive/10 p-2 font-mono text-xs">
           {e.message}
         </pre>
        </AlertDescription>
      </Alert>
    )
  }
}
