
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTracker } from "@/hooks/use-tracker";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Navigation, 
  Pencil, 
  Search, 
  X, 
  Camera, 
  Loader2,
  Receipt,
  Zap,
  Clock,
  FilterX
} from "lucide-react";
import { format, parseISO, isToday, startOfWeek, startOfMonth, isWithinInterval, endOfWeek, endOfMonth, isSameDay } from "date-fns";
import { DeliveryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractEarnings } from "@/ai/flows/extract-earnings-flow";

export default function EntriesPage() {
  const { entries, addEntry, updateEntry, deleteEntry, settings } = useTracker();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterCalendarOpen, setFilterCalendarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "month">("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    date: '',
    orders: 0,
    earnings: 0,
    tips: 0,
    incentive: 0,
    distance: 0,
    onlineHours: 0,
    manualExpenses: 0,
  });

  useEffect(() => {
    setMounted(true);
    setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }));
  }, []);

  const handleEdit = (entry: DeliveryEntry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      orders: entry.orders,
      earnings: entry.earnings,
      tips: entry.tips,
      incentive: entry.incentive || 0,
      distance: entry.distance,
      onlineHours: entry.onlineHours,
      manualExpenses: entry.manualExpenses,
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      orders: 0,
      earnings: 0,
      tips: 0,
      incentive: 0,
      distance: 0,
      onlineHours: 0,
      manualExpenses: 0,
    });
    setOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await extractEarnings({ photoDataUri: base64 });
          
          setFormData(prev => ({
            ...prev,
            orders: result.orders || prev.orders,
            earnings: result.earnings || prev.earnings,
            incentive: result.incentive || prev.incentive,
            tips: result.tips || prev.tips,
            onlineHours: result.onlineHours || prev.onlineHours,
            date: result.date || prev.date,
          }));

          toast({
            title: "AI Scan Success",
            description: "Data extraction complete.",
          });
        } catch (err) {
          toast({
            variant: "destructive",
            title: "AI Scan Failed",
            description: "Vision error. Please enter manually.",
          });
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanning(false);
      console.error(err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) return;

    const isDuplicate = entries.some(
      (entry) => entry.date === formData.date && entry.id !== editingId
    );

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Duplicate Entry",
        description: `A log already exists for ${format(parseISO(formData.date), "dd-MM-yyyy")}.`,
      });
      return;
    }

    const data = {
      ...formData,
      orders: Number(formData.orders),
      earnings: Number(formData.earnings),
      tips: Number(formData.tips),
      incentive: Number(formData.incentive),
      distance: Number(formData.distance),
      onlineHours: Number(formData.onlineHours),
      manualExpenses: Number(formData.manualExpenses),
    };

    if (editingId) {
      updateEntry(editingId, data as any);
    } else {
      addEntry(data as any);
    }
    setOpen(false);
  };

  const filteredEntries = useMemo(() => {
    return [...entries].filter(entry => {
      const entryDate = parseISO(entry.date);
      
      let matchesPeriod = true;
      if (filterPeriod === "today") {
        matchesPeriod = isToday(entryDate);
      } else if (filterPeriod === "week") {
        matchesPeriod = isWithinInterval(entryDate, {
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: endOfWeek(new Date(), { weekStartsOn: 1 })
        });
      } else if (filterPeriod === "month") {
        matchesPeriod = isWithinInterval(entryDate, {
          start: startOfMonth(new Date()),
          end: endOfMonth(new Date())
        });
      }

      let matchesSpecificDate = true;
      if (filterDate) {
        matchesSpecificDate = isSameDay(entryDate, filterDate);
      }

      const matchesSearch = 
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.date.includes(searchQuery) ||
        entry.earnings.toString().includes(searchQuery) ||
        entry.orders.toString().includes(searchQuery);

      return matchesPeriod && matchesSpecificDate && matchesSearch;
    });
  }, [entries, searchQuery, filterPeriod, filterDate]);

  const calculatedFuel = (formData.distance / settings.mileage) * settings.petrolPrice;
  const estimatedProfit = (formData.earnings + formData.tips + formData.incentive) - (calculatedFuel + formData.manualExpenses);

  const currentHrs = Math.floor(formData.onlineHours);
  const currentMins = Math.round((formData.onlineHours % 1) * 60);

  if (!mounted) return null;

  return (
    <div className="py-6 space-y-6 flex flex-col h-[100dvh]">
      <div className="flex justify-between items-center px-1">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-foreground">Logs</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Work History</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="rounded-2xl gap-2 shadow-2xl shadow-primary/30 h-12 px-6 font-black uppercase text-[10px] tracking-widest neural-glow">
              <Plus className="w-5 h-5" /> New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md glass rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-6 z-[100] outline-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4 mb-4">
                <DialogTitle className="text-2xl font-black tracking-tighter text-foreground">
                  {editingId ? 'Edit Entry' : 'Log Shift'}
                </DialogTitle>
                {!editingId && (
                  <div className="flex items-center">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload}
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl gap-2 border-primary/40 hover:bg-primary/10 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest h-10 px-4 bg-primary/5 shadow-inner"
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {isScanning ? "Scanning..." : "AI Scan"}
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-12 justify-between rounded-2xl bg-muted/30 border border-white/5 font-black text-xs px-4 transition-colors hover:bg-muted/50 text-foreground",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        {formData.date ? format(parseISO(formData.date), "dd/MM/yyyy") : "Select date"}
                        <CalendarIcon className="w-4 h-4 text-primary opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 rounded-3xl border border-white/10 glass shadow-2xl z-[110]" 
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        startMonth={new Date(2020, 0)}
                        endMonth={new Date()}
                        selected={formData.date ? parseISO(formData.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({...formData, date: format(date, 'yyyy-MM-dd')});
                            setCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Orders</Label>
                  <Input type="number" inputMode="numeric" placeholder="0" className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center text-foreground" value={formData.orders || ''} onChange={e => setFormData({...formData, orders: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Earnings</Label>
                  <Input type="number" inputMode="numeric" placeholder="0" className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center text-foreground" value={formData.earnings || ''} onChange={e => setFormData({...formData, earnings: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tips</Label>
                  <Input type="number" inputMode="numeric" placeholder="0" className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center text-foreground" value={formData.tips || ''} onChange={e => setFormData({...formData, tips: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-secondary">Incentive</Label>
                  <Input type="number" inputMode="numeric" placeholder="0" className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center text-secondary" value={formData.incentive || ''} onChange={e => setFormData({...formData, incentive: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Distance (km)</Label>
                  <Input type="number" inputMode="decimal" placeholder="0.0 km" className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center text-foreground" value={formData.distance || ''} onChange={e => setFormData({...formData, distance: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        placeholder="HH" 
                        className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center pr-2 text-foreground" 
                        value={currentHrs || ''} 
                        onChange={e => {
                          const h = Number(e.target.value);
                          const m = currentMins;
                          setFormData({...formData, onlineHours: h + (m / 60)});
                        }} 
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black opacity-30 text-foreground">HR</span>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        placeholder="MM" 
                        className="h-12 rounded-2xl bg-muted/30 border-none font-black text-center pr-2 text-foreground" 
                        value={currentMins || ''} 
                        onChange={e => {
                          const h = currentHrs;
                          const m = Number(e.target.value);
                          setFormData({...formData, onlineHours: h + (m / 60)});
                        }} 
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black opacity-30 text-foreground">MN</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Other Expenses</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    inputMode="numeric" 
                    placeholder="0" 
                    className="h-12 rounded-2xl bg-muted/30 border-none font-black pl-12 text-foreground" 
                    value={formData.manualExpenses || ''} 
                    onChange={e => setFormData({...formData, manualExpenses: Number(e.target.value)})} 
                  />
                  <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                </div>
              </div>
              
              <div className="p-6 bg-primary/5 rounded-[1.5rem] space-y-4 border border-primary/10 neural-glow">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="opacity-50 text-foreground">Fuel Cost</span>
                  <span className="text-foreground">₹{calculatedFuel.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-50 uppercase tracking-widest text-[10px] font-black text-foreground">Net Profit</span>
                  <span className="text-primary text-2xl font-black tracking-tighter">₹{estimatedProfit.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-muted/30 hover:bg-muted/50 text-foreground" 
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-[2] h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 neural-glow" 
                  disabled={isScanning}
                >
                  {editingId ? 'Save Changes' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-1 flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search logs..." 
              className="pl-12 h-12 rounded-2xl bg-muted/30 border-white/5 focus:bg-muted/50 transition-all font-medium text-sm text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={filterPeriod} onValueChange={(val: any) => setFilterPeriod(val)}>
            <SelectTrigger className="w-[120px] h-12 rounded-2xl bg-muted/30 border-white/5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-muted/50 text-foreground">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-white/10 glass shadow-2xl">
              <SelectItem value="all" className="text-[10px] font-black uppercase">All Time</SelectItem>
              <SelectItem value="today" className="text-[10px] font-black uppercase">Today</SelectItem>
              <SelectItem value="week" className="text-[10px] font-black uppercase">This Week</SelectItem>
              <SelectItem value="month" className="text-[10px] font-black uppercase">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <Popover open={filterCalendarOpen} onOpenChange={setFilterCalendarOpen} modal={true}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "flex-1 h-11 rounded-2xl border-white/5 bg-muted/30 text-[10px] font-black uppercase tracking-widest gap-2 text-foreground",
                  filterDate && "border-primary/40 bg-primary/5 text-primary"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {filterDate ? format(filterDate, "dd MMM yyyy") : "Filter by Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl border border-white/10 glass shadow-2xl" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date()}
                selected={filterDate}
                onSelect={(date) => {
                  setFilterDate(date);
                  setFilterCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(filterDate || searchQuery || filterPeriod !== "all") && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 rounded-2xl bg-muted/30 text-rose-500 hover:bg-rose-500/10"
              onClick={() => {
                setFilterDate(undefined);
                setSearchQuery("");
                setFilterPeriod("all");
              }}
            >
              <FilterX className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 overflow-x-hidden">
        <div className="space-y-4 pb-32">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-muted-foreground opacity-20">
              <Zap className="w-16 h-16 mb-4 stroke-[0.5px] animate-pulse" />
              <p className="font-black uppercase tracking-[0.4em] text-[10px]">No Logs Found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const h = Math.floor(entry.onlineHours);
              const m = Math.round((entry.onlineHours % 1) * 60);
              return (
                <Card key={entry.id} className="glass border-none hover:bg-white/[0.03] transition-all active:scale-[0.98] rounded-3xl overflow-hidden group w-full">
                  <CardContent className="p-3 sm:p-4 flex gap-2 sm:gap-4 items-center">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <Navigation className="w-5 h-5 sm:w-6 sm:h-6 rotate-45" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-primary opacity-60" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">{format(parseISO(entry.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        <div className="space-y-0.5">
                          <p className="text-[6px] sm:text-[7px] text-muted-foreground font-black uppercase tracking-widest">Gross</p>
                          <p className="font-black text-[10px] sm:text-xs tracking-tighter text-foreground">₹{entry.earnings + entry.tips + (entry.incentive || 0)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[6px] sm:text-[7px] text-secondary font-black uppercase tracking-widest">Profit</p>
                          <p className="font-black text-[10px] sm:text-xs tracking-tighter text-secondary">₹{entry.netProfit}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[6px] sm:text-[7px] text-muted-foreground font-black uppercase tracking-widest">Time</p>
                          <p className="font-black text-[10px] sm:text-xs tracking-tighter whitespace-nowrap text-foreground">{h}h {m}m</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-8 w-8 sm:h-10 sm:w-10 transition-colors">
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl h-8 w-8 sm:h-10 sm:w-10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border border-white/10 glass shadow-[0_40px_80px_rgba(0,0,0,0.8)] p-8">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tighter text-foreground">Delete Entry?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold leading-relaxed opacity-70 text-foreground">
                              This will permanently remove the log for {format(parseISO(entry.date), 'dd MMM yyyy')}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3 mt-6">
                            <AlertDialogCancel className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 border-none bg-muted hover:bg-muted/80 text-foreground">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteEntry(entry.id)} 
                              className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      <BottomNav />
    </div>
  );
}
