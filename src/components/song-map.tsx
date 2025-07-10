import { getPlaylistsWithTracks } from '@/services/spotify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SongMapClient from './song-map-client';

export default async function SongMap() {
  let playlists = [];
  let songs = [];
  let error = null;

  try {
    const { playlists: fetchedPlaylists, songs: fetchedSongs } = await getPlaylistsWithTracks();
    playlists = fetchedPlaylists;
    songs = fetchedSongs;
  } catch (e) {
    console.error(e);
    error = "Failed to fetch data from Spotify. Please try refreshing the page.";
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Interactive Song Map</CardTitle>
        <CardDescription>Explore your music library as a visual graph. Pan and zoom to discover connections.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
       {error ? (
          <div className="flex items-center justify-center h-[60vh] bg-card">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <SongMapClient playlists={playlists} songs={songs} />
        )}
      </CardContent>
    </Card>
  );
}
