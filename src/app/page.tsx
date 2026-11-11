
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTracker } from "@/hooks/use-tracker";
import { useUser } from "@/firebase";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Wallet, 
  Package, 
  MapPin, 
  Clock, 
  Fuel, 
  TrendingUp, 
  Target,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Zap,
  Loader2,
  Trophy,
  CheckCircle2,
  CircleDashed,
  Gift,
  Coins,
  Receipt,
  ShieldCheck,
  TrendingDown,
  ArrowRight
} from "lucide-react";
import { format, subDays, addDays, startOfWeek, startOfMonth, isSameDay, isWithinInterval, endOfWeek, endOfMonth, parseISO, eachDayOfInterval, subMonths, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { entries, settings, loading } = useTracker();
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const stats = useMemo(() => {
    if (!mounted || !selectedDate) return { 
      day: null, 
      yesterday: null, 
      week: null, 
      month: null, 
      lifetime: { earnings: 0, profit: 0, orders: 0, days: 0, expenses: 0 },
      daysThisMonth: 0, 
      isPresent: false, 
      totalDays: 0, 
      weekStart: new Date(), 
      weekEnd: new Date(),
      monthStart: new Date(),
      monthEnd: new Date()
    };

    const calculateStats = (filteredEntries: any[]) => {
      return filteredEntries.reduce((acc, curr) => ({
        earnings: acc.earnings + curr.earnings + curr.tips + (curr.incentive || 0),
        tips: acc.tips + (curr.tips || 0),
        incentive: acc.incentive + (curr.incentive || 0),
        orders: acc.orders + curr.orders,
        distance: acc.distance + curr.distance,
        hours: acc.hours + curr.onlineHours,
        fuel: acc.fuel + curr.fuelCost,
        expenses: acc.expenses + (curr.manualExpenses || 0),
        profit: acc.profit + curr.netProfit
      }), { earnings: 0, tips: 0, incentive: 0, orders: 0, distance: 0, hours: 0, fuel: 0, expenses: 0, profit: 0 });
    };

    const referenceDate = selectedDate;
    const selectedDateStr = format(referenceDate, 'yyyy-MM-dd');
    const dayBefore = subDays(referenceDate, 1);
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    const sortedDates = Array.from(new Set(entries.map(e => e.date)));
    
    const monthEntries = entries.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    const daysThisMonth = new Set(monthEntries.map(e => e.date)).size;

    const isPresent = sortedDates.includes(selectedDateStr);

    const lifetime = entries.reduce((acc, curr) => ({
      earnings: acc.earnings + curr.earnings + curr.tips + (curr.incentive || 0),
      profit: acc.profit + curr.netProfit,
      orders: acc.orders + curr.orders,
      expenses: acc.expenses + curr.fuelCost + curr.manualExpenses
    }), { earnings: 0, profit: 0, orders: 0, expenses: 0 });

    return {
      day: calculateStats(entries.filter(e => e.date === selectedDateStr)),
      yesterday: calculateStats(entries.filter(e => e.date === format(dayBefore, 'yyyy-MM-dd'))),
      week: calculateStats(entries.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      })),
      month: calculateStats(monthEntries),
      lifetime: { ...lifetime, days: sortedDates.length },
      daysThisMonth,
      isPresent,
      totalDays: sortedDates.length,
      weekStart,
      weekEnd,
      monthStart,
      monthEnd
    };
  }, [entries, selectedDate, mounted]);

  const calendarModifiers = useMemo(() => {
    if (!mounted || !selectedDate) return {};
    
    const modifiers: any = {
      booked: entries.map(e => parseISO(e.date))
    };
    
    if (period === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      modifiers.highlighted = eachDayOfInterval({ start, end });
    }
    
    if (period === 'month') {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      modifiers.highlighted = eachDayOfInterval({ start, end });
    }
    
    return modifiers;
  }, [selectedDate, period, entries, mounted]);

  if (!mounted || isUserLoading || loading || !selectedDate) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <Zap className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Cloud...</p>
    </div>
  );

  if (!user) return null;

  const currentStats = period === "day" ? stats.day! : period === "week" ? stats.week! : stats.month!;
  const dayStats = stats.day!;
  const yesterdayStats = stats.yesterday!;
  
  const earningsDiff = dayStats.earnings - yesterdayStats.earnings;
  const isEarningsUp = earningsDiff >= 0;

  const handlePrev = () => {
    setSelectedDate(prev => {
      if (!prev) return new Date();
      if (period === 'day') return subDays(prev, 1);
      if (period === 'week') return subDays(prev, 7);
      if (period === 'month') return subMonths(prev, 1);
      return subDays(prev, 1);
    });
  };

  const handleNext = () => {
    setSelectedDate(prev => {
      if (!prev) return new Date();
      let nextDate;
      if (period === 'day') nextDate = addDays(prev, 1);
      else if (period === 'week') nextDate = addDays(prev, 7);
      else if (period === 'month') nextDate = addMonths(prev, 1);
      else nextDate = addDays(prev, 1);
      
      return nextDate > new Date() ? new Date() : nextDate;
    });
  };

  const formatHours = (decimalHours: number) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours % 1) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="py-6 space-y-8 pb-32">
      <header className="flex justify-between items-start px-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">App Online</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground">
            Hi, {user?.displayName?.split(' ')[0] || "Partner"}
          </h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest bg-muted/30 px-2 py-0.5 rounded-md w-fit">
            Dashboard Overview
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-2xl text-[10px] font-black flex items-center gap-2 border border-primary/20 uppercase tracking-wider neural-glow">
          <Fuel className="w-3.5 h-3.5" /> ₹{settings.petrolPrice}/L
        </div>
      </header>

      <Card className="border-none rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-2xl relative min-h-[220px] flex items-center group cursor-pointer transition-transform active:scale-95">
        <div className="absolute inset-0 bg-black/10 opacity-30" />
        <CardContent className="pt-8 w-full flex justify-between items-center px-8 relative z-10">
          <div className="space-y-4 w-full">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-white" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Total Career Profit</p>
              </div>
              <h2 className="text-7xl font-black tracking-tighter drop-shadow-2xl text-white">₹{stats.lifetime.profit.toFixed(0)}</h2>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-2">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Revenue</p>
                <p className="text-sm font-black text-white">₹{stats.lifetime.earnings.toFixed(0)}</p>
              </div>
              <div className="space-y-0.5 border-l border-white/20 pl-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Expenses</p>
                <p className="text-sm font-black text-white">₹{stats.lifetime.expenses.toFixed(0)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Orders</p>
                <p className="text-sm font-black text-white">{stats.lifetime.orders}</p>
              </div>
              <div className="space-y-0.5 border-l border-white/20 pl-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Total Days</p>
                <p className="text-sm font-black text-white">{stats.lifetime.days}</p>
              </div>
            </div>
          </div>
          <Trophy className="w-48 h-48 text-white/10 absolute -right-8 -bottom-10 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-700 pointer-events-none" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat 
          label="Growth" 
          value={`${isEarningsUp ? "+" : "-"}₹${Math.abs(earningsDiff).toFixed(0)}`} 
          color={isEarningsUp ? "text-emerald-400" : "text-rose-400"} 
          icon={isEarningsUp ? TrendingUp : TrendingDown}
        />
        <MiniStat label="Month Days" value={`${stats.daysThisMonth} d`} color="text-secondary" icon={CalendarIcon} />
        <MiniStat label="Month Profit" value={`₹${stats.month.profit.toFixed(0)}`} color="text-primary" icon={Wallet} />
      </div>

      <Card className={cn(
        "glass border-none rounded-[2rem] overflow-hidden transition-all relative group",
        stats.isPresent ? "card-grad-primary shadow-primary/20" : "opacity-90"
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Zap className="w-16 h-16 text-primary" />
        </div>
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3.5 rounded-2xl transition-all duration-500",
              stats.isPresent ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(14,165,233,0.4)]" : "bg-muted text-muted-foreground"
            )}>
              {stats.isPresent ? <CheckCircle2 className="w-6 h-6" /> : <CircleDashed className="w-6 h-6 animate-[spin_4s_linear_infinite]" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status</p>
              <h3 className="text-xl font-black tracking-tight">
                {stats.isPresent ? "Shift Logged" : "No Shift Yet"}
              </h3>
            </div>
          </div>
          {!stats.isPresent && (
            <Button 
              size="sm" 
              className="rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 animate-float"
              onClick={() => router.push('/entries')}
            >
              Add Entry
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="day" onValueChange={setPeriod} className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1.5 glass rounded-[1.5rem] h-14">
          <TabsTrigger value="day" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:neural-glow font-black text-[10px] uppercase tracking-widest">Today</TabsTrigger>
          <TabsTrigger value="week" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:neural-glow font-black text-[10px] uppercase tracking-widest">Week</TabsTrigger>
          <TabsTrigger value="month" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:neural-glow font-black text-[10px] uppercase tracking-widest">Month</TabsTrigger>
        </TabsList>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm w-fit">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-colors" 
              onClick={handlePrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-10 px-4 gap-2 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all border border-primary/10"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Select Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100] rounded-[2rem] border border-white/10 glass shadow-2xl" align="center" sideOffset={8}>
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date()}
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  modifiers={calendarModifiers}
                  modifiersClassNames={{
                    highlighted: "bg-primary/20 text-primary rounded-none first:rounded-l-xl last:rounded-r-xl",
                    booked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-colors" 
              onClick={handleNext} 
              disabled={isSameDay(selectedDate, new Date())}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
                {period === 'day' ? 'Daily Selection' : period === 'week' ? 'Weekly Range' : 'Monthly Selection'}
              </span>
            </div>
            <div className="text-sm font-black tracking-tight text-foreground bg-primary/5 px-6 py-2.5 rounded-2xl border border-primary/10 shadow-sm neural-glow">
              {period === 'day' 
                ? format(selectedDate, 'EEEE, MMM dd, yyyy') 
                : period === 'week'
                  ? `${format(stats.weekStart, 'MMM dd')} — ${format(stats.weekEnd, 'MMM dd, yyyy')}`
                  : format(selectedDate, 'MMMM yyyy')
              }
            </div>
          </div>
        </div>

        <TabsContent value={period} className="space-y-6 mt-6 focus-visible:outline-none">
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Earnings" value={`₹${currentStats.earnings.toFixed(0)}`} icon={Wallet} color="text-primary" bg="bg-primary/10" />
            <StatCard title="Tips" value={`₹${currentStats.tips.toFixed(0)}`} icon={Coins} color="text-emerald-400" bg="bg-emerald-400/10" />
            <StatCard title="Incentives" value={`₹${currentStats.incentive.toFixed(0)}`} icon={Gift} color="text-secondary" bg="bg-secondary/10" />
            <StatCard title="Orders" value={currentStats.orders} icon={Package} color="text-blue-400" bg="bg-blue-400/10" />
            <StatCard title="Distance" value={`${currentStats.distance.toFixed(1)} km`} icon={MapPin} color="text-emerald-400" bg="bg-emerald-400/10" />
            <StatCard title="Work Time" value={formatHours(currentStats.hours)} icon={Clock} color="text-amber-400" bg="bg-amber-400/10" />
            <StatCard title="Fuel Cost" value={`₹${currentStats.fuel.toFixed(0)}`} icon={Fuel} color="text-orange-400" bg="bg-orange-400/10" />
            <StatCard title="Expenses" value={`₹${currentStats.expenses.toFixed(0)}`} icon={Receipt} color="text-rose-400" bg="bg-rose-400/10" />
          </div>

          <Card className="bg-primary text-primary-foreground shadow-2xl overflow-hidden relative border-none rounded-[2.5rem] min-h-[160px] flex items-center group cursor-pointer transition-transform active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20" />
            <CardContent className="pt-6 w-full flex justify-between items-center px-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                  {period === 'day' ? "Profit Today" : period === 'week' ? 'Weekly Profit' : 'Monthly Profit'}
                </p>
                <h2 className="text-6xl font-black tracking-tighter drop-shadow-lg text-white">₹{currentStats.profit.toFixed(0)}</h2>
              </div>
              <TrendingUp className="w-32 h-32 opacity-10 absolute -right-6 -bottom-6 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-700" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}

function MiniStat({ label, value, color, icon: Icon }: { label: string, value: string, color: string, icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 glass rounded-3xl text-center space-y-1.5 border-white/10 group transition-colors hover:bg-white/[0.05]">
        <Icon className={cn("w-4 h-4 opacity-60 group-hover:scale-110 transition-transform", color)} />
        <div className="space-y-0.5">
          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{label}</p>
          <p className={cn("text-base font-black tracking-tighter leading-none", color)}>{value}</p>
        </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="glass border-none rounded-[1.5rem] group hover:bg-white/[0.02] transition-colors">
      <CardContent className="p-5 space-y-5">
        <div className={`p-3 w-fit rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1.5">{title}</p>
          <p className="text-xl font-black tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
