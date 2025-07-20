// src/services/spotify.ts
'use server';

import type { Playlist, Song } from '@/types/spotify';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function fetchSpotify(endpoint: string) {
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Spotify Access Token is not set in the .env file. Please add your token.');
  }

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorDetails = `Status: ${response.status} ${response.statusText}`;
    try {
      const error = await response.json();
      errorDetails = JSON.stringify(error);
      if (response.status === 401) {
          throw new Error('Spotify API Error: The Access Token is invalid or has expired. Please get a new one.');
      }
    } catch (e) {
      // Could not parse JSON body
    }
    
    throw new Error(`Spotify API request failed for ${endpoint}. Details: ${errorDetails}`);
  }

  return response.json();
}

const COLORS = [
  { background: 'rgba(233, 30, 99, 0.25)', line: 'rgba(233, 30, 99, 0.5)' },
  { background: 'rgba(103, 58, 183, 0.25)', line: 'rgba(103, 58, 183, 0.5)' },
  { background: 'rgba(0, 150, 136, 0.25)', line: 'rgba(0, 150, 136, 0.5)' },
  { background: 'rgba(255, 193, 7, 0.25)', line: 'rgba(255, 193, 7, 0.5)' },
  { background: 'rgba(3, 169, 244, 0.25)', line: 'rgba(3, 169, 244, 0.5)' },
  { background: 'rgba(255, 87, 34, 0.25)', line: 'rgba(255, 87, 34, 0.5)' },
  { background: 'rgba(76, 175, 80, 0.25)', line: 'rgba(76, 175, 80, 0.5)' },
  { background: 'rgba(156, 39, 176, 0.25)', line: 'rgba(156, 39, 176, 0.5)' },
  { background: 'rgba(244, 67, 54, 0.25)', line: 'rgba(244, 67, 54, 0.5)' },
  { background: 'rgba(63, 81, 181, 0.25)', line: 'rgba(63, 81, 181, 0.5)' },
];

function assignColor(index: number) {
    return COLORS[index % COLORS.length];
}

export async function getPlaylistsWithTracks(): Promise<{ playlists: Playlist[], songs: Song[] }> {
  const playlistData = await fetchSpotify('/me/playlists?limit=50');
  
  if (!playlistData || !Array.isArray(playlistData.items)) {
    console.error('Unexpected playlist data structure:', playlistData);
    throw new Error('Failed to fetch playlists: The data format from Spotify was not as expected.');
  }

  const songsMap = new Map<string, Song>();

  const playlists: Playlist[] = playlistData.items.map((p: any, index: number): Playlist => {
      const color = assignColor(index);
      return {
        id: p.id,
        name: p.name,
        color: color.background,
        lineColor: color.line,
        trackCount: p.tracks.total,
        href: p.href,
        albumArt: p.images?.[0]?.url || null,
      };
    });

  const trackPromises = playlists.map(playlist => 
      fetchSpotify(`/playlists/${playlist.id}/tracks?fields=items(track(id,name,artists,album(images),popularity))&limit=100`)
        .then(tracksData => ({ playlistId: playlist.id, tracksData }))
        .catch(error => {
            console.warn(`Could not fetch tracks for playlist ${playlist.name}:`, error);
            return { playlistId: playlist.id, tracksData: null };
        })
  );
  
  const results = await Promise.all(trackPromises);

  for (const { playlistId, tracksData } of results) {
    if (!tracksData || !Array.isArray(tracksData.items)) {
        continue;
    }
    for (const item of tracksData.items) {
      const track = item.track;
      if (!track || !track.id) continue;

      if (songsMap.has(track.id)) {
        const existingSong = songsMap.get(track.id)!;
        if(!existingSong.playlists.includes(playlistId)) {
            existingSong.playlists.push(playlistId);
        }
      } else {
        const newSong: Song = {
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          albumArt: track.album?.images?.[0]?.url || null,
          popularity: track.popularity,
          playlists: [playlistId],
        };
        songsMap.set(track.id, newSong);
      }
    }
  }

  return { playlists, songs: Array.from(songsMap.values()) };
}
