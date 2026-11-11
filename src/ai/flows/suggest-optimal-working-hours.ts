'use server';
/**
 * @fileOverview This file implements a Genkit flow to suggest optimal working hours for delivery partners.
 *
 * - suggestOptimalWorkingHours - A function that suggests optimal working hours based on historical earnings data.
 * - SuggestOptimalWorkingHoursInput - The input type for the suggestOptimalWorkingHours function.
 * - SuggestOptimalWorkingHoursOutput - The return type for the suggestOptimalWorkingHours function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalWorkingHoursInputSchema = z.object({
  earningsData: z.array(
    z.object({
      day:
        z.string()
          .describe('The day of the week, e.g., "Monday", "Tuesday", etc.'),
      onlineHours: z.number().describe('Total online hours worked on that day.'),
      earnings: z.number().describe('Total gross earnings for that day.'),
      netProfit:
        z.number()
          .describe('Net profit for that day, after all expenses.'),
    })
  ).describe('An array of historical daily earnings data for the delivery partner.'),
});
export type SuggestOptimalWorkingHoursInput = z.infer<
  typeof SuggestOptimalWorkingHoursInputSchema
>;

const SuggestOptimalWorkingHoursOutputSchema = z.object({
  suggestions:
    z.string()
      .describe(
        'A detailed suggestion for optimal working hours and days, based on the provided historical data. Focus on maximizing net profit. Provide actionable advice for the delivery partner.'
      ),
  summaryByDay:
    z.record(
      z.string().describe('Day of the week'),
      z.object({
        averageOnlineHours: z.number().describe('Average online hours for this day.'),
        averageEarnings: z.number().describe('Average total earnings for this day.'),
        averageNetProfit: z.number().describe('Average net profit for this day.'),
      })
    )
      .describe(
        'Summary of average online hours, earnings, and net profit for each day of the week.'
      ),
  peakDays:
    z.array(z.string())
      .describe('List of days identified as having the highest average net profit.'),
  insights:
    z.array(z.string())
      .describe(
        'Key insights derived from the data, such as potential high-profit timeframes (e.g., weekends, longer shifts) or low-profit timeframes, and recommendations for improvement.'
      ),
});
export type SuggestOptimalWorkingHoursOutput = z.infer<
  typeof SuggestOptimalWorkingHoursOutputSchema
>;

export async function suggestOptimalWorkingHours(
  input: SuggestOptimalWorkingHoursInput
): Promise<SuggestOptimalWorkingHoursOutput> {
  return suggestOptimalWorkingHoursFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalWorkingHoursPrompt',
  input: {schema: SuggestOptimalWorkingHoursInputSchema},
  output: {schema: SuggestOptimalWorkingHoursOutputSchema},
  prompt: `You are an AI assistant specializing in helping delivery partners maximize their earnings.
Your task is to analyze the provided historical earnings data and suggest optimal working hours and days to maximize net profit.

Analyze the 'earningsData' array to:
1. Calculate the average online hours, earnings, and net profit for each day of the week.
2. Identify days of the week that consistently show higher net profit.
3. Provide a detailed, actionable suggestion for optimal working hours and days, considering the net profit.
4. List the 'peakDays' based on average net profit.
5. Extract specific 'insights' and recommendations from the data.

When providing 'suggestions', be as specific as possible. For example, if Sundays and Fridays have the highest net profit, suggest focusing on those days. If working longer hours on certain days correlates with higher net profit per hour, suggest that. If some days consistently have low net profit, suggest reducing hours or avoiding those days.

Here is the historical earnings data:
{{{JSON.stringify earningsData}}}
`,
});

const suggestOptimalWorkingHoursFlow = ai.defineFlow(
  {
    name: 'suggestOptimalWorkingHoursFlow',
    inputSchema: SuggestOptimalWorkingHoursInputSchema,
    outputSchema: SuggestOptimalWorkingHoursOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
