
'use server';
/**
 * @fileOverview Adapts language (British English with medical terms) and therapeutic techniques based on user input and AI-inferred needs.
 *
 * - adaptLanguageAndTechniques - A function that handles the adaptation of language and techniques.
 * - AdaptLanguageAndTechniquesInput - The input type for the adaptLanguageAndTechniques function.
 * - AdaptLanguageAndTechniquesOutput - The return type for the adaptLanguageAndTechniques function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { breakupTypes } from '@/types';

// UserProfile fields are now directly part of the input schema
const AdaptLanguageAndTechniquesInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  genderIdentity: z
    .string()
    .describe('The gender identity of the user (Male/Female/Non-Binary).'),
  ethnicity: z.string().describe('The ethnicity of the user.'),
  vulnerableScore: z
    .number()
    .min(0)
    .max(10)
    .describe('The vulnerability score of the user (0-10).'),
  anxietyLevel: z.enum(['Low', 'Medium', 'High']).describe('The anxiety level of the user.'),
  breakupType: z.enum(breakupTypes).describe('The type of breakup the user experienced.'),
  additionalContext: z.string().optional().describe('Any additional context about the user, typically their background statement.'),
});
export type AdaptLanguageAndTechniquesInput = z.infer<typeof AdaptLanguageAndTechniquesInputSchema>;

const AdaptLanguageAndTechniquesOutputSchema = z.object({
  adaptedLanguage: z.string().describe('The adapted language and therapeutic techniques for the user, reflecting AI-inferred needs.'),
});
export type AdaptLanguageAndTechniquesOutput = z.infer<typeof AdaptLanguageAndTechniquesOutputSchema>;

export async function adaptLanguageAndTechniques(
  input: AdaptLanguageAndTechniquesInput
): Promise<AdaptLanguageAndTechniquesOutput> {
  return adaptLanguageAndTechniquesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptLanguageAndTechniquesPrompt',
  input: {schema: AdaptLanguageAndTechniquesInputSchema},
  output: {schema: AdaptLanguageAndTechniquesOutputSchema},
  prompt: `Based on the user's information, infer the most relevant therapeutic approaches (like CBT, IPT, Grief Counseling) that would suit their situation. Then, adapt the language and therapeutic techniques to provide relevant and hyper-personalized support. Use British English and medical terms where appropriate.

User Information:
Age: {{{age}}}
Gender Identity: {{{genderIdentity}}}
Ethnicity: {{{ethnicity}}}
Vulnerable Score: {{{vulnerableScore}}}
Anxiety Level: {{{anxietyLevel}}}
Breakup Type: {{{breakupType}}}
{{#if additionalContext}}
Background/Context: {{{additionalContext}}}
{{/if}}

Your task is to generate the 'adaptedLanguage' string. This string should describe the AI's therapeutic style and language, reflecting the needs you've inferred for this user.
Adapted Language and Techniques:`,
});

const adaptLanguageAndTechniquesFlow = ai.defineFlow(
  {
    name: 'adaptLanguageAndTechniquesFlow',
    inputSchema: AdaptLanguageAndTechniquesInputSchema,
    outputSchema: AdaptLanguageAndTechniquesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI failed to adapt language and techniques.');
    }
    return output;
  }
);
