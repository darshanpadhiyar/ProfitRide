'use server';
/**
 * @fileOverview An AI agent that predicts next day's earnings based on historical data.
 *
 * - predictDailyEarnings - A function that handles the daily earnings prediction process.
 * - PredictDailyEarningsInput - The input type for the predictDailyEarnings function.
 * - PredictDailyEarningsOutput - The return type for the predictDailyEarnings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictDailyEarningsInputSchema = z.object({
  dailyEarnings: z
    .array(z.number())
    .min(1)
    .describe(
      'An array of daily earnings for the past several days, with the most recent day last.'
    ),
});
export type PredictDailyEarningsInput = z.infer<typeof PredictDailyEarningsInputSchema>;

const PredictDailyEarningsOutputSchema = z.object({
  predictedEarnings: z.number().describe("The predicted earnings for the next day."),
});
export type PredictDailyEarningsOutput = z.infer<typeof PredictDailyEarningsOutputSchema>;

export async function predictDailyEarnings(
  input: PredictDailyEarningsInput
): Promise<PredictDailyEarningsOutput> {
  return predictDailyEarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictDailyEarningsPrompt',
  input: {schema: PredictDailyEarningsInputSchema},
  output: {schema: PredictDailyEarningsOutputSchema},
  prompt: `You are an AI assistant specialized in predicting daily earnings for delivery partners.

Given the following historical daily earnings data, predict the earnings for the next day.

Historical daily earnings: {{{json dailyEarnings}}}

Consider trends, averages, and any potential patterns in the provided data to make your prediction.
Your prediction should be a single numerical value representing the next day's earnings.
`,
});

const predictDailyEarningsFlow = ai.defineFlow(
  {
    name: 'predictDailyEarningsFlow',
    inputSchema: PredictDailyEarningsInputSchema,
    outputSchema: PredictDailyEarningsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
