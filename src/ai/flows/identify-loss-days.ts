'use server';
/**
 * @fileOverview Identifies days where a delivery partner incurred a net loss and provides insights into potential reasons.
 *
 * - identifyLossDays - A function that identifies loss days and provides insights.
 * - IdentifyLossDaysInput - The input type for the identifyLossDays function.
 * - IdentifyLossDaysOutput - The return type for the identifyLossDays function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyEntrySchema = z.object({
  date: z.string().describe('The date of the delivery entry in YYYY-MM-DD format.'),
  earnings: z.number().min(0).describe('Total earnings for the day.'),
  tips: z.number().min(0).describe('Total tips received for the day.'),
  fuelCost: z.number().min(0).describe('Calculated fuel cost for the day.'),
  otherExpenses: z.number().min(0).describe('Other manual expenses for the day.'),
});

const IdentifyLossDaysInputSchema = z.object({
  dailyEntries: z.array(DailyEntrySchema).describe('A list of daily delivery entries.'),
});
export type IdentifyLossDaysInput = z.infer<typeof IdentifyLossDaysInputSchema>;

const LossDayInsightSchema = z.object({
  date: z.string().describe('The date of the identified loss day.'),
  netProfit: z.number().max(-0.01).describe('The calculated net profit (which is negative) for the day.'),
  reasons: z.string().describe('Insights into potential reasons for the net loss, e.g., low earnings, high fuel cost.'),
});

const IdentifyLossDaysOutputSchema = z.object({
  lossDays: z.array(LossDayInsightSchema).describe('A list of days where a net loss was incurred, with accompanying insights.'),
});
export type IdentifyLossDaysOutput = z.infer<typeof IdentifyLossDaysOutputSchema>;

// Schema for the prompt input, containing only the pre-filtered loss days
const PromptLossDayEntrySchema = z.object({
  date: z.string().describe('The date of the delivery entry in YYYY-MM-DD format.'),
  earnings: z.number().min(0).describe('Total earnings for the day.'),
  tips: z.number().min(0).describe('Total tips received for the day.'),
  fuelCost: z.number().min(0).describe('Calculated fuel cost for the day.'),
  otherExpenses: z.number().min(0).describe('Other manual expenses for the day.'),
  netProfit: z.number().max(-0.01).describe('The calculated net profit (which is negative) for the day.'),
});

const PromptInputSchema = z.object({
  lossDays: z.array(PromptLossDayEntrySchema).describe('A list of daily delivery entries where a net loss was incurred.'),
});

const prompt = ai.definePrompt({
  name: 'identifyLossDaysPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: IdentifyLossDaysOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing delivery partner financial data. Your task is to review a list of days where a net financial loss occurred for a delivery partner.

For each loss day provided, analyze the financial breakdown (earnings, tips, fuel cost, other expenses, and the negative net profit) and identify the primary reasons that led to the loss. Provide concise, actionable insights.

Here are the loss days to analyze:

{{#if lossDays}}
  {{#each lossDays}}
    Date: {{{date}}}
    Net Profit: {{{netProfit}}}
    Earnings: {{{earnings}}}
    Tips: {{{tips}}}
    Fuel Cost: {{{fuelCost}}}
    Other Expenses: {{{otherExpenses}}}
    Insights into reasons for loss: (Based on the above data, what were the main contributing factors?)
  {{/each}}
{{else}}
  No loss days provided.
{{/if}}
`,
});

const identifyLossDaysFlow = ai.defineFlow(
  {
    name: 'identifyLossDaysFlow',
    inputSchema: IdentifyLossDaysInputSchema,
    outputSchema: IdentifyLossDaysOutputSchema,
  },
  async (input) => {
    const lossDaysForPrompt: z.infer<typeof PromptLossDayEntrySchema>[] = [];

    for (const entry of input.dailyEntries) {
      const netProfit = entry.earnings + entry.tips - (entry.fuelCost + entry.otherExpenses);
      if (netProfit < 0) {
        lossDaysForPrompt.push({
          ...entry,
          netProfit: parseFloat(netProfit.toFixed(2)), // Ensure consistent precision
        });
      }
    }

    if (lossDaysForPrompt.length === 0) {
      return { lossDays: [] };
    }

    const { output } = await prompt({ lossDays: lossDaysForPrompt });
    return output!;
  }
);

export async function identifyLossDays(input: IdentifyLossDaysInput): Promise<IdentifyLossDaysOutput> {
  return identifyLossDaysFlow(input);
}
