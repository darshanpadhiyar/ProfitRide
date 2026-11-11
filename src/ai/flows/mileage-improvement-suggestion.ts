'use server';
/**
 * @fileOverview Provides AI insights for delivery partners to understand potential fuel savings
 * if vehicle mileage improves. It calculates and suggests weekly, monthly, and yearly savings.
 *
 * - mileageImprovementSuggestion - A function that calculates potential fuel savings.
 * - MileageImprovementSuggestionInput - The input type for the mileageImprovementSuggestion function.
 * - MileageImprovementSuggestionOutput - The return type for the mileageImprovementSuggestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MileageImprovementSuggestionInputSchema = z.object({
  currentMileage: z.number().positive().describe('The vehicle\'s current mileage in kilometers per liter (km/l).'),
  targetImprovement: z.number().positive().describe('The desired improvement in mileage in kilometers per liter (km/l).'),
  distancePerWeek: z.number().positive().describe('The average distance driven per week in kilometers (km).'),
  petrolPricePerLiter: z.number().positive().describe('The current price of petrol per liter in Rupees (₹/liter).'),
});
export type MileageImprovementSuggestionInput = z.infer<typeof MileageImprovementSuggestionInputSchema>;

const MileageImprovementSuggestionOutputSchema = z.object({
  potentialSavingsPerWeek: z.number().describe('The estimated weekly savings in Rupees (₹).'),
  potentialSavingsPerMonth: z.number().describe('The estimated monthly savings in Rupees (₹).'),
  potentialSavingsPerYear: z.number().describe('The estimated annual savings in Rupees (₹).'),
  explanation: z.string().describe('A detailed explanation of the potential savings.'),
});
export type MileageImprovementSuggestionOutput = z.infer<typeof MileageImprovementSuggestionOutputSchema>;

export async function mileageImprovementSuggestion(
  input: MileageImprovementSuggestionInput
): Promise<MileageImprovementSuggestionOutput> {
  return mileageImprovementSuggestionFlow(input);
}

const mileageImprovementSuggestionPrompt = ai.definePrompt({
  name: 'mileageImprovementSuggestionPrompt',
  input: { schema: MileageImprovementSuggestionOutputSchema.omit({ explanation: true }).extend({ 
    currentMileage: z.number(),
    targetImprovement: z.number(),
    distancePerWeek: z.number(),
    petrolPricePerLiter: z.number()
  }) },
  output: { schema: MileageImprovementSuggestionOutputSchema },
  prompt: `Based on your current mileage of {{{currentMileage}}} km/l, if you improve your vehicle's mileage by {{{targetImprovement}}} km/l (to a new mileage of {{{currentMileage}}}+{{{targetImprovement}}}={{currentMileagePlusTargetImprovement}} km/l),
and you drive approximately {{{distancePerWeek}}} km per week with petrol costing ₹{{{petrolPricePerLiter}}} per liter:

*   Your estimated weekly fuel savings would be ₹{{potentialSavingsPerWeek}}.
*   Your estimated monthly fuel savings would be ₹{{potentialSavingsPerMonth}}.
*   Your estimated annual fuel savings would be ₹{{potentialSavingsPerYear}}.

This calculation highlights the significant financial benefits of improving your vehicle's fuel efficiency through maintenance or an eco-friendly driving style.`,
});

const mileageImprovementSuggestionFlow = ai.defineFlow(
  {
    name: 'mileageImprovementSuggestionFlow',
    inputSchema: MileageImprovementSuggestionInputSchema,
    outputSchema: MileageImprovementSuggestionOutputSchema,
  },
  async (input) => {
    const { currentMileage, targetImprovement, distancePerWeek, petrolPricePerLiter } = input;

    // Calculate initial fuel consumption
    const initialFuelConsumptionPerWeek = distancePerWeek / currentMileage;

    // Calculate improved mileage
    const improvedMileage = currentMileage + targetImprovement;
    if (improvedMileage <= 0) {
        throw new Error("Improved mileage cannot be zero or negative. Please check current mileage and target improvement.");
    }

    // Calculate improved fuel consumption
    const improvedFuelConsumptionPerWeek = distancePerWeek / improvedMileage;

    // Calculate fuel saved
    const fuelSavedPerWeek = initialFuelConsumptionPerWeek - improvedFuelConsumptionPerWeek;

    // Calculate potential savings
    const potentialSavingsPerWeek = parseFloat((fuelSavedPerWeek * petrolPricePerLiter).toFixed(2));
    const potentialSavingsPerMonth = parseFloat((potentialSavingsPerWeek * 4).toFixed(2)); // Approx 4 weeks per month
    const potentialSavingsPerYear = parseFloat((potentialSavingsPerWeek * 52).toFixed(2));

    const promptInput = {
      ...input,
      potentialSavingsPerWeek,
      potentialSavingsPerMonth,
      potentialSavingsPerYear,
      currentMileagePlusTargetImprovement: improvedMileage,
    };

    const { output } = await mileageImprovementSuggestionPrompt(promptInput);
    return output!;
  }
);
