// src/components/song-map-client.tsx
"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, Maximize, Info, Music, GitBranch, Star, ListMusic, RefreshCw, Filter, Search, ArrowUp, ArrowDown } from 'lucide-react';
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


const MAP_SIZE = 4000;

type Vector2D = { x: number; y: number; };
type Transform = { x: number; y: number; scale: number; };
type Selection = { type: 'song' | 'playlist'; id: string } | null;
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

  // State for sorting and filtering playlists
  const [sortKey, setSortKey] = useState<SortKey>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');

  // State for playlist selection
  const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const sortedInitialPlaylists = [...allPlaylists].sort((a,b) => (new Date(b.lastModified!) > new Date(a.lastModified!) ? 1 : -1));
    sortedInitialPlaylists.slice(0, 4).forEach(p => {
      initialState[p.id] = true;
    });
    return initialState;
  });
  
  const [stagedSelectedPlaylists, setStagedSelectedPlaylists] = useState(selectedPlaylists);
  
  // State for song filter
  const [songCountFilter, setSongCountFilter] = useState(100);
  const [stagedSongCountFilter, setStagedSongCountFilter] = useState([100]);
  const [filterMode, setFilterMode] = useState<FilterMode>("top");
  const [stagedFilterMode, setStagedFilterMode] = useState<FilterMode>("top");

  // Filter and sort playlists for the selection sheet
  const sortedAndFilteredPlaylists = useMemo(() => {
    return allPlaylists
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
    const activePlaylists = allPlaylists.filter(p => selectedPlaylists[p.id]);
    const activePlaylistIds = new Set(activePlaylists.map(p => p.id));
    
    const songsInSelectedPlaylists = allSongs.filter(s => 
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
    const rect = containerRef.current?.getBoundingClientRect();
    if(rect) {
      setTransform(t => ({...t, x: -MAP_SIZE/2*t.scale + rect.width/2, y: -MAP_SIZE/2*t.scale + rect.height/2}));
    }
  }, []);

  useEffect(() => {
    if (stagedSongCountFilter[0] > maxSongs) {
      setStagedSongCountFilter([maxSongs]);
    }
  }, [maxSongs, stagedSongCountFilter]);

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
  
  const connections = useMemo(() => {
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
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
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
        </Card>
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
        <svg width={MAP_SIZE} height={MAP_SIZE} className="absolute top-0 left-0 pointer-events-none">
          <g>
            {connections.map(conn => {
              let isVisible = !selectionDetails;
              if (selectionDetails) {
                 if (selectionDetails.isSongSelection) {
                    isVisible = selectionDetails.connectedSongIds.has(conn.songIds[0]) && selectionDetails.connectedSongIds.has(conn.songIds[1]);
                 } else { // is playlist selection
                    isVisible = selectionDetails.connectedSongIds.has(conn.songIds[0]) && selectionDetails.connectedSongIds.has(conn.songIds[1]);
                 }
              }
              
              return (
                <line 
                  key={conn.key} 
                  x1={conn.start.x} 
                  y1={conn.start.y} 
                  x2={conn.end.x} 
                  y2={conn.end.y} 
                  stroke={conn.color} 
                  strokeWidth="2"
                  className={cn("transition-opacity duration-300", isVisible ? "opacity-70" : "opacity-10")}
                />
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
          const size = 60 + Math.pow(song.popularity / 100, 2) * 10;
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
    </div>
  );
};

export default SongMapClient;
