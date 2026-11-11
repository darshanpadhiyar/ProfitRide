
"use client";

import { useState } from "react";
import { useTracker } from "@/hooks/use-tracker";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Volume2, 
  Loader2, 
  Calculator,
  Terminal,
  Zap
} from "lucide-react";
import { predictDailyEarnings } from "@/ai/flows/predict-daily-earnings";
import { mileageImprovementSuggestion } from "@/ai/flows/mileage-improvement-suggestion";
import { identifyLossDays } from "@/ai/flows/identify-loss-days";
import { suggestOptimalWorkingHours } from "@/ai/flows/suggest-optimal-working-hours";
import { predictFutureEarnings } from "@/ai/flows/predict-future-earnings";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AIPage() {
  const { entries, settings } = useTracker();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [targetHours, setTargetHours] = useState<number>(10);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = entries.find(e => e.date === todayStr);

  const playInsight = async (key: string, text: string) => {
    if (!text) return;
    setPlayingAudio(key);
    try {
      const { media } = await textToSpeech(text);
      const audio = new Audio(media);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
    } catch (e) {
      console.error(e);
      setPlayingAudio(null);
    }
  };

  const runPrediction = async () => {
    if (entries.length < 3) return alert("System requires at least 3 logs for prediction.");
    setLoading('predict');
    try {
      const res = await predictDailyEarnings({ dailyEarnings: entries.map(e => e.earnings) });
      setResults({ ...results, prediction: `Estimated Tomorrow: ₹${res.predictedEarnings}` });
    } finally {
      setLoading(null);
    }
  };

  const runFutureForecast = async () => {
    if (!todayEntry) return alert("Please log today's earnings first.");
    setLoading('forecast');
    try {
      const res = await predictFutureEarnings({
        todayEarnings: todayEntry.earnings,
        todayHours: todayEntry.onlineHours,
        targetHoursPerDay: targetHours
      });
      const forecastText = `For ${targetHours} hrs: Weekly ₹${res.forecastWeekly.toFixed(0)} | Monthly ₹${res.forecastMonthly.toFixed(0)}. ${res.insight}`;
      setResults({ ...results, forecast: forecastText });
    } finally {
      setLoading(null);
    }
  };

  const runMileageInsight = async () => {
    setLoading('mileage');
    try {
      const res = await mileageImprovementSuggestion({
        currentMileage: settings.mileage,
        targetImprovement: 5,
        distancePerWeek: entries.length > 0 ? (entries.reduce((a, b) => a + b.distance, 0) / entries.length) * 7 : 500,
        petrolPricePerLiter: settings.petrolPrice
      });
      setResults({ ...results, mileage: res.explanation });
    } finally {
      setLoading(null);
    }
  };

  const runLossCheck = async () => {
    setLoading('loss');
    try {
      const res = await identifyLossDays({
        dailyEntries: entries.map(e => ({
          date: e.date,
          earnings: e.earnings,
          tips: e.tips,
          fuelCost: e.fuelCost,
          otherExpenses: e.manualExpenses
        }))
      });
      const text = res.lossDays.length > 0 
        ? `${res.lossDays.length} loss days found. Main reasons: ${res.lossDays.map(l => l.reasons).join('. ')}` 
        : "No losses found. Your efficiency is good.";
      setResults({ ...results, losses: text });
    } finally {
      setLoading(null);
    }
  };

  const runHoursSuggest = async () => {
    setLoading('hours');
    try {
      const res = await suggestOptimalWorkingHours({
        earningsData: entries.map(e => ({
          day: new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' }),
          onlineHours: e.onlineHours,
          earnings: e.earnings,
          netProfit: e.netProfit
        }))
      });
      setResults({ ...results, hours: res.suggestions });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-6 space-y-6 pb-28">
      <header className="flex items-center gap-4 px-1">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">AI Predictions</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Smart Insights</p>
        </div>
      </header>

      <div className="grid gap-4">
        <AICard
          title="Earnings Forecast"
          icon={Calculator}
          description="Predict monthly potential"
          loading={loading === 'forecast'}
          onRun={runFutureForecast}
          result={results.forecast}
          onPlay={() => playInsight('forecast', results.forecast)}
          isPlaying={playingAudio === 'forecast'}
          color="text-secondary"
        >
          <div className="px-4 pb-4 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Hours Per Day</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={targetHours} 
                onChange={(e) => setTargetHours(Number(e.target.value))} 
                className="h-10 rounded-xl bg-muted/50 border-none font-bold text-center"
              />
              <div className="p-2 rounded-xl bg-primary/20 flex items-center justify-center font-black text-xs text-primary">
                HRS
              </div>
            </div>
          </div>
        </AICard>

        <AICard
          title="Daily Predictor"
          icon={TrendingUp}
          description="Next shift forecast"
          loading={loading === 'predict'}
          onRun={runPrediction}
          result={results.prediction}
          onPlay={() => playInsight('predict', results.prediction)}
          isPlaying={playingAudio === 'predict'}
          color="text-primary"
        />

        <AICard
          title="Mileage Tips"
          icon={Sparkles}
          description="Fuel saving tips"
          loading={loading === 'mileage'}
          onRun={runMileageInsight}
          result={results.mileage}
          onPlay={() => playInsight('mileage', results.mileage)}
          isPlaying={playingAudio === 'mileage'}
          color="text-emerald-400"
        />

        <AICard
          title="Loss Finder"
          icon={AlertTriangle}
          description="Find high expense days"
          loading={loading === 'loss'}
          onRun={runLossCheck}
          result={results.losses}
          onPlay={() => playInsight('loss', results.losses)}
          isPlaying={playingAudio === 'loss'}
          color="text-rose-400"
        />

        <AICard
          title="Best Time to Work"
          icon={Zap}
          description="Find your peak profit hours"
          loading={loading === 'hours'}
          onRun={runHoursSuggest}
          result={results.hours}
          onPlay={() => playInsight('hours', results.hours)}
          isPlaying={playingAudio === 'hours'}
          color="text-amber-400"
        />
      </div>

      <BottomNav />
    </div>
  );
}

function AICard({ title, icon: Icon, description, loading, onRun, result, onPlay, isPlaying, color, children }: any) {
  return (
    <Card className="glass rounded-3xl overflow-hidden border-none shadow-xl transition-all relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className={cn("p-2.5 rounded-2xl bg-muted/50 shadow-inner", color)}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-black uppercase tracking-tight">{title}</CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{description}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20" 
            onClick={onRun} 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Run"}
          </Button>
        </div>
      </CardHeader>
      
      {children}

      {result && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-sm font-medium leading-relaxed relative">
            <p className="pr-10 italic text-muted-foreground">{result}</p>
            <Button 
              size="icon" 
              className={cn(
                "absolute right-2 bottom-2 h-10 w-10 rounded-2xl shadow-xl transition-all",
                isPlaying ? "bg-primary animate-pulse" : "bg-card hover:bg-muted"
              )}
              onClick={onPlay}
              disabled={isPlaying}
            >
              {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className={cn("w-5 h-5", !isPlaying && "text-primary")} />}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
