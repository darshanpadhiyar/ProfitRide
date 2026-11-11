
"use client";

import { useTracker } from "@/hooks/use-tracker";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, addMonths, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { CalendarCheck, Trophy, Calendar as CalendarIcon, Info, TrendingUp, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";

export default function AttendancePage() {
  const { entries, loading: trackerLoading } = useTracker();
  const [viewMonth, setViewMonth] = useState(new Date());
  const [mounted, setMounted] = useState(false);

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

    return { totalDays, daysInGrid, daysAttendedThisMonth, sortedDates, monthStart, monthEnd };
  }, [entries, viewMonth, mounted]);

  const handlePrevMonth = () => setViewMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewMonth(prev => addMonths(prev, 1));
  const handleCurrentMonth = () => setViewMonth(new Date());

  if (!mounted || trackerLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Loading Data...</p>
      </div>
    );
  }

  const stats = attendanceStats!;

  return (
    <div className="py-6 space-y-6 pb-28">
      <header className="flex items-center gap-4 px-1">
        <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 shadow-inner">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Attendance</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Work History</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
            <Trophy className="w-5 h-5 text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Days</p>
            <h2 className="text-3xl font-black tracking-tighter">{stats.totalDays}</h2>
          </CardContent>
        </Card>
        <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl border-primary/20">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
            <CalendarIcon className="w-5 h-5 text-primary mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">This Month</p>
            <h2 className="text-3xl font-black tracking-tighter text-primary">{stats.daysAttendedThisMonth}</h2>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-none rounded-3xl overflow-hidden shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">
                  {format(viewMonth, 'MMMM yyyy')}
                </CardTitle>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase border border-primary/20">
                {stats.daysAttendedThisMonth} Active
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-muted/50" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="flex-1 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted/30" onClick={handleCurrentMonth}>
                Show Current
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-muted/50" onClick={handleNextMonth} disabled={viewMonth >= startOfMonth(new Date())}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-[8px] font-black text-center opacity-40 mb-1">{d}</div>
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
                    "aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-all group",
                    isPresent 
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                      : isCurrentMonth ? "bg-muted/30 border-white/5" : "bg-muted/10 border-transparent opacity-30",
                    isToday && !isPresent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className="text-[10px] font-bold">{format(day, 'd')}</span>
                  {isPresent && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted/20 rounded-2xl space-y-3">
             <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] font-medium leading-tight opacity-70 italic">
                  Attendance is automatically tracked when you add a shift log.
                </p>
             </div>
          </div>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
