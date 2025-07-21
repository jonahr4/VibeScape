'use client';

import { useState, useEffect } from 'react';
import SpotifyLoginButton from './spotify-login-button';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, User } from 'lucide-react';

interface SpotifyUser {
  display_name: string;
  images: { url: string; height: number; width: number }[];
  id: string;
}

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<SpotifyUser | null>(null);

  useEffect(() => {
    // Check if user is authenticated by looking for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('auth') === 'success') {
      const token = urlParams.get('token');
      
      if (token) {
        // Store token in localStorage for now
        localStorage.setItem('spotify_access_token', token);
        setIsAuthenticated(true);
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    // Check if we have a stored token
    const storedToken = localStorage.getItem('spotify_access_token');
    if (storedToken) {
      setIsAuthenticated(true);
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('spotify_access_token');
      if (!token) return;
      
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const user = await response.json();
        setUserInfo(user);
        setIsAuthenticated(true);
      } else {
        // Token might be expired
        localStorage.removeItem('spotify_access_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('spotify_access_token');
      setIsAuthenticated(false);
      setUserInfo(null);
      // Refresh the page to reset state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get the best profile image (prefer medium size)
  const getProfileImage = () => {
    if (!userInfo?.images || userInfo.images.length === 0) return null;
    
    // Try to find a medium-sized image (around 64px), otherwise use the first one
    const mediumImage = userInfo.images.find(img => img.height && img.height >= 60 && img.height <= 300);
    return mediumImage?.url || userInfo.images[0]?.url;
  };

  return (
    <header className="p-4 border-b shrink-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline">VibeScape</h1>
          <p className="text-muted-foreground">Visualize your music, find your vibe.</p>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && userInfo ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={getProfileImage() || undefined} 
                    alt={userInfo.display_name || 'User'} 
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userInfo.display_name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <SpotifyLoginButton />
          )}
        </div>
      </div>
    </header>
  );
}
