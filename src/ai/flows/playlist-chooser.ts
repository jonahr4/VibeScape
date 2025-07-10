// src/ai/flows/playlist-chooser.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending playlists based on a user-specified mood.
 *
 * The flow takes a mood as input and returns a ranked list of 3 playlists, with AI-generated explanations for each.
 *
 * - playlistChooser - A function that handles the playlist recommendation process.
 * - PlaylistChooserInput - The input type for the playlistChooser function.
 * - PlaylistRecommendation - Represents a single playlist recommendation with its explanation.
 * - PlaylistChooserOutput - The return type for the playlistChooser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlaylistChooserInputSchema = z.object({
  mood: z.string().describe('The mood the user is in (e.g., chill, energetic, melancholy).'),
});
export type PlaylistChooserInput = z.infer<typeof PlaylistChooserInputSchema>;

const PlaylistRecommendationSchema = z.object({
  playlistName: z.string().describe('The name of the recommended playlist.'),
  explanation: z.string().describe('An AI-generated explanation of why this playlist matches the mood.'),
});
export type PlaylistRecommendation = z.infer<typeof PlaylistRecommendationSchema>;

const PlaylistChooserOutputSchema = z.object({
  recommendations: z.array(PlaylistRecommendationSchema).length(3).describe('A ranked list of 3 playlist recommendations.'),
});
export type PlaylistChooserOutput = z.infer<typeof PlaylistChooserOutputSchema>;

export async function playlistChooser(input: PlaylistChooserInput): Promise<PlaylistChooserOutput> {
  return playlistChooserFlow(input);
}

const playlistChooserPrompt = ai.definePrompt({
  name: 'playlistChooserPrompt',
  input: {
    schema: PlaylistChooserInputSchema,
  },
  output: {
    schema: PlaylistChooserOutputSchema,
  },
  prompt: `You are a playlist recommendation expert. Given the user's current mood, recommend three playlists from their Spotify library that best match that mood.

  Mood: {{{mood}}}

  For each playlist, provide a brief explanation of why it matches the given mood.  The playlists must be different.

  Return the recommendations as a JSON object.  Ensure the 'recommendations' field is an array of exactly 3 PlaylistRecommendation objects.
  `,
});

const playlistChooserFlow = ai.defineFlow(
  {
    name: 'playlistChooserFlow',
    inputSchema: PlaylistChooserInputSchema,
    outputSchema: PlaylistChooserOutputSchema,
  },
  async input => {
    const {output} = await playlistChooserPrompt(input);
    return output!;
  }
);
