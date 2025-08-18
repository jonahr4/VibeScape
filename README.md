# VibeScape: Your Personal Music Universe

VibeScape is an experimental music discovery and visualization tool that connects to your Spotify account to help you find the perfect playlist for any mood and explore the hidden connections within your music library. It uses a combination of data visualization and cutting-edge AI to provide a unique and insightful look into your musical taste.

## Key Features

- **Interactive Song Map**: A stunning visual graph of your playlists and songs.
  - **Visual Clusters**: Playlists are represented as large colored circles, with their constituent songs clustered around them.
  - **Song Connections**: Lines are drawn between songs that appear in the same playlist, revealing the musical fabric of your library.
  - **Popularity-Based Sizing**: Song nodes are sized based on their popularity on Spotify, making it easy to spot your most popular tracks.
  - **Rich Filtering & Sorting**: Easily select which playlists to display, filter by the number of top or random songs, and sort your playlists by name, date created, or last modified.
  - **Search**: Quickly find specific playlists within your library.

- **AI Playlist Chooser**: An intelligent assistant to find the perfect vibe.
  - **Mood-Based Recommendations**: Simply enter a mood (e.g., "rainy day study," "energetic workout," "melancholic evening"), and the AI will recommend the top 3 playlists from your library that match.
  - **Advanced Hybrid Algorithm**: VibeScape uses a sophisticated, multi-step process that blends AI analysis with algorithmic sampling to ensure high-quality, transparent recommendations.
  - **"How It Works" Transparency**: An in-app dialog explains the exact steps the algorithm takes, so you know it's more than just a guess.

## Local Setup and Configuration Guide (A-Z)

This guide walks you through running VibeScape locally using Spotify Sign-In (OAuth).

### Step 1: Prerequisites

- Node.js 18+ (or 20 LTS), npm, and Git.

### Step 2: Clone and Install

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### Step 3: Create a Spotify App (OAuth)

1. Go to the Spotify Developer Dashboard: https://developer.spotify.com/dashboard
2. Create an app (e.g., “VibeScape Local”).
3. Under Settings, add a Redirect URI: `http://localhost:9002/api/auth/callback/spotify` and save.
4. Note your Client ID and Client Secret.

### Step 4: Environment Variables

Create a `.env` file with:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=any-long-random-string
```

Tip: Use `openssl rand -base64 32` (or any generator) for `NEXTAUTH_SECRET`.

### Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:9002 and click “Sign in with Spotify”. The app will request playlist read scopes and securely manage access/refresh tokens.
