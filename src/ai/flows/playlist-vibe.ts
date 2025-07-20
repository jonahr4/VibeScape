'use server';

/**
 * @fileOverview An AI agent that generates a short "vibe" for a Spotify playlist.
 *
 * - generatePlaylistVibe - A function that handles the vibe generation process.
 * - GeneratePlaylistVibeInput - The input type for the generatePlaylistVibe function.
 * - GeneratePlaylistVibeOutput - The return type for the generatePlaylistVibe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePlaylistVibeInputSchema = z.object({
  name: z.string().describe('The name of the playlist.'),
  trackCount: z.number().describe('The number of tracks in the playlist.'),
});
export type GeneratePlaylistVibeInput = z.infer<typeof GeneratePlaylistVibeInputSchema>;

const GeneratePlaylistVibeOutputSchema = z.object({
  vibe: z.string().describe("A short, 2-3 word vibe or feeling for the playlist (e.g., 'Late Night Chill', 'Workout Fuel', 'Indie Summer')."),
});
export type GeneratePlaylistVibeOutput = z.infer<typeof GeneratePlaylistVibeOutputSchema>;

export async function generatePlaylistVibe(input: GeneratePlaylistVibeInput): Promise<GeneratePlaylistVibeOutput> {
  return generatePlaylistVibeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlaylistVibePrompt',
  input: {schema: GeneratePlaylistVibeInputSchema},
  output: {schema: GeneratePlaylistVibeOutputSchema},
  prompt: `You are a music expert who is great at capturing the essence of a playlist in a few words.
  
  Based on the playlist name and track count, generate a short, catchy "vibe" for it.
  The vibe should be 2-3 words max.

  Examples:
  - Name: "Sad Girl Starter Pack", Vibe: "Melancholy Mood"
  - Name: "Gym Beast Mode", Vibe: "Workout Fuel"
  - Name: "Coffee Shop Acoustics", Vibe: "Chill Study"
  - Name: "90s Rock Anthems", Vibe: "Retro Rock"

  Playlist Name: {{{name}}}
  Number of Tracks: {{{trackCount}}}
  `,
});

const generatePlaylistVibeFlow = ai.defineFlow(
  {
    name: 'generatePlaylistVibeFlow',
    inputSchema: GeneratePlaylistVibeInputSchema,
    outputSchema: GeneratePlaylistVibeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
