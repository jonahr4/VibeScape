"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SongMapWrapper from "@/components/song-map-wrapper"
import PlaylistChooser from "@/components/playlist-chooser"
import Header from "@/components/header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Music, Star, AlertCircle, X } from "lucide-react"
import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

function SongMapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-[60vh] w-full" />
    </div>
  )
}

export default function Home() {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(true);
  const [showError, setShowError] = useState(true);
  
  const error = searchParams.get('error');
  const authSuccess = searchParams.get('auth') === 'success';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        {error && showError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              <div className="flex justify-between items-start">
                <div>
                  {error === 'access_denied' && 'You denied access to your Spotify account.'}
                  {error === 'state_mismatch' && 'Security validation failed. Please try logging in again.'}
                  {error === 'token_exchange_failed' && 'Failed to get access token. Please try again.'}
                  {error === 'no_code' && 'No authorization code received from Spotify.'}
                  {error === 'no_state' && 'Missing security parameters.'}
                  {!['access_denied', 'state_mismatch', 'token_exchange_failed', 'no_code', 'no_state'].includes(error) && 
                    `Unknown error: ${error}`}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowError(false)}
                  className="h-auto p-1 hover:bg-destructive/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {authSuccess && showSuccess && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Successfully Connected!</AlertTitle>
            <AlertDescription>
              <div className="flex justify-between items-start">
                <div>
                  You're now connected to Spotify. You can explore your music library below.
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSuccess(false)}
                  className="h-auto p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="song-map" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="song-map"><Music className="mr-2 h-4 w-4" />Song Map</TabsTrigger>
            <TabsTrigger value="playlist-chooser"><Star className="mr-2 h-4 w-4" />Playlist Chooser</TabsTrigger>
          </TabsList>
          <TabsContent value="song-map" className="mt-6">
            <SongMapWrapper />
          </TabsContent>
          <TabsContent value="playlist-chooser" className="mt-6">
            <PlaylistChooser />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
