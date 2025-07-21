'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Terminal, RefreshCw } from 'lucide-react';
import SongMapClient from './song-map-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Playlist, Song } from '@/types/spotify';

export default function SongMapWrapper() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('spotify_access_token');
      if (!token) {
        throw new Error('Not authenticated with Spotify. Please sign in.');
      }
      
      console.log('Fetching playlist and song data from API...');
      const response = await fetch('/api/spotify/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('spotify_access_token');
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Got playlists:', data.playlists?.length || 0);
      console.log('Got songs:', data.songs?.length || 0);
      
      setPlaylists(data.playlists || []);
      setSongs(data.songs || []);
      
    } catch (err: any) {
      console.error('Error fetching Spotify data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Interactive Song Map</CardTitle>
          <CardDescription>Loading your music library...</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-[60vh] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Spotify Data</AlertTitle>
        <AlertDescription>
          <div className="space-y-3">
            <p>Could not fetch data from Spotify. Please check the details below:</p>
            <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 p-2 font-mono text-xs">
              {error}
            </pre>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Interactive Song Map</CardTitle>
        <CardDescription>Explore your music library as a visual graph. Pan and zoom to discover connections.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <SongMapClient allPlaylists={playlists} allSongs={songs} />
      </CardContent>
    </Card>
  );
}
