// src/components/song-map-client.tsx
"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, Maximize, Info, Music, GitBranch, Star, ListMusic, RefreshCw } from 'lucide-react';
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

const MAP_SIZE = 4000;

type Vector2D = { x: number; y: number; };
type Transform = { x: number; y: number; scale: number; };

interface SongMapClientProps {
  allPlaylists: Playlist[];
  allSongs: Song[];
}

const SongMapClient = ({ allPlaylists, allSongs }: SongMapClientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.2 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Vector2D>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  // State for playlist selection
  const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    // Initially select the first 7 playlists
    allPlaylists.slice(0, 7).forEach(p => {
      initialState[p.id] = true;
    });
    return initialState;
  });
  
  const [stagedSelectedPlaylists, setStagedSelectedPlaylists] = useState(selectedPlaylists);

  // Filter playlists and songs based on selection
  const { playlists, songs } = useMemo(() => {
    const activePlaylists = allPlaylists.filter(p => selectedPlaylists[p.id]);
    const activePlaylistIds = new Set(activePlaylists.map(p => p.id));
    const activeSongs = allSongs.filter(s => 
      s.playlists.some(pid => activePlaylistIds.has(pid))
    );
    return { playlists: activePlaylists, songs: activeSongs };
  }, [allPlaylists, allSongs, selectedPlaylists]);


  useEffect(() => {
    setIsClient(true);
    // Center the view on initial load
    const rect = containerRef.current?.getBoundingClientRect();
    if(rect) {
      setTransform(t => ({...t, x: -MAP_SIZE/2*t.scale + rect.width/2, y: -MAP_SIZE/2*t.scale + rect.height/2}));
    }
  }, []);

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

    const positions: Record<string, Vector2D> = {};
    const JITTER_STRENGTH = 800; // Increased jitter
    songs.forEach(song => {
      const parentPlaylists = song.playlists
        .map(pid => playlistPositions[pid])
        .filter(Boolean);
      
      if (parentPlaylists.length > 0) {
        const centroid = parentPlaylists.reduce(
          (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
          { x: 0, y: 0 }
        );
        positions[song.id] = {
          x: centroid.x / parentPlaylists.length + (Math.random() - 0.5) * JITTER_STRENGTH,
          y: centroid.y / parentPlaylists.length + (Math.random() - 0.5) * JITTER_STRENGTH,
        };
      } else {
         positions[song.id] = {
            x: MAP_SIZE / 2 + (Math.random() - 0.5) * MAP_SIZE/4,
            y: MAP_SIZE / 2 + (Math.random() - 0.5) * MAP_SIZE/4,
        };
      }
    });
    return positions;
  }, [playlistPositions, songs, isClient]);
  
  const connections = useMemo(() => {
    const lines: { start: Vector2D; end: Vector2D; key: string, color: string }[] = [];
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
              color: playlist.lineColor
            });
          }
        }
      }
    });
    return lines;
  }, [songPositions, playlists, songs]);

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
    setIsPanning(true);
    setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform(t => ({ ...t, x: e.clientX - startPan.x, y: e.clientY - startPan.y }));
  };
  
  const handleMouseUp = () => setIsPanning(false);

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
  }


  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[60vh] bg-card overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-2 left-2 z-20 flex gap-2">
        <Button size="icon" variant="secondary" onClick={() => zoom('in')}><Plus /></Button>
        <Button size="icon" variant="secondary" onClick={() => zoom('out')}><Minus /></Button>
        <Button size="icon" variant="secondary" onClick={resetView}><Maximize /></Button>
         <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="secondary"><ListMusic /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[350px] sm:w-[450px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Select Playlists</SheetTitle>
            </SheetHeader>
            <div className="relative flex-1">
              <ScrollArea className="absolute h-full w-full pr-4">
                  <div className="space-y-4">
                  {allPlaylists.map(p => (
                      <div key={p.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
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
                            </div>
                        </Label>
                      </div>
                  ))}
                  </div>
              </ScrollArea>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button onClick={() => setSelectedPlaylists(stagedSelectedPlaylists)}>
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
                        <p>The large, colored circles represent your playlists. Songs are clustered around the playlists they belong to.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Music className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-foreground">Songs</h3>
                        <p>The smaller circles with album art are individual songs. Hover over a song to see its name and artist.</p>
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
            {connections.map(conn => (
              <line 
                key={conn.key} 
                x1={conn.start.x} 
                y1={conn.start.y} 
                x2={conn.end.x} 
                y2={conn.end.y} 
                stroke={conn.color} 
                strokeWidth="2"
                opacity="0.7"
              />
            ))}
          </g>
        </svg>

        <TooltipProvider>
        {playlists.map(p => {
          const pos = playlistPositions[p.id];
          if(!pos) return null;
          const radius = 250 + p.trackCount * 2;
          return (
              <div
                key={p.id}
                className="absolute rounded-full flex items-center justify-center pointer-events-none"
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
                    className="font-bold text-foreground/80 text-center"
                    style={{ fontSize: `${Math.max(1, 2.5 / transform.scale)}rem`}}
                  >
                    {p.name}
                  </span>
              </div>
          );
        })}
        
        {songs.map(song => {
          const pos = songPositions[song.id];
          const size = 15 + Math.pow(song.popularity / 100, 2) * 250;
          if (!pos) return null;

          return (
            <Tooltip key={song.id} delayDuration={100}>
              <TooltipTrigger asChild>
                  <div
                    className="absolute rounded-full shadow-lg hover:scale-110 hover:z-10 transition-transform duration-200"
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
