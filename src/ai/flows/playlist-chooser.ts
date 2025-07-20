// src/ai/flows/playlist-chooser.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending playlists based on a user-specified mood.
 *
 * The flow takes a mood as input and returns a ranked list of 3 playlists from the user's library, with AI-generated explanations for each.
 *
 * - playlistChooser - A function that handles the playlist recommendation process.
 * - PlaylistChooserInput - The input type for the playlistChooser function.
 * - PlaylistRecommendation - Represents a single playlist recommendation with its explanation.
 * - PlaylistChooserOutput - The return type for the playlistChooser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getPlaylistsWithTracks } from '@/services/spotify';
import type { Playlist } from '@/types/spotify';

const PlaylistForAISchema = z.object({
  id: z.string(),
  name: z.string(),
  trackCount: z.number(),
});

const PlaylistChooserInputSchema = z.object({
  mood: z.string().describe('The mood the user is in (e.g., chill, energetic, melancholy).'),
  playlists: z.array(PlaylistForAISchema).describe("A list of the user's available playlists to choose from."),
});
export type PlaylistChooserInput = z.infer<typeof PlaylistChooserInputSchema>;

const AIRecommendationSchema = z.object({
    playlistId: z.string().describe("The ID of the recommended playlist."),
    explanation: z.string().describe('An AI-generated explanation of why this playlist matches the mood.'),
});

const AIOutputSchema = z.object({
  recommendations: z.array(AIRecommendationSchema).length(3).describe('A ranked list of 3 playlist recommendations.'),
});

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


// This is the public-facing function that the client will call.
export async function playlistChooser(input: { mood: string }): Promise<PlaylistChooserOutput> {
  // 1. Fetch the user's playlists first.
  const { playlists } = await getPlaylistsWithTracks();
  
  // 2. Prepare the data for the AI.
  const playlistsForAI = playlists.map(p => ({
    id: p.id,
    name: p.name,
    trackCount: p.trackCount,
  }));

  // 3. Call the underlying flow with the mood and the playlist data.
  const aiOutput = await playlistChooserFlow({ mood: input.mood, playlists: playlistsForAI });

  // 4. Enrich the AI output with full playlist details.
  const enrichedRecommendations = aiOutput.recommendations.map(rec => {
    const fullPlaylist = playlists.find(p => p.id === rec.playlistId);
    if (!fullPlaylist) {
        // This case should ideally not happen if the AI follows instructions
        return null;
    }
    return {
        id: fullPlaylist.id,
        name: fullPlaylist.name,
        albumArt: fullPlaylist.albumArt,
        dateCreated: fullPlaylist.dateCreated,
        lastModified: fullPlaylist.lastModified,
        href: fullPlaylist.href,
        explanation: rec.explanation,
    };
  }).filter((rec): rec is PlaylistRecommendation => rec !== null);

  return { recommendations: enrichedRecommendations };
}

const playlistChooserPrompt = ai.definePrompt({
  name: 'playlistChooserPrompt',
  input: {
    schema: PlaylistChooserInputSchema,
  },
  output: {
    schema: AIOutputSchema,
  },
  prompt: `You are a playlist recommendation expert. Given the user's current mood, recommend three playlists that best match that mood.

  You MUST choose from the following list of the user's playlists (provided as ID, name, and track count):
  {{#each playlists}}
  - ID: {{{this.id}}}, Name: {{{this.name}}}, Tracks: {{{this.trackCount}}}
  {{/each}}

  Mood: {{{mood}}}

  For each playlist, provide a brief explanation of why it matches the given mood. The playlists must be different.

  Return the recommendations as a JSON object. Ensure the 'recommendations' field is an array of exactly 3 objects, each with a 'playlistId' and an 'explanation'.
  `,
});

const playlistChooserFlow = ai.defineFlow(
  {
    name: 'playlistChooserFlow',
    inputSchema: PlaylistChooserInputSchema,
    outputSchema: AIOutputSchema,
  },
  async input => {
    const {output} = await playlistChooserPrompt(input);
    return output!;
  }
);
