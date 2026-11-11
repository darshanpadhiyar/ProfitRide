'use server';
/**
 * @fileOverview AI flow to extract delivery performance data from screenshots.
 *
 * - extractEarnings - Extracts orders, earnings, incentive, and hours from an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractEarningsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a delivery earnings dashboard, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEarningsInput = z.infer<typeof ExtractEarningsInputSchema>;

const ExtractEarningsOutputSchema = z.object({
  orders: z.number().describe('The total number of orders completed.'),
  earnings: z.number().describe('The base order earnings (excluding incentives and tips).'),
  incentive: z.number().describe('The total incentives or bonuses earned.'),
  tips: z.number().describe('Total tips or "other earnings" reported.'),
  onlineHours: z.number().describe('Total online/login hours as a decimal (e.g., 4.5 for 4h 30m).'),
  date: z.string().optional().describe('The date found in the screenshot in YYYY-MM-DD format if visible.'),
});
export type ExtractEarningsOutput = z.infer<typeof ExtractEarningsOutputSchema>;

export async function extractEarnings(input: ExtractEarningsInput): Promise<ExtractEarningsOutput> {
  return extractEarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractEarningsPrompt',
  input: { schema: ExtractEarningsInputSchema },
  output: { schema: ExtractEarningsOutputSchema },
  prompt: `You are a high-precision OCR assistant for delivery partners.
Analyze the provided screenshot of a delivery app earnings dashboard.
Extract the following fields accurately:
- Total Orders (usually labeled "Orders")
- Order Earnings (usually labeled "Order earning")
- Incentive (usually labeled "Incentive")
- Other Earnings/Tips (usually labeled "Other earnings" or "Tips")
- Login Hours (usually in HH:MM format, e.g., "04:41"). Convert this to a decimal number (e.g., 4:30 becomes 4.5).
- Date (look for a date like "24 June" and convert to YYYY-MM-DD format using the year 2026 if not specified).

If a field is not found, default it to 0.

Screenshot: {{media url=photoDataUri}}`,
});

const extractEarningsFlow = ai.defineFlow(
  {
    name: 'extractEarningsFlow',
    inputSchema: ExtractEarningsInputSchema,
    outputSchema: ExtractEarningsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
