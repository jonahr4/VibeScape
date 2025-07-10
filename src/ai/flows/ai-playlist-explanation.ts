'use server';

/**
 * @fileOverview An AI agent that provides explanations for playlist recommendations based on mood.
 *
 * - explainPlaylistChoice - A function that handles the playlist explanation process.
 * - ExplainPlaylistChoiceInput - The input type for the explainPlaylistChoice function.
 * - ExplainPlaylistChoiceOutput - The return type for the explainPlaylistChoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainPlaylistChoiceInputSchema = z.object({
  playlistName: z.string().describe('The name of the playlist.'),
  mood: z.string().describe('The mood the user is in.'),
  playlistDescription: z.string().describe('Description of the playlist including tempo, genre, and lyrical content.'),
});
export type ExplainPlaylistChoiceInput = z.infer<typeof ExplainPlaylistChoiceInputSchema>;

const ExplainPlaylistChoiceOutputSchema = z.object({
  explanation: z.string().describe('The explanation of why the playlist fits the mood.'),
});
export type ExplainPlaylistChoiceOutput = z.infer<typeof ExplainPlaylistChoiceOutputSchema>;

export async function explainPlaylistChoice(input: ExplainPlaylistChoiceInput): Promise<ExplainPlaylistChoiceOutput> {
  return explainPlaylistChoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainPlaylistChoicePrompt',
  input: {schema: ExplainPlaylistChoiceInputSchema},
  output: {schema: ExplainPlaylistChoiceOutputSchema},
  prompt: `You are an AI music expert who explains why a given playlist matches a user's mood.

  The user is in the mood for: {{{mood}}}
  The playlist is called: {{{playlistName}}}
  Description of the playlist: {{{playlistDescription}}}

  Explain why this playlist is a good choice for the user's mood. Highlight the key characteristics of the playlist such as tempo, genre mix and lyrical content. 
  Be concise.
  `,
});

const explainPlaylistChoiceFlow = ai.defineFlow(
  {
    name: 'explainPlaylistChoiceFlow',
    inputSchema: ExplainPlaylistChoiceInputSchema,
    outputSchema: ExplainPlaylistChoiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
