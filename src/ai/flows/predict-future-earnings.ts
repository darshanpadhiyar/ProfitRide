'use server';
/**
 * @fileOverview AI flow to forecast future earnings based on today's performance and target hours.
 *
 * - predictFutureEarnings - Forecasts weekly/monthly income based on current rate and target hours.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictFutureEarningsInputSchema = z.object({
  todayEarnings: z.number().describe('Earnings made today.'),
  todayHours: z.number().describe('Hours worked today.'),
  targetHoursPerDay: z.number().describe('Target daily hours for the forecast.'),
});
export type PredictFutureEarningsInput = z.infer<typeof PredictFutureEarningsInputSchema>;

const PredictFutureEarningsOutputSchema = z.object({
  forecastWeekly: z.number().describe('Predicted weekly earnings.'),
  forecastMonthly: z.number().describe('Predicted monthly earnings.'),
  insight: z.string().describe('A motivating insight or tip based on the projection.'),
});
export type PredictFutureEarningsOutput = z.infer<typeof PredictFutureEarningsOutputSchema>;

export async function predictFutureEarnings(input: PredictFutureEarningsInput): Promise<PredictFutureEarningsOutput> {
  return predictFutureEarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictFutureEarningsPrompt',
  input: { schema: PredictFutureEarningsInputSchema },
  output: { schema: PredictFutureEarningsOutputSchema },
  prompt: `You are a financial advisor for delivery partners. 
Today, the partner earned ₹{{{todayEarnings}}} in {{{todayHours}}} hours.
They want to know what they could earn if they committed to working {{{targetHoursPerDay}}} hours every day.

Calculate:
1. The hourly rate based on today.
2. The daily potential if they hit the target hours.
3. The weekly potential (7 days).
4. The monthly potential (30 days).

Provide the numerical forecasts and a concise, high-energy motivating insight that encourages them to hit their target or explains how consistency will pay off.

Input Context:
- Today's Earnings: ₹{{{todayEarnings}}}
- Today's Hours: {{{todayHours}}}
- Target Daily Hours: {{{targetHoursPerDay}}}`,
});

const predictFutureEarningsFlow = ai.defineFlow(
  {
    name: 'predictFutureEarningsFlow',
    inputSchema: PredictFutureEarningsInputSchema,
    outputSchema: PredictFutureEarningsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
