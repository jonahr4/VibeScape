import { getPlaylistsWithTracks, getAllSongsFromPlaylists, getRecentlyPlayedTrackIds, getUserTopTrackIds } from '@/services/spotify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import TopSongsClient, { RankedSong } from '@/components/top-songs-client';

function normalize(values: number[], v: number): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0;
  return (v - min) / (max - min);
}

export default async function TopSongs() {
  const playlists = await getPlaylistsWithTracks();
  const songs = await getAllSongsFromPlaylists(playlists);
  const topIds = await getUserTopTrackIds();
  const recentIds = await getRecentlyPlayedTrackIds();

  // Frequency: number of playlists containing the song
  const freqCounts = songs.map(s => s.playlists.length);

  const ranked: RankedSong[] = songs.map(s => {
    const popularityNorm = s.popularity / 100; // 0-1
    const freqNorm = normalize(freqCounts, s.playlists.length); // 0-1
    const boost = 0.6 * (topIds.has(s.id) ? 1 : 0) + 0.4 * (recentIds.has(s.id) ? 1 : 0);
    // Weights: 50% listening boost, 15% library frequency, 35% Spotify popularity
    const score = 0.50 * boost + 0.15 * freqNorm + 0.35 * popularityNorm; // 0-1
    return {
      id: s.id,
      name: s.name,
      artist: s.artist,
      albumArt: s.albumArt,
      popularity: s.popularity,
      playlistCount: s.playlists.length,
      playlistIds: s.playlists,
      inTop: topIds.has(s.id),
      recent: recentIds.has(s.id),
      score,
      popularityNorm,
      freqNorm,
      boost,
    };
  }).sort((a, b) => b.score - a.score);

  const minimalPlaylists = playlists.map(p => ({ id: p.id, name: p.name, albumArt: p.albumArt }));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Top Songs</CardTitle>
        <CardDescription>
          Ranked by our User Popularity Score, which blends Spotify popularity, how often a song appears across your playlists, and your recent listening/top tracks. Timeframe: current (recency‑weighted).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="read-more">
            <AccordionTrigger>Read more about the ranking</AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Score = 0.50 × Listening Boost (1 if in your short‑term top tracks, 0.4 if in recently played) + 0.15 × Library Frequency (how many of your playlists include the song, normalized) + 0.35 × Spotify Popularity (0–100, normalized).
                </p>
                <p>
                  The weights emphasize your current listening most, then your library curation, with global popularity as a supporting signal.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <TopSongsClient songs={ranked} playlists={minimalPlaylists} />
      </CardContent>
    </Card>
  );
}
