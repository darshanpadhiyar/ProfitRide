
"use client";

import { useTracker } from "@/hooks/use-tracker";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  addMonths, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  parseISO
} from "date-fns";
import { 
  CalendarCheck, 
  Trophy, 
  Calendar as CalendarIcon, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Wallet,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";

export default function AttendancePage() {
  const { entries, loading: trackerLoading } = useTracker();
  const [viewMonth, setViewMonth] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const attendanceStats = useMemo(() => {
    if (!mounted) return null;

    const sortedDates = Array.from(new Set(entries.map(e => e.date)));
    const totalDays = sortedDates.length;

    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const daysInGrid = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const monthEntries = entries.filter(e => e.date.startsWith(format(viewMonth, 'yyyy-MM')));
    const daysAttendedThisMonth = new Set(monthEntries.map(e => e.date)).size;

    const monthlyEarnings = monthEntries.reduce((acc, curr) => acc + curr.earnings + curr.tips + (curr.incentive || 0), 0);
    const monthlyProfit = monthEntries.reduce((acc, curr) => acc + curr.netProfit, 0);

    return { 
      totalDays, 
      daysInGrid, 
      daysAttendedThisMonth, 
      sortedDates, 
      monthStart, 
      monthEnd,
      monthlyEarnings,
      monthlyProfit
    };
  }, [entries, viewMonth, mounted]);

  const handlePrevMonth = () => setViewMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewMonth(prev => addMonths(prev, 1));
  const handleCurrentMonth = () => setViewMonth(new Date());

  if (!mounted || trackerLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Syncing Records...</p>
      </div>
    );
  }

  const stats = attendanceStats!;

  return (
    <div className="py-6 space-y-6 pb-28">
      <header className="flex items-center gap-4 px-1">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner neural-glow">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Attendance</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Advanced Logs</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
            <Trophy className="w-5 h-5 text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Lifetime Active</p>
            <h2 className="text-3xl font-black tracking-tighter">{stats.totalDays} Days</h2>
          </CardContent>
        </Card>
        <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl border-primary/20">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
            <Zap className="w-5 h-5 text-primary mb-1 animate-pulse" />
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active This Month</p>
            <h2 className="text-3xl font-black tracking-tighter text-primary">{stats.daysAttendedThisMonth}</h2>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-none rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
             <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Month Performance</p>
                <h3 className="text-lg font-black tracking-tight">{format(viewMonth, 'MMMM yyyy')}</h3>
             </div>
             <Wallet className="w-6 h-6 text-primary opacity-40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-background/40 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Gross Earnings</p>
                <p className="text-lg font-black tracking-tighter text-foreground">₹{stats.monthlyEarnings.toFixed(0)}</p>
             </div>
             <div className="p-4 bg-background/40 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-secondary mb-1">Net Profit</p>
                <p className="text-lg font-black tracking-tighter text-secondary">₹{stats.monthlyProfit.toFixed(0)}</p>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">
                  History Grid
                </CardTitle>
              </div>
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase border border-primary/20 cursor-pointer hover:bg-primary/20 transition-all flex items-center gap-2">
                      {format(viewMonth, 'MMM yyyy')}
                      <Zap className="w-3 h-3 animate-pulse" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[2rem] border border-white/10 glass shadow-2xl" align="end" sideOffset={8}>
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={new Date(2020, 0)}
                    endMonth={new Date()}
                    selected={viewMonth}
                    onSelect={(date) => {
                      if (date) {
                        setViewMonth(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted" onClick={handlePrevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30 hover:bg-muted/50" onClick={handleCurrentMonth}>
                Show Current
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted" onClick={handleNextMonth} disabled={viewMonth >= startOfMonth(new Date())}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
              <div key={i} className="text-[7px] font-black text-center opacity-40 mb-1">{d}</div>
            ))}
            {stats.daysInGrid.map((day, i) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isPresent = stats.sortedDates.includes(dayStr);
              const isCurrentMonth = day >= stats.monthStart && day <= stats.monthEnd;
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300",
                    isPresent 
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-[0.98]" 
                      : isCurrentMonth ? "bg-muted/30 border-white/5" : "bg-muted/10 border-transparent opacity-20",
                    isToday && !isPresent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black",
                    isPresent ? "text-white" : "text-muted-foreground"
                  )}>{format(day, 'd')}</span>
                  {isPresent && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background shadow-lg" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 p-5 bg-muted/20 rounded-2xl space-y-4 border border-white/5">
             <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Reliability Profile</p>
                   <p className="text-[9px] font-medium text-muted-foreground">
                      You worked on <span className="text-primary font-bold">{stats.daysAttendedThisMonth} out of {format(stats.monthEnd, 'd')}</span> days this month.
                   </p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <Info className="w-5 h-5 text-muted-foreground opacity-50" />
                <p className="text-[9px] font-medium leading-tight opacity-70 italic text-muted-foreground">
                  History is synced with your shift logs. Tap a day in the dashboard to edit logs.
                </p>
             </div>
          </div>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
