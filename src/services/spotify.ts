// src/services/spotify.ts
'use server';

import { cookies } from 'next/headers';
import type { Playlist, Song } from '@/types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function fetchSpotify(endpoint: string) {
  const accessToken = cookies().get('spotify_access_token')?.value;

  if (!accessToken) {
    throw new Error('Not authenticated with Spotify');
  }

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Basic error handling. In a real app, you might want to handle token refreshing.
    const error = await response.json();
    console.error(`Spotify API Error for ${endpoint}:`, error);
    throw new Error(`Spotify API Error: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

// Generate random colors for playlists
const COLORS = [
  { background: 'rgba(233, 30, 99, 0.25)', line: 'rgba(233, 30, 99, 0.5)' },
  { background: 'rgba(103, 58, 183, 0.25)', line: 'rgba(103, 58, 183, 0.5)' },
  { background: 'rgba(0, 150, 136, 0.25)', line: 'rgba(0, 150, 136, 0.5)' },
  { background: 'rgba(255, 193, 7, 0.25)', line: 'rgba(255, 193, 7, 0.5)' },
  { background: 'rgba(3, 169, 244, 0.25)', line: 'rgba(3, 169, 244, 0.5)' },
  { background: 'rgba(255, 87, 34, 0.25)', line: 'rgba(255, 87, 34, 0.5)' },
  { background: 'rgba(76, 175, 80, 0.25)', line: 'rgba(76, 175, 80, 0.5)' },
];

function assignColor(index: number) {
    return COLORS[index % COLORS.length];
}

export async function getPlaylistsWithTracks(): Promise<{ playlists: Playlist[], songs: Song[] }> {
  const playlistData = await fetchSpotify('/me/playlists?limit=50');
  
  const songsMap = new Map<string, Song>();

  const playlists: Playlist[] = await Promise.all(
    playlistData.items.map(async (p: any, index: number): Promise<Playlist> => {
      const color = assignColor(index);
      return {
        id: p.id,
        name: p.name,
        color: color.background,
        lineColor: color.line,
        trackCount: p.tracks.total,
        href: p.href,
      };
    })
  );

  // Fetch tracks for each playlist
  // We fetch a limited number of playlists and tracks to keep the map readable
  const playlistsToFetch = playlists.slice(0, 7);
  for (const playlist of playlistsToFetch) {
      try {
        const tracksData = await fetchSpotify(`/playlists/${playlist.id}/tracks?fields=items(track(id,name,artists,album(images),popularity))&limit=50`);
        for (const item of tracksData.items) {
          const track = item.track;
          if (!track || !track.id) continue;

          if (songsMap.has(track.id)) {
            // Song already exists, just add this playlist to its list
            const existingSong = songsMap.get(track.id)!;
            if(!existingSong.playlists.includes(playlist.id)) {
                existingSong.playlists.push(playlist.id);
            }
          } else {
            // New song, create it
            const newSong: Song = {
              id: track.id,
              name: track.name,
              artist: track.artists.map((a: any) => a.name).join(', '),
              albumArt: track.album.images[0]?.url || null,
              popularity: track.popularity,
              playlists: [playlist.id],
            };
            songsMap.set(track.id, newSong);
          }
        }
      } catch (error) {
          console.warn(`Could not fetch tracks for playlist ${playlist.name}:`, error)
      }
  }

  return { playlists: playlistsToFetch, songs: Array.from(songsMap.values()) };
}
