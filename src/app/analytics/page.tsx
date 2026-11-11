
"use client";

import { useTracker } from "@/hooks/use-tracker";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { BarChart3, TrendingUp, PieChart, Zap, IndianRupee, Navigation, Clock, ShieldCheck, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { entries, loading } = useTracker();

  const chartData = [...entries].reverse().map(e => ({
    name: format(parseISO(e.date), 'dd/MM'),
    earnings: e.earnings + e.tips + (e.incentive || 0),
    profit: e.netProfit,
    expenses: e.fuelCost + e.manualExpenses,
    fuel: e.fuelCost,
    manual: e.manualExpenses
  }));

  const totalEarnings = entries.reduce((a, b) => a + b.earnings + b.tips + (e.incentive || 0), 0);
  const totalProfit = entries.reduce((a, b) => a + b.netProfit, 0);
  const totalKm = Math.max(entries.reduce((a, b) => a + b.distance, 0), 1);
  const totalHours = Math.max(entries.reduce((a, b) => a + b.onlineHours, 0), 1);
  const totalOrders = Math.max(entries.reduce((a, b) => a + b.orders, 0), 1);

  const averages = {
    perKm: (totalEarnings / totalKm).toFixed(2),
    perHour: (totalEarnings / totalHours).toFixed(2),
    perOrder: (totalEarnings / totalOrders).toFixed(2),
    profitMargin: totalEarnings > 0 ? ((totalProfit / totalEarnings) * 100).toFixed(1) : "0"
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Loading Report...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 pb-32">
      {/* Centered Report Header */}
      <header className="flex flex-col items-center text-center space-y-3 py-4">
        <div className="p-4 rounded-[2rem] bg-primary/10 text-primary shadow-inner neural-glow w-fit group hover:scale-110 transition-transform">
          <BarChart3 className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Financial Report</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60 italic">Intelligence Dashboard</p>
        </div>
      </header>

      {/* Hero Total Profit Highlight */}
      <Card className="glass border-none rounded-[2.5rem] overflow-hidden bg-secondary text-secondary-foreground shadow-2xl relative min-h-[200px] flex items-center group transition-transform active:scale-95 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30" />
        <CardContent className="pt-6 w-full flex flex-col items-center text-center space-y-2 relative z-10">
          <div className="flex items-center gap-2 opacity-60">
             <ShieldCheck className="w-4 h-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Lifetime Net Profit</p>
          </div>
          <h2 className="text-7xl font-black tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">₹{totalProfit.toFixed(0)}</h2>
          <div className="flex items-center gap-2 pt-3">
             <div className="px-4 py-1.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-widest border border-white/5 backdrop-blur-md">
                {averages.profitMargin}% Efficiency Rate
             </div>
          </div>
        </CardContent>
        <TrendingUp className="w-40 h-40 opacity-10 absolute -right-8 -bottom-8 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-700" />
      </Card>

      {/* KPI Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard 
          label="Profit Margin" 
          value={`${averages.profitMargin}%`} 
          icon={PieChart} 
          color="text-secondary" 
          description="Net ROI"
        />
        <KPICard 
          label="Average Earning" 
          value={`₹${averages.perHour}`} 
          icon={Zap} 
          color="text-primary" 
          description="Per Online Hour"
        />
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MiniAvg label="₹ / KM" value={averages.perKm} icon={Navigation} />
        <MiniAvg label="₹ / HR" value={averages.perHour} icon={Clock} />
        <MiniAvg label="₹ / ORDER" value={averages.perOrder} icon={IndianRupee} />
      </div>

      {/* Chart Section: Revenue vs Profit */}
      <Card className="glass rounded-[2.5rem] overflow-hidden border-none shadow-2xl card-grad-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-70">Revenue Growth</CardTitle>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">
              Trend Matrix
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-4 px-2">
          <ChartContainer config={{ 
            earnings: { label: "Gross Revenue", color: "hsl(var(--primary))" },
            profit: { label: "Net Profit", color: "hsl(var(--secondary))" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorE)" />
                <Area type="monotone" dataKey="profit" stroke="hsl(var(--secondary))" strokeWidth={3} fillOpacity={1} fill="url(#colorP)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart Section: Expense Matrix */}
      <Card className="glass rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-400" />
            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-70">Expense Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[260px] w-full pt-4 px-2">
          <ChartContainer config={{ 
            fuel: { label: "Fuel Cost", color: "hsl(var(--primary))" },
            manual: { label: "Manual Expenses", color: "hsl(var(--destructive))" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="fuel" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="manual" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Professional Footer Stat */}
      <div className="p-6 bg-muted/20 rounded-[2rem] border border-white/5 flex flex-col items-center space-y-2">
          <ShieldCheck className="w-6 h-6 text-primary opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Verified Financial Statement</p>
          <div className="flex gap-4 pt-2">
             <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Total Revenue</p>
                <p className="text-sm font-black">₹{totalEarnings.toFixed(0)}</p>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Orders Sync</p>
                <p className="text-sm font-black">{totalOrders}</p>
             </div>
          </div>
      </div>

      <BottomNav />
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color, description }: any) {
  return (
    <Card className="glass p-5 rounded-[2rem] border-none shadow-xl flex flex-col justify-between h-36 relative overflow-hidden group">
      <div className="absolute -right-2 -top-2 opacity-5 group-hover:scale-125 transition-transform duration-500">
        <Icon className="w-20 h-20" />
      </div>
      <div>
        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">{label}</p>
        <p className={cn("text-2xl font-black tracking-tighter", color)}>{value}</p>
      </div>
      <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{description}</p>
    </Card>
  );
}

function MiniAvg({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="glass p-4 rounded-3xl text-center space-y-1.5 shadow-lg border-white/5 flex flex-col items-center hover:bg-white/[0.03] transition-colors group">
      <Icon className="w-4 h-4 text-primary opacity-40 group-hover:scale-110 transition-transform" />
      <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{label}</p>
      <p className="text-base font-black tracking-tight">₹{value}</p>
    </div>
  );
}

