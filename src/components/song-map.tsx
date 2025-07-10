import { getPlaylistsWithTracks } from '@/services/spotify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SongMapClient from './song-map-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default async function SongMap() {
  try {
    const { playlists, songs } = await getPlaylistsWithTracks();
    
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Interactive Song Map</CardTitle>
          <CardDescription>Explore your music library as a visual graph. Pan and zoom to discover connections.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SongMapClient playlists={playlists} songs={songs} />
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
