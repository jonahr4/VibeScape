"use client";

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock Data
const playlists = [
  { id: 'p1', name: 'Ambient Focus', color: 'rgba(233, 30, 99, 0.25)', lineColor: 'rgba(233, 30, 99, 0.5)' },
  { id: 'p2', name: 'Late Night Jazz', color: 'rgba(103, 58, 183, 0.25)', lineColor: 'rgba(103, 58, 183, 0.5)' },
  { id: 'p3', name: 'Indie Workout', color: 'rgba(0, 150, 136, 0.25)', lineColor: 'rgba(0, 150, 136, 0.5)' },
  { id: 'p4', name: 'Summer Hits', color: 'rgba(255, 193, 7, 0.25)', lineColor: 'rgba(255, 193, 7, 0.5)' },
  { id: 'p5', name: 'Coding Flow', color: 'rgba(3, 169, 244, 0.25)', lineColor: 'rgba(3, 169, 244, 0.5)' },
];

const songs = [
  // Playlist 1 specific
  { id: 's1', name: 'Mirage', artist: 'Else', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1'], dataAiHint: 'abstract album-art' },
  { id: 's2', name: 'Aurora', artist: 'Tycho', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1'], dataAiHint: 'sunrise landscape' },
  // Playlist 2 specific
  { id: 's3', name: 'So What', artist: 'Miles Davis', albumArt: 'https://placehold.co/100x100.png', playlists: ['p2'], dataAiHint: 'jazz saxophone' },
  { id: 's4', name: 'My Funny Valentine', artist: 'Chet Baker', albumArt: 'https://placehold.co/100x100.png', playlists: ['p2'], dataAiHint: 'trumpet rain' },
  // Playlist 3 specific
  { id: 's5', name: 'Lisztomania', artist: 'Phoenix', albumArt: 'https://placehold.co/100x100.png', playlists: ['p3'], dataAiHint: 'indie band' },
  { id: 's6', name: 'Tongue Tied', artist: 'Grouplove', albumArt: 'https://placehold.co/100x100.png', playlists: ['p3'], dataAiHint: 'colorful abstract' },
  // Playlist 4 specific
  { id: 's7', name: 'Blinding Lights', artist: 'The Weeknd', albumArt: 'https://placehold.co/100x100.png', playlists: ['p4'], dataAiHint: '80s retro' },
  { id: 's8', name: 'Watermelon Sugar', artist: 'Harry Styles', albumArt: 'https://placehold.co/100x100.png', playlists: ['p4'], dataAiHint: 'summer beach' },
  // Playlist 5 specific
  { id: 's15', name: 'Genesis', artist: 'Grimes', albumArt: 'https://placehold.co/100x100.png', playlists: ['p5'], dataAiHint: 'futuristic pop' },
  { id: 's16', name: 'Midnight City', artist: 'M83', albumArt: 'https://placehold.co/100x100.png', playlists: ['p5'], dataAiHint: 'night city' },

  // Shared songs
  { id: 's9', name: 'Shared Dream', artist: 'The Collaborators', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1', 'p2'], dataAiHint: 'dreamy landscape' },
  { id: 's10', name: 'Workout Groove', artist: 'The Upbeats', albumArt: 'https://placehold.co/100x100.png', playlists: ['p3', 'p5'], dataAiHint: 'energetic neon' },
  { id: 's11', name: 'Summer Jazz', artist: 'The Mixers', albumArt: 'https://placehold.co/100x100.png', playlists: ['p2', 'p4'], dataAiHint: 'sunset jazz' },
  { id: 's12', name: 'Indie Chill', artist: 'The Relaxers', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1', 'p3'], dataAiHint: 'forest path' },

  // Very popular song
  { id: 's13', name: 'Everywhere', artist: 'Universal Artist', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1', 'p3', 'p4'], dataAiHint: 'world map' },
  { id: 's14', name: 'The Anthem', artist: 'Super Popular', albumArt: 'https://placehold.co/100x100.png', playlists: ['p1', 'p2', 'p3', 'p4', 'p5'], dataAiHint: 'gold star' },
];

const MAP_SIZE = 2000;
const PLAYLIST_RADIUS = 350;

type Vector2D = { x: number; y: number; };
type Transform = { x: number; y: number; scale: number; };

const SongMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.4 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Vector2D>({ x: 0, y: 0 });

  const playlistPositions = useMemo(() => {
    const positions: Record<string, Vector2D> = {};
    const angleStep = (2 * Math.PI) / playlists.length;
    const radius = MAP_SIZE / 3;
    playlists.forEach((p, i) => {
      positions[p.id] = {
        x: MAP_SIZE / 2 + radius * Math.cos(angleStep * i - Math.PI / 2),
        y: MAP_SIZE / 2 + radius * Math.sin(angleStep * i - Math.PI / 2),
      };
    });
    return positions;
  }, []);

  const songPositions = useMemo(() => {
    const positions: Record<string, Vector2D> = {};
    songs.forEach(song => {
      const parentPlaylists = song.playlists.map(pid => playlistPositions[pid]);
      const JITTER_STRENGTH = 150;
      if (parentPlaylists.length > 0) {
        const centroid = parentPlaylists.reduce(
          (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
          { x: 0, y: 0 }
        );
        positions[song.id] = {
          x: centroid.x / parentPlaylists.length + (Math.random() - 0.5) * JITTER_STRENGTH,
          y: centroid.y / parentPlaylists.length + (Math.random() - 0.5) * JITTER_STRENGTH,
        };
      }
    });
    return positions;
  }, [playlistPositions]);
  
  const connections = useMemo(() => {
    const lines: { start: Vector2D; end: Vector2D; key: string, color: string }[] = [];
    const songMap = new Map(songs.map(s => [s.id, s]));

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
  }, [songPositions]);

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
     setTransform({ x: 0, y: 0, scale: 0.4 });
  }


  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Interactive Song Map</CardTitle>
        <CardDescription>Explore your music library as a visual graph. Pan and zoom to discover connections.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
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
          </div>
          <div
            className="absolute transition-transform duration-200 ease-out"
            style={{
              width: MAP_SIZE,
              height: MAP_SIZE,
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
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
                  />
                ))}
              </g>
            </svg>

            <TooltipProvider>
            {playlists.map(p => {
              const pos = playlistPositions[p.id];
              return (
                  <div
                    key={p.id}
                    className="absolute rounded-full flex items-center justify-center pointer-events-none"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: PLAYLIST_RADIUS * 2,
                      height: PLAYLIST_RADIUS * 2,
                      backgroundColor: p.color,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                     <span className="text-2xl font-bold text-foreground/70">{p.name}</span>
                  </div>
              );
            })}
            
            {songs.map(song => {
              const pos = songPositions[song.id];
              const popularity = song.playlists.length;
              const size = 32 + popularity * 8;
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
                        }}
                      >
                        <Image
                          src={song.albumArt}
                          alt={song.name}
                          width={size}
                          height={size}
                          className="rounded-full object-cover"
                          data-ai-hint={song.dataAiHint}
                        />
                      </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">{song.name}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                    <p className="text-xs mt-2">In {popularity} playlist{popularity > 1 ? 's' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongMap;
