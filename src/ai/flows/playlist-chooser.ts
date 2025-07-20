// src/ai/flows/playlist-chooser.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending playlists based on a user-specified mood using a hybrid AI and algorithmic approach.
 *
 * - playlistChooser - The main public function that orchestrates the recommendation process.
 * - PlaylistChooserInput - The input type for the playlistChooser function.
 * - PlaylistRecommendation - Represents a single playlist recommendation with its explanation.
 * - PlaylistChooserOutput - The return type for the playlistChooser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getPlaylistsWithTracks } from '@/services/spotify';
import type { Playlist, Song } from '@/types/spotify';

// == Main Public-Facing Function and Types =================================
// These are the primary exports used by the application UI.

export type PlaylistChooserInput = {
  mood: string;
};

const PlaylistRecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  albumArt: z.string().nullable(),
  dateCreated: z.string().nullable(),
  lastModified: z.string().nullable(),
  href: z.string(),
  explanation: z.string(),
});
export type PlaylistRecommendation = z.infer<typeof PlaylistRecommendationSchema>;

const PlaylistChooserOutputSchema = z.object({
  recommendations: z.array(PlaylistRecommendationSchema),
});
export type PlaylistChooserOutput = z.infer<typeof PlaylistChooserOutputSchema>;


/**
 * Recommends 3 playlists based on a user's mood using a hybrid AI and algorithmic approach.
 * @param {PlaylistChooserInput} input - The user's mood.
 * @returns {Promise<PlaylistChooserOutput>} A promise that resolves to the recommended playlists.
 */
export async function playlistChooser({ mood }: PlaylistChooserInput): Promise<PlaylistChooserOutput> {
  const allUserPlaylists = await getPlaylistsWithTracks();
  const enrichedRecommendations = await advancedPlaylistChooserFlow({ 
      mood, 
      allPlaylists: allUserPlaylists,
  });

  return { recommendations: enrichedRecommendations };
}


// == Internal AI and Algorithmic Flow ======================================
// The following section defines the multi-step process for recommendation.

const SongForAISchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string(),
});

const AdvancedFlowInputSchema = z.object({
    mood: z.string(),
    allPlaylists: z.any(), // Using any to avoid circular dependencies with full Playlist type
});

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


// -- AI Step 1: Pre-filter playlists if there are too many ------------------

const PlaylistFilterInputSchema = z.object({
  mood: z.string(),
  playlists: z.array(z.object({ id: z.string(), name: z.string(), trackCount: z.number() })),
});
const PlaylistFilterOutputSchema = z.object({
  playlistIds: z.array(z.string()).length(15).describe("An array of exactly 15 playlist IDs that are the best contenders for the mood."),
});

const playlistFilterPrompt = ai.definePrompt({
    name: 'playlistFilterPrompt',
    input: { schema: PlaylistFilterInputSchema },
    output: { schema: PlaylistFilterOutputSchema },
    prompt: `You are a music expert. From the list of playlists provided, select the 15 that are most likely to match the user's mood.

    User's Mood: {{{mood}}}
    
    Playlists:
    {{#each playlists}}
    - ID: {{{this.id}}}, Name: "{{{this.name}}}" ({{this.trackCount}} tracks)
    {{/each}}
    
    Return ONLY the 15 most relevant playlist IDs.`,
});


// -- AI Step 2: Rank sampled songs by mood ----------------------------------

const SongRankingInputSchema = z.object({
    mood: z.string(),
    songs: z.array(SongForAISchema),
});
const SongRankingOutputSchema = z.object({
    rankedSongIds: z.array(z.string()).describe("An array of song IDs, sorted from most to least fitting for the mood."),
});

const songRankingPrompt = ai.definePrompt({
    name: 'songRankingPrompt',
    input: { schema: SongRankingInputSchema },
    output: { schema: SongRankingOutputSchema },
    prompt: `You are a music expert. A user wants to find songs that fit a specific mood.
    
    User's Mood: {{{mood}}}
    
    Here is a list of songs. Please rank them based on how well they fit this mood.
    Songs:
    {{#each songs}}
    - ID: {{{this.id}}}, Name: "{{{this.name}}}" by {{{this.artist}}}
    {{/each}}

    Return an array of the song IDs, sorted from the best match to the worst.`,
});


// -- The Main Orchestrator Flow ----------------------------------------------
const advancedPlaylistChooserFlow = ai.defineFlow({
    name: 'advancedPlaylistChooserFlow',
    inputSchema: AdvancedFlowInputSchema,
    outputSchema: z.array(PlaylistRecommendationSchema),
}, async ({ mood, allPlaylists }) => {
    
    // 1. Determine contender playlists
    let contenderPlaylists: Playlist[] = allPlaylists;
    if (allPlaylists.length > 15) {
        const playlistInfoForAI = allPlaylists.map(p => ({ id: p.id, name: p.name, trackCount: p.trackCount }));
        const { output } = await playlistFilterPrompt({ mood, playlists: playlistInfoForAI });
        if (output) {
            const contenderIds = new Set(output.playlistIds);
            contenderPlaylists = allPlaylists.filter(p => contenderIds.has(p.id));
        }
    }

    // 2. Sample songs from contender playlists
    const sampledSongs = new Map<string, Song>();
    contenderPlaylists.forEach(playlist => {
        const randomSample = shuffleArray(playlist.tracks).slice(0, 30);
        randomSample.forEach(song => {
            if (!sampledSongs.has(song.id)) {
                sampledSongs.set(song.id, song);
            }
        });
    });
    const songListForAI = Array.from(sampledSongs.values()).map(s => ({
        id: s.id,
        name: s.name,
        artist: s.artist,
    }));

    // 3. Rank the sampled songs using AI
    const { output: rankedSongOutput } = await songRankingPrompt({ mood, songs: songListForAI });
    if (!rankedSongOutput) {
        throw new Error("AI failed to rank the songs.");
    }
    const top30SongIds = new Set(rankedSongOutput.rankedSongIds.slice(0, 30));

    // 4. Score playlists based on top songs
    const playlistScores: Record<string, number> = {};
    contenderPlaylists.forEach(playlist => {
        let score = 0;
        playlist.tracks.forEach(track => {
            if (top30SongIds.has(track.id)) {
                score++;
            }
        });
        playlistScores[playlist.id] = score;
    });

    // 5. Select top 3 playlists
    const top3PlaylistIds = Object.entries(playlistScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);

    // 6. Generate final explanations and format output
    const finalRecommendations: PlaylistRecommendation[] = [];
    for (const playlistId of top3PlaylistIds) {
        const playlist = allPlaylists.find(p => p.id === playlistId);
        if (playlist) {
            const topHitsCount = playlistScores[playlistId];
            const explanation = `This playlist is a great fit for a "${mood}" vibe, featuring ${topHitsCount} of the top 30 songs identified by our AI as matching your mood.`;
            finalRecommendations.push({
                id: playlist.id,
                name: playlist.name,
                albumArt: playlist.albumArt,
                dateCreated: playlist.dateCreated,
                lastModified: playlist.lastModified,
                href: playlist.href,
                explanation,
            });
        }
    }
    
    return finalRecommendations;
});
