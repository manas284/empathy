
'use server';

/**
 * @fileOverview AI flow to analyze user profile, identify therapeutic needs, and generate personalized therapy recommendations.
 *
 * - personalizeTherapyRecommendations - A function that identifies needs and generates therapy recommendations.
 * - PersonalizeTherapyRecommendationsInput - The input type for the personalizeTherapyRecommendations function.
 * - PersonalizedTherapyOutput - The return type for the personalizeTherapyRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { breakupTypes } from '@/types';

// UserProfile fields are now directly part of the input schema
const PersonalizeTherapyRecommendationsInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  genderIdentity: z.string().describe('The gender identity of the user (Male, Female, Non-Binary).'),
  ethnicity: z.string().describe('The ethnicity of the user.'),
  vulnerableScore: z
    .number()
    .min(0)
    .max(10)
    .describe('A score indicating the user vulnerability (0-10).'),
  anxietyLevel: z.enum(['Low', 'Medium', 'High']).describe('The anxiety level of the user.'),
  breakupType: z.enum(breakupTypes).describe('The type of breakup the user experienced.'),
  background: z.string().describe('Relevant background information about the user.'),
});
export type PersonalizeTherapyRecommendationsInput = z.infer<
  typeof PersonalizeTherapyRecommendationsInputSchema
>;

const PersonalizedTherapyOutputSchema = z.object({
  identifiedTherapeuticNeeds: z.array(z.string()).describe('Therapeutic needs identified by the AI (e.g., CBT, IPT, Grief Counseling).'),
  recommendations: z.string().describe('Personalized therapy recommendations based on the user data and identified needs.'),
});
export type PersonalizedTherapyOutput = z.infer<
  typeof PersonalizedTherapyOutputSchema
>;

export async function personalizeTherapyRecommendations(
  input: PersonalizeTherapyRecommendationsInput
): Promise<PersonalizedTherapyOutput> {
  return personalizeTherapyRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeTherapyRecommendationsPrompt',
  input: {schema: PersonalizeTherapyRecommendationsInputSchema},
  output: {schema: PersonalizedTherapyOutputSchema},
  prompt: `You are an AI therapist. Your task is to:
1. Analyze the user's profile information provided below, especially their background, age, anxiety level, and breakup type.
2. From this analysis, identify the primary therapeutic needs or approaches (such as CBT, IPT, Grief Counseling, or others if more appropriate) that would be most beneficial for the user. Populate the 'identifiedTherapeuticNeeds' field with these.
3. Based on these AI-identified needs and the overall user profile, generate tailored therapy recommendations. These recommendations should be empathetic, contextually relevant, and actionable. Populate the 'recommendations' field.
Use British English with medical terms where appropriate.

User Profile:
Age: {{{age}}}
Gender Identity: {{{genderIdentity}}}
Ethnicity: {{{ethnicity}}}
Vulnerable Score: {{{vulnerableScore}}}
Anxiety Level: {{{anxietyLevel}}}
Breakup Type: {{{breakupType}}}
Background: {{{background}}}

Output Instructions:
Ensure your output strictly follows the JSON schema, providing both 'identifiedTherapeuticNeeds' as an array of strings and 'recommendations' as a string.
`,
});

const personalizeTherapyRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizeTherapyRecommendationsFlow',
    inputSchema: PersonalizeTherapyRecommendationsInputSchema,
    outputSchema: PersonalizedTherapyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate recommendations and identify needs.');
    }
    return output;
  }
);
