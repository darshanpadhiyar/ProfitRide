import { config } from 'dotenv';
config();

import '@/ai/flows/predict-daily-earnings.ts';
import '@/ai/flows/mileage-improvement-suggestion.ts';
import '@/ai/flows/identify-loss-days.ts';
import '@/ai/flows/suggest-optimal-working-hours.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/predict-future-earnings.ts';
import '@/ai/flows/extract-earnings-flow.ts';
