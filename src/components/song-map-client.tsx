// src/components/song-map-client.tsx
"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, Maximize, Info, Music, GitBranch, Star, ListMusic, RefreshCw, Filter, Search, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Playlist, Song } from '@/types/spotify';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const MAP_SIZE = 4000;

type Vector2D = { x: number; y: number; };
type Transform = { x: number; y: number; scale: number; };
type Selection = { type: 'song' | 'playlist'; id: string } | null;
type ConnectionSelection =
  | { type: 'song-song'; songAId: string; songBId: string }
  | { type: 'song-playlist'; songId: string; playlistId: string }
  | { type: 'playlist-playlist'; playlistAId: string; playlistBId: string };
type FilterMode = "top" | "random";
type SortKey = "name" | "lastModified" | "dateCreated";
type SortDirection = "asc" | "desc";

interface SongMapClientProps {
  allPlaylists: Playlist[];
  allSongs: Song[];
}

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


const SongMapClient = ({ allPlaylists, allSongs }: SongMapClientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.2 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Vector2D>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionSelection | null>(null);
  const EDGE_HITBOX_MULTIPLIER = 5;

  // State for sorting and filtering playlists
  const [sortKey, setSortKey] = useState<SortKey>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');

  // State for playlist selection
  const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, boolean>>({});
  
  const [stagedSelectedPlaylists, setStagedSelectedPlaylists] = useState(selectedPlaylists);
  
  // State for song filter
  const [songCountFilter, setSongCountFilter] = useState(50);
  const [stagedSongCountFilter, setStagedSongCountFilter] = useState([50]);
  const [filterMode, setFilterMode] = useState<FilterMode>("top");
  const [stagedFilterMode, setStagedFilterMode] = useState<FilterMode>("top");

  // Connection type visibility
  const [connectionTypes, setConnectionTypes] = useState({
    songToSong: false,
    songToPlaylist: true,
    playlistToPlaylist: true,
  });

  // Filter and sort playlists for the selection sheet
  const sortedAndFilteredPlaylists = useMemo(() => {
    return (allPlaylists || [])
      .filter(p => p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase()))
      .sort((a, b) => {
        let compareA: string | number | Date | null;
        let compareB: string | number | Date | null;

        if (sortKey === 'name') {
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
        } else if (sortKey === 'lastModified') {
          compareA = a.lastModified ? new Date(a.lastModified) : new Date(0);
          compareB = b.lastModified ? new Date(b.lastModified) : new Date(0);
        } else { // dateCreated
          compareA = a.dateCreated ? new Date(a.dateCreated) : new Date(0);
          compareB = b.dateCreated ? new Date(b.dateCreated) : new Date(0);
        }

        if (compareA < compareB) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (compareA > compareB) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
  }, [allPlaylists, playlistSearchQuery, sortKey, sortDirection]);

  // Filter playlists and songs based on selection
  const { playlists, songs, maxSongs } = useMemo(() => {
    const activePlaylists = (allPlaylists || []).filter(p => selectedPlaylists[p.id]);
    const activePlaylistIds = new Set(activePlaylists.map(p => p.id));
    
    const songsInSelectedPlaylists = (allSongs || []).filter(s => 
      s.playlists.some(pid => activePlaylistIds.has(pid))
    );
    
    const maxSongs = songsInSelectedPlaylists.length;
    let filteredSongs: Song[];

    if (filterMode === 'top') {
      filteredSongs = [...songsInSelectedPlaylists]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, songCountFilter);
    } else { // random
      filteredSongs = shuffleArray(songsInSelectedPlaylists).slice(0, songCountFilter);
    }

    return { playlists: activePlaylists, songs: filteredSongs, maxSongs };
  }, [allPlaylists, allSongs, selectedPlaylists, songCountFilter, filterMode]);


  useEffect(() => {
    setIsClient(true);
    // Center the view on initial load
    const rect = containerRef.current?.getBoundingClientRect();
    if(rect) {
      setTransform(t => ({...t, x: -MAP_SIZE/2*t.scale + rect.width/2, y: -MAP_SIZE/2*t.scale + rect.height/2}));
    }
    
    // Set initial playlists after client-side mount
    if (allPlaylists && allPlaylists.length > 0 && Object.keys(selectedPlaylists).length === 0) {
        const initialState: Record<string, boolean> = {};
        const sortedInitialPlaylists = [...allPlaylists].sort((a, b) => {
            const dateA = a.lastModified ? new Date(a.lastModified) : new Date(0);
            const dateB = b.lastModified ? new Date(b.lastModified) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
        sortedInitialPlaylists.slice(0, 4).forEach(p => {
            initialState[p.id] = true;
        });
        setSelectedPlaylists(initialState);
        setStagedSelectedPlaylists(initialState);
    }
  }, [allPlaylists]);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [initializedCounts, setInitializedCounts] = useState(false);

  useEffect(() => {
    // Initialize to 50 (or max) once we have data and a playlist selection
    if (!initializedCounts && maxSongs > 0 && Object.keys(selectedPlaylists).length > 0) {
      const initial = Math.min(50, maxSongs);
      setStagedSongCountFilter([initial]);
      setSongCountFilter(initial);
      setInitializedCounts(true);
      return;
    }
    // Clamp down if slider exceeds current maximum
    if (maxSongs > 0 && stagedSongCountFilter[0] > maxSongs) {
      setStagedSongCountFilter([maxSongs]);
    }
  }, [maxSongs, stagedSongCountFilter, initializedCounts, selectedPlaylists]);

  const playlistPositions = useMemo(() => {
    const positions: Record<string, Vector2D> = {};
    const angleStep = (2 * Math.PI) / (playlists.length || 1);
    const radius = MAP_SIZE / 3;
    playlists.forEach((p, i) => {
      positions[p.id] = {
        x: MAP_SIZE / 2 + radius * Math.cos(angleStep * i - Math.PI / 2),
        y: MAP_SIZE / 2 + radius * Math.sin(angleStep * i - Math.PI / 2),
      };
    });
    return positions;
  }, [playlists]);

  const songPositions = useMemo(() => {
    if (!isClient) return {};
    const JITTER_STRENGTH = 400; 
    const positions: Record<string, Vector2D> = {};

    songs.forEach(song => {
      const parentPlaylistPos = song.playlists
        .map(pid => playlistPositions[pid])
        .filter(Boolean);
  
      if (parentPlaylistPos.length > 0) {
        const centroid = parentPlaylistPos.reduce(
          (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
          { x: 0, y: 0 }
        );
        const avgX = centroid.x / parentPlaylistPos.length;
        const avgY = centroid.y / parentPlaylistPos.length;
  
        positions[song.id] = {
          x: avgX + (Math.random() - 0.5) * JITTER_STRENGTH,
          y: avgY + (Math.random() - 0.5) * JITTER_STRENGTH,
        };
      } else {
        positions[song.id] = {
          x: MAP_SIZE / 2 + (Math.random() - 0.5) * MAP_SIZE / 4,
          y: MAP_SIZE / 2 + (Math.random() - 0.5) * MAP_SIZE / 4,
        };
      }
    });
    return positions;
  }, [playlistPositions, songs, isClient]);
  
  const songSongConnections = useMemo(() => {
    const lines: { start: Vector2D; end: Vector2D; key: string, color: string, songIds: string[] }[] = [];
    playlists.forEach(playlist => {
      const playlistSongs = songs.filter(s => s.playlists.includes(playlist.id));
      for (let i = 0; i < playlistSongs.length; i++) {
        for (let j = i + 1; j < playlistSongs.length; j++) {
          const songA = playlistSongs[i];
          const songB = playlistSongs[j];
          const posA = songPositions[songA.id];
          const posB = songPositions[songB.id];
          if (posA && posB) {
            lines.push({
              start: posA,
              end: posB,
              key: `${playlist.id}-${songA.id}-${songB.id}`,
              color: playlist.lineColor,
              songIds: [songA.id, songB.id]
            });
          }
        }
      }
    });
    return lines;
  }, [songPositions, playlists, songs]);

  const songPlaylistConnections = useMemo(() => {
    const lines: { start: Vector2D; end: Vector2D; key: string, color: string, songId: string; playlistId: string }[] = [];
    songs.forEach(song => {
      song.playlists.forEach(pid => {
        if (!playlistPositions[pid]) return;
        if (!selectedPlaylists[pid]) return; // only active playlists
        const posSong = songPositions[song.id];
        const posPlaylist = playlistPositions[pid];
        const playlist = playlists.find(p => p.id === pid);
        if (posSong && posPlaylist && playlist) {
          lines.push({
            start: posPlaylist,
            end: posSong,
            key: `P2S-${pid}-${song.id}`,
            color: playlist.lineColor,
            songId: song.id,
            playlistId: pid,
          });
        }
      });
    });
    return lines;
  }, [songs, songPositions, playlistPositions, playlists, selectedPlaylists]);

  const playlistPlaylistConnections = useMemo(() => {
    const lines: { start: Vector2D; end: Vector2D; key: string, color: string, width: number, a: string, b: string }[] = [];
    for (let i = 0; i < playlists.length; i++) {
      for (let j = i + 1; j < playlists.length; j++) {
        const a = playlists[i];
        const b = playlists[j];
        const posA = playlistPositions[a.id];
        const posB = playlistPositions[b.id];
        if (!posA || !posB) continue;
        // Count shared songs among currently visible songs
        let shared = 0;
        songs.forEach(s => {
          if (s.playlists.includes(a.id) && s.playlists.includes(b.id)) shared++;
        });
        if (shared > 0) {
          const width = Math.min(6, 1 + shared / 10);
          const color = 'rgba(200,200,200,0.5)';
          lines.push({ start: posA, end: posB, key: `P2P-${a.id}-${b.id}`, color, width, a: a.id, b: b.id });
        }
      }
    }
    return lines;
  }, [playlists, playlistPositions, songs]);
  
  const selectionDetails = useMemo(() => {
    if (!selection) return null;

    if (selection.type === 'song') {
      const selectedSong = songs.find(s => s.id === selection.id);
      if (!selectedSong) return null;

      const connectedPlaylistIds = new Set(selectedSong.playlists);
      const connectedSongIds = new Set<string>([selectedSong.id]);

      songs.forEach(song => {
        if (song.playlists.some(pid => connectedPlaylistIds.has(pid))) {
          connectedSongIds.add(song.id);
        }
      });
      return { connectedSongIds, connectedPlaylistIds, isSongSelection: true };
    }

    if (selection.type === 'playlist') {
        const selectedPlaylistId = selection.id;
        const connectedPlaylistIds = new Set<string>([selectedPlaylistId]);
        const connectedSongIds = new Set<string>();
        
        songs.forEach(song => {
            if (song.playlists.includes(selectedPlaylistId)) {
                connectedSongIds.add(song.id);
            }
        });

        return { connectedSongIds, connectedPlaylistIds, isSongSelection: false };
    }
    
    return null;
  }, [selection, songs]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(2, transform.scale + scaleAmount));

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = transform.x + (mouseX - transform.x) * (1 - newScale / transform.scale);
    const newY = transform.y + (mouseY - transform.y) * (1 - newScale / transform.scale);
    
    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive-node]') || (e.target as HTMLElement).closest('[data-filter-card]')) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform(t => ({ ...t, x: t.x + e.clientX - startPan.x, y: t.y + e.clientY - startPan.y }));
    setStartPan({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    const startX = startPan.x;
    const startY = startPan.y;
    const panThreshold = 5;
    const movedDistance = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (isPanning && movedDistance < panThreshold && !(e.target as HTMLElement).closest('[data-interactive-node]')) {
      setSelection(null);
    }
    setIsPanning(false);
  };
  
  const handleSongClick = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection(prev => (prev?.type === 'song' && prev.id === songId) ? null : { type: 'song', id: songId });
  }

  const handlePlaylistClick = (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection(prev => (prev?.type === 'playlist' && prev.id === playlistId) ? null : { type: 'playlist', id: playlistId });
  }

  const zoom = (direction: 'in' | 'out') => {
    const scaleAmount = direction === 'in' ? 0.2 : -0.2;
    const newScale = Math.max(0.1, Math.min(2, transform.scale + scaleAmount));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newX = transform.x + (centerX - transform.x) * (1 - newScale / transform.scale);
    const newY = transform.y + (centerY - transform.y) * (1 - newScale / transform.scale);
    setTransform({ scale: newScale, x: newX, y: newY });
  }

  const resetView = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if(!rect) {
      setTransform({ x: 0, y: 0, scale: 0.2 });
      return;
    }
    const newScale = 0.2;
    const newX = -MAP_SIZE/2*newScale + rect.width/2;
    const newY = -MAP_SIZE/2*newScale + rect.height/2;
    setTransform({ scale: newScale, x: newX, y: newY });
    setSelection(null);
  }

  const handleApplyFilters = () => {
    setSelectedPlaylists(stagedSelectedPlaylists);
    setSongCountFilter(stagedSongCountFilter[0]);
    setFilterMode(stagedFilterMode);
    setSelection(null);
  }

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[60vh] bg-card overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsPanning(false)}
    >
       <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-2">
        <Button size="icon" variant="secondary" onClick={() => zoom('in')}><Plus /></Button>
        <Button size="icon" variant="secondary" onClick={() => zoom('out')}><Minus /></Button>
        <Button size="icon" variant="secondary" onClick={resetView}><Maximize /></Button>
         <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="secondary"><ListMusic /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[350px] sm:w-[450px] flex flex-col p-0">
            <SheetHeader className="p-6 pb-2 border-b">
              <SheetTitle>Select Playlists</SheetTitle>
               <div className="flex gap-2 pt-2">
                 <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search playlists..."
                    className="pl-9"
                    value={playlistSearchQuery}
                    onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                  />
                 </div>
                 <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                   <SelectTrigger className="w-[150px]">
                     <SelectValue placeholder="Sort by..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="lastModified">Last Modified</SelectItem>
                     <SelectItem value="dateCreated">Date Created</SelectItem>
                     <SelectItem value="name">Name</SelectItem>
                   </SelectContent>
                 </Select>
                 <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                   {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                 </Button>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                {sortedAndFilteredPlaylists.map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted -mx-2">
                      <Checkbox
                        id={p.id}
                        checked={stagedSelectedPlaylists[p.id] || false}
                        onCheckedChange={(checked) => {
                          setStagedSelectedPlaylists(prev => ({ ...prev, [p.id]: !!checked }));
                        }}
                      />
                      <Label htmlFor={p.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                          <Image src={p.albumArt || 'https://placehold.co/64x64.png'} alt={p.name} width={48} height={48} className="rounded-md" />
                          <div className="flex-1">
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.trackCount} tracks</p>
                              {p.dateCreated && <p className="text-xs text-muted-foreground">Created: {format(new Date(p.dateCreated), 'MMM yyyy')}</p>}
                              {p.lastModified && <p className="text-xs text-muted-foreground">Modified: {format(new Date(p.lastModified), 'MMM yyyy')}</p>}
                          </div>
                      </Label>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <SheetFooter className="p-6 pt-4 border-t">
              <SheetClose asChild>
                <Button onClick={handleApplyFilters}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Map
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
         <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary"><Info /></Button>
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
                    <GitBranch className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-foreground">Connections</h3>
                        <p>Lines are drawn between songs that appear in the same playlist, revealing the musical fabric connecting your tracks.</p>
                    </div>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

       <div className="absolute top-2 right-2 z-20 w-64" data-filter-card>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Card>
            <CardHeader className="p-4">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between">
                  <span className="text-base inline-flex items-center gap-2 font-semibold">
                    <Filter className="w-4 h-4" />
                    Filters
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen ? "rotate-180" : "rotate-0")} />
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Connections section */}
              <div>
                <p className="text-sm font-medium">Connections</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ct-s2s" checked={connectionTypes.songToSong} onCheckedChange={(c) => setConnectionTypes(v => ({...v, songToSong: !!c}))} />
                    <Label htmlFor="ct-s2s">Song ↔ Song (same playlist)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ct-p2s" checked={connectionTypes.songToPlaylist} onCheckedChange={(c) => setConnectionTypes(v => ({...v, songToPlaylist: !!c}))} />
                    <Label htmlFor="ct-p2s">Playlist ↔ Song (membership)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ct-p2p" checked={connectionTypes.playlistToPlaylist} onCheckedChange={(c) => setConnectionTypes(v => ({...v, playlistToPlaylist: !!c}))} />
                    <Label htmlFor="ct-p2p">Playlist ↔ Playlist (shared songs)</Label>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              <RadioGroup value={stagedFilterMode} onValueChange={(value) => setStagedFilterMode(value as FilterMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top" id="filter-top" />
                  <Label htmlFor="filter-top">Top Songs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="filter-random" />
                  <Label htmlFor="filter-random">Random Songs</Label>
                </div>
              </RadioGroup>
              <div>
                <Label htmlFor="song-count-slider" className="text-sm">
                  Show {stagedSongCountFilter[0]} Songs
                </Label>
                <div className="flex items-center gap-2">
                    <Slider
                      id="song-count-slider"
                      min={1}
                      max={maxSongs > 1 ? maxSongs : 1}
                      step={1}
                      value={stagedSongCountFilter}
                      onValueChange={setStagedSongCountFilter}
                      disabled={maxSongs <= 1}
                    />
                </div>
              </div>
              <Button onClick={handleApplyFilters} className="w-full" size="sm">Apply</Button>
            </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <div
        className="absolute"
        style={{
          width: MAP_SIZE,
          height: MAP_SIZE,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <svg width={MAP_SIZE} height={MAP_SIZE} className="absolute top-0 left-0">
          <g>
            {/* Playlist ↔ Playlist */}
            {connectionTypes.playlistToPlaylist && playlistPlaylistConnections.map(conn => {
              let isVisible = !selectionDetails;
              if (selectionDetails) {
                if (selectionDetails.isSongSelection) {
                  // When a song is selected, highlight playlists connected to that song
                  isVisible = selectionDetails.connectedPlaylistIds.has(conn.a) && selectionDetails.connectedPlaylistIds.has(conn.b);
                } else {
                  isVisible = selectionDetails.connectedPlaylistIds.has(conn.a) && selectionDetails.connectedPlaylistIds.has(conn.b);
                }
              }
              const baseWidth = conn.width;
              return (
                <g key={conn.key}>
                  {/* Visible line (no pointer events) */}
                  <line
                    x1={conn.start.x}
                    y1={conn.start.y}
                    x2={conn.end.x}
                    y2={conn.end.y}
                    stroke={conn.color}
                    strokeWidth={baseWidth}
                    className={cn("transition-opacity duration-300 pointer-events-none", isVisible ? "opacity-40" : "opacity-10")}
                  />
                  {/* Invisible, larger hitbox */}
                  <line
                    x1={conn.start.x}
                    y1={conn.start.y}
                    x2={conn.end.x}
                    y2={conn.end.y}
                    stroke="transparent"
                    strokeWidth={baseWidth * EDGE_HITBOX_MULTIPLIER}
                    style={{ pointerEvents: 'stroke' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isVisible) return;
                      setSelectedConnection({ type: 'playlist-playlist', playlistAId: conn.a, playlistBId: conn.b });
                    }}
                  />
                </g>
              );
            })}

            {/* Playlist ↔ Song */}
            {connectionTypes.songToPlaylist && songPlaylistConnections.map(conn => {
              let isVisible = !selectionDetails;
              if (selectionDetails) {
                 if (selectionDetails.isSongSelection) {
                   isVisible = selectionDetails.connectedSongIds.has(conn.songId) && selectionDetails.connectedPlaylistIds.has(conn.playlistId);
                 } else {
                   isVisible = selectionDetails.connectedPlaylistIds.has(conn.playlistId) && selectionDetails.connectedSongIds.has(conn.songId);
                 }
              }
              const baseWidth = 1.5;
              return (
                <g key={conn.key}>
                  <line
                    x1={conn.start.x}
                    y1={conn.start.y}
                    x2={conn.end.x}
                    y2={conn.end.y}
                    stroke={conn.color}
                    strokeWidth={baseWidth}
                    className={cn("transition-opacity duration-300 pointer-events-none", isVisible ? "opacity-50" : "opacity-10")}
                  />
                  <line
                    x1={conn.start.x}
                    y1={conn.start.y}
                    x2={conn.end.x}
                    y2={conn.end.y}
                    stroke="transparent"
                    strokeWidth={baseWidth * EDGE_HITBOX_MULTIPLIER}
                    style={{ pointerEvents: 'stroke' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isVisible) return;
                      setSelectedConnection({ type: 'song-playlist', songId: conn.songId, playlistId: conn.playlistId });
                    }}
                  />
                </g>
              )
            })}

            {/* Song ↔ Song */}
            {connectionTypes.songToSong && songSongConnections.map(conn => {
              let isVisible = !selectionDetails;
              if (selectionDetails) {
                 if (selectionDetails.isSongSelection) {
                    isVisible = selectionDetails.connectedSongIds.has(conn.songIds[0]) && selectionDetails.connectedSongIds.has(conn.songIds[1]);
                 } else { // is playlist selection
                    isVisible = selectionDetails.connectedSongIds.has(conn.songIds[0]) && selectionDetails.connectedSongIds.has(conn.songIds[1]);
                 }
              }
              const baseWidth = 2;
              return (
                <g key={conn.key}>
                  <line 
                    x1={conn.start.x} 
                    y1={conn.start.y} 
                    x2={conn.end.x} 
                    y2={conn.end.y} 
                    stroke={conn.color} 
                    strokeWidth={baseWidth}
                    className={cn("transition-opacity duration-300 pointer-events-none", isVisible ? "opacity-70" : "opacity-10")}
                  />
                  <line 
                    x1={conn.start.x} 
                    y1={conn.start.y} 
                    x2={conn.end.x} 
                    y2={conn.end.y} 
                    stroke="transparent"
                    strokeWidth={baseWidth * EDGE_HITBOX_MULTIPLIER}
                    style={{ pointerEvents: 'stroke' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isVisible) return;
                      setSelectedConnection({ type: 'song-song', songAId: conn.songIds[0], songBId: conn.songIds[1] });
                    }}
                  />
                </g>
              )
            })}
          </g>
        </svg>

        <TooltipProvider>
        {playlists.map(p => {
          const pos = playlistPositions[p.id];
          if(!pos) return null;
          const radius = 250 + p.trackCount * 2;
          const isVisible = !selectionDetails || selectionDetails.connectedPlaylistIds.has(p.id);

          return (
              <div
                key={p.id}
                data-interactive-node
                onClick={(e) => handlePlaylistClick(p.id, e)}
                className={cn(
                    "absolute rounded-full flex items-center justify-center transition-opacity duration-300 cursor-pointer",
                    isVisible ? "opacity-100" : "opacity-20",
                    "hover:border-primary-foreground"
                )}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: radius * 2,
                  height: radius * 2,
                  backgroundColor: p.color,
                  transform: 'translate(-50%, -50%)',
                  border: `2px solid ${p.lineColor}`
                }}
              >
                  <span 
                    className="font-bold text-foreground/80 text-center pointer-events-none"
                    style={{ fontSize: `0.75rem`}}
                  >
                    {p.name}
                  </span>
              </div>
          );
        })}
        
        {songs.map(song => {
          const pos = songPositions[song.id];
          const size = 60 + Math.pow(song.popularity / 100, 2) * 20;
          if (!pos) return null;

          const isVisible = !selectionDetails || selectionDetails.connectedSongIds.has(song.id);
          const isSelected = selection?.type === 'song' && song.id === selection.id;

          return (
            <Tooltip key={song.id} delayDuration={100}>
              <TooltipTrigger asChild>
                  <div
                    data-interactive-node
                    onClick={(e) => handleSongClick(song.id, e)}
                    className={cn(
                        "absolute rounded-full shadow-lg transition-all duration-300",
                        isVisible ? "opacity-100" : "opacity-20",
                        isSelected ? "scale-125 z-20" : "hover:scale-110 hover:z-10"
                    )}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: size,
                      height: size,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer'
                    }}
                  >
                    {song.albumArt ? (
                       <Image
                        src={song.albumArt}
                        alt={song.name}
                        width={size}
                        height={size}
                        className="rounded-full object-cover"
                      />
                    ): (
                      <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-xs text-center text-muted-foreground p-1">
                        {song.name}
                      </div>
                    )}
                  </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">{song.name}</p>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
                 <p className="text-xs mt-2">Popularity: {song.popularity}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        </TooltipProvider>
      </div>
      {/* Connection details dialog */}
      {selectedConnection && (
        <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connection Details</DialogTitle>
              <DialogDescription>Insights about the selected connection.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-6">
                {(() => {
                  if (selectedConnection.type === 'song-song') {
                    const a = songs.find(s => s.id === selectedConnection.songAId);
                    const b = songs.find(s => s.id === selectedConnection.songBId);
                    const aName = a?.name || 'Song A';
                    const bName = b?.name || 'Song B';
                    return (
                      <>
                        <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                          <Image src={a?.albumArt || 'https://placehold.co/96x96.png'} alt={aName} width={96} height={96} className="rounded-md" />
                          <p className="text-xs text-center font-medium max-w-[140px] truncate" title={aName}>{aName}</p>
                        </div>
                        <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                          <Image src={b?.albumArt || 'https://placehold.co/96x96.png'} alt={bName} width={96} height={96} className="rounded-md" />
                          <p className="text-xs text-center font-medium max-w-[140px] truncate" title={bName}>{bName}</p>
                        </div>
                      </>
                    );
                  }
                  if (selectedConnection.type === 'song-playlist') {
                    const s = songs.find(x => x.id === selectedConnection.songId);
                    const p = playlists.find(x => x.id === selectedConnection.playlistId);
                    const pName = p?.name || 'Playlist';
                    const sName = s?.name || 'Song';
                    return (
                      <>
                        <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                          <Image src={p?.albumArt || 'https://placehold.co/96x96.png'} alt={pName} width={96} height={96} className="rounded-md" />
                          <p className="text-xs text-center font-medium max-w-[140px] truncate" title={pName}>{pName}</p>
                        </div>
                        <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                          <Image src={s?.albumArt || 'https://placehold.co/96x96.png'} alt={sName} width={96} height={96} className="rounded-md" />
                          <p className="text-xs text-center font-medium max-w-[140px] truncate" title={sName}>{sName}</p>
                        </div>
                      </>
                    );
                  }
                  // playlist-playlist
                  const a = playlists.find(p => p.id === selectedConnection.playlistAId);
                  const b = playlists.find(p => p.id === selectedConnection.playlistBId);
                  const aName = a?.name || 'Playlist A';
                  const bName = b?.name || 'Playlist B';
                  return (
                    <>
                      <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                        <Image src={a?.albumArt || 'https://placehold.co/96x96.png'} alt={aName} width={96} height={96} className="rounded-md" />
                        <p className="text-xs text-center font-medium max-w-[140px] truncate" title={aName}>{aName}</p>
                      </div>
                      <div className="flex-1 min-w-[110px] flex flex-col items-center gap-2">
                        <Image src={b?.albumArt || 'https://placehold.co/96x96.png'} alt={bName} width={96} height={96} className="rounded-md" />
                        <p className="text-xs text-center font-medium max-w-[140px] truncate" title={bName}>{bName}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="text-sm space-y-2">
                {selectedConnection.type === 'song-song' && (
                  <p><span className="font-medium">Type:</span> Song ↔ Song (same playlist)</p>
                )}
                {selectedConnection.type === 'song-playlist' && (
                  <p><span className="font-medium">Type:</span> Playlist ↔ Song (membership)</p>
                )}
                {selectedConnection.type === 'playlist-playlist' && (
                  <p><span className="font-medium">Type:</span> Playlist ↔ Playlist (shared songs)</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SongMapClient;
