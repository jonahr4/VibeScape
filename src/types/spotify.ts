// src/types/spotify.ts

export interface Playlist {
  id: string;
  name: string;
  color: string;
  lineColor: string;
  trackCount: number;
  href: string;
  albumArt: string | null;
  dateCreated: string | null;
  lastModified: string | null;
}

export interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  popularity: number;
  playlists: string[]; // Array of playlist IDs
}
