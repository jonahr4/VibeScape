// src/services/spotify.ts
'use server';

import type { Playlist, Song } from '@/types/spotify';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function fetchSpotify(endpoint: string, options: RequestInit = {}) {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    throw new Error('You are not signed in with Spotify. Please click "Sign in with Spotify" to continue.');
  }

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
        throw new Error('The Spotify Access Token has expired or is invalid. Please obtain a new token and update your .env file.');
    }
    
    let errorDetails = `Status: ${response.status} ${response.statusText}`;
    try {
      const error = await response.json();
      errorDetails = JSON.stringify(error);
    } catch (e) {
      // Could not parse JSON body
    }
    
    throw new Error(`Spotify API request failed for ${endpoint}. Details: ${errorDetails}`);
  }

  // Handle cases where there is no JSON body
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      return response.json();
  }
  return null;
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

async function fetchAllPlaylistTracks(playlistId: string): Promise<any[]> {
    let allItems: any[] = [];
    let nextUrl: string | null = `/playlists/${playlistId}/tracks?fields=items(added_at,track(id,name,artists,album(images),popularity)),next&limit=100`;

    while (nextUrl) {
        const data = await fetchSpotify(nextUrl);
        if (data && Array.isArray(data.items)) {
            allItems = allItems.concat(data.items);
        }
        nextUrl = data?.next ? data.next.replace(SPOTIFY_API_BASE, '') : null;
    }
    return allItems;
}


export async function getPlaylistsWithTracks(): Promise<Playlist[]> {
  const userProfile = await fetchSpotify('/me');
  const userId = userProfile.id;

  const playlistData = await fetchSpotify('/me/playlists?limit=50');
  
  if (!playlistData || !Array.isArray(playlistData.items)) {
    throw new Error('Failed to fetch playlists: The data format from Spotify was not as expected.');
  }

  const userOwnedOrCollaborativePlaylists = playlistData.items.filter((p: any) => p.owner.id === userId || p.collaborative);

  const songsMap = new Map<string, Song>();
  const finalPlaylists: Playlist[] = [];

  for (const [index, p] of userOwnedOrCollaborativePlaylists.entries()) {
      const color = assignColor(index);
      
      const allTrackItems = await fetchAllPlaylistTracks(p.id);

      let earliestDate: string | null = null;
      let latestDate: string | null = null;
      const playlistTracks: Song[] = [];

      for (const item of allTrackItems) {
        if (!item.track || !item.track.id || !item.added_at) continue;
        
        const addedAt = item.added_at;
        if (!earliestDate || new Date(addedAt) < new Date(earliestDate)) {
            earliestDate = addedAt;
        }
        if (!latestDate || new Date(addedAt) > new Date(latestDate)) {
            latestDate = addedAt;
        }
  
        const track = item.track;
        let song: Song;

        if (songsMap.has(track.id)) {
            song = songsMap.get(track.id)!;
            if(!song.playlists.includes(p.id)) {
                song.playlists.push(p.id);
            }
        } else {
            song = {
                id: track.id,
                name: track.name,
                artist: track.artists.map((a: any) => a.name).join(', '),
                albumArt: track.album?.images?.[0]?.url || null,
                popularity: track.popularity,
                playlists: [p.id],
            };
            songsMap.set(track.id, song);
        }
        playlistTracks.push(song);
      }
      
      finalPlaylists.push({
          id: p.id,
          name: p.name,
          color: color.background,
          lineColor: color.line,
          trackCount: p.tracks.total,
          href: p.external_urls.spotify,
          albumArt: p.images?.[0]?.url || null,
          dateCreated: earliestDate,
          lastModified: latestDate,
          tracks: playlistTracks,
      });
  }

  return finalPlaylists;
}

export async function getAllSongsFromPlaylists(playlists: Playlist[]): Promise<Song[]> {
    const allSongs = new Map<string, Song>();
    playlists.forEach(p => {
        p.tracks.forEach(t => {
            if (!allSongs.has(t.id)) {
                allSongs.set(t.id, t);
            }
        });
    });
    return Array.from(allSongs.values());
}
