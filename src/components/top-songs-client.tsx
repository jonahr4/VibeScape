"use client";

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type RankedSong = {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  popularity: number; // 0-100
  playlistCount: number;
  playlistIds: string[];
  inTop: boolean;
  recent: boolean;
  score: number; // 0-1
  popularityNorm: number; // 0-1
  freqNorm: number; // 0-1
  boost: number; // 0-1 (1 if inTop; +0.4 if recent)
};

type MinimalPlaylist = { id: string; name: string; albumArt: string | null };

export default function TopSongsClient({ songs, playlists }: { songs: RankedSong[]; playlists: MinimalPlaylist[] }) {
  const [perPage, setPerPage] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [playlistFilter, setPlaylistFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (playlistFilter === 'all') return songs;
    return songs.filter(s => s.playlistIds.includes(playlistFilter));
  }, [songs, playlistFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, perPage, page]);

  const setPerPageAndReset = (n: number) => {
    setPerPage(n);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Playlist filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm">Filter by playlist</span>
        <Select value={playlistFilter} onValueChange={(v) => { setPlaylistFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="All Playlists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded overflow-hidden bg-muted" />
                <span>All Playlists</span>
              </div>
            </SelectItem>
            {playlists.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <Image src={p.albumArt || 'https://placehold.co/48x48.png'} alt={p.name} width={24} height={24} className="h-6 w-6 object-cover rounded" />
                  <span className="truncate max-w-[180px]">{p.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="divide-y">
        {current.map((song, idx) => {
          const rank = (page - 1) * perPage + idx + 1;
          const weights = { boost: 0.50, freq: 0.15, pop: 0.35 };
          const contrib = {
            boost: song.boost * weights.boost,
            freq: song.freqNorm * weights.freq,
            pop: song.popularityNorm * weights.pop,
          };
          return (
            <div key={song.id} className="py-1">
              <div
                className="flex items-center gap-4 py-2 cursor-pointer hover:bg-muted/30 rounded"
                onClick={() => setOpenId((id) => (id === song.id ? null : song.id))}
              >
                <div className="w-8 text-right tabular-nums text-muted-foreground">{rank}</div>
                <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden">
                  <Image src={song.albumArt || 'https://placehold.co/96x96.png'} alt={song.name} width={48} height={48} className="h-12 w-12 object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{song.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{song.artist}</div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block mr-2">Playlists: {song.playlistCount}</div>
                <div className="text-xs mr-2">
                  <span title="User Popularity Score" className="font-mono">{(song.score * 100).toFixed(0)}</span>
                </div>
              </div>

              {openId === song.id && (
                <div className="mx-8 my-2 rounded-md border p-3 text-xs bg-card/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-muted-foreground">Listening Boost (50%)</div>
                      <div className="mt-1">Top tracks: {song.inTop ? 'yes' : 'no'}</div>
                      <div>Recently played: {song.recent ? 'yes' : 'no'}</div>
                      <div className="mt-1 font-mono">value {(song.boost * 100).toFixed(0)}% → +{(contrib.boost * 100).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Library Frequency (15%)</div>
                      <div className="mt-1">Playlists: {song.playlistCount}</div>
                      <div className="mt-1 font-mono">value {(song.freqNorm * 100).toFixed(0)}% → +{(contrib.freq * 100).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Spotify Popularity (35%)</div>
                      <div className="mt-1">Popularity: {song.popularity}</div>
                      <div className="mt-1 font-mono">value {(song.popularityNorm * 100).toFixed(0)}% → +{(contrib.pop * 100).toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="mt-2 border-t pt-2 font-mono">Total = {(song.score * 100).toFixed(0)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination bar (bottom) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="text-sm text-muted-foreground">Showing {current.length} of {songs.length}</div>
        <div className="flex items-center gap-3">
          <span className="text-sm">Per page</span>
          <Select value={String(perPage)} onValueChange={(v) => setPerPageAndReset(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <div className="text-sm">Page {page} of {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
