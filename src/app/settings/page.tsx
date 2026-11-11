<<<<<<< HEAD

=======
>>>>>>> origin/main
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTracker } from "@/hooks/use-tracker";
import { useAuth, useUser } from "@/firebase";
import { useTheme } from "@/components/theme-provider";
import { signOut, linkWithCredential, EmailAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, isWithinInterval, parseISO, setMonth, setYear } from "date-fns";
import { 
  User, 
  LogOut, 
  FileDown, 
  ShieldCheck, 
  Loader2, 
<<<<<<< HEAD
  Calendar as CalendarIcon,
=======
  Bike, 
  Calendar as CalendarIcon,
  Database,
>>>>>>> origin/main
  Code2,
  Github,
  Linkedin,
  AlertTriangle,
  Lock,
  Mail,
<<<<<<< HEAD
  Sun,
  Moon,
  Monitor
=======
  Zap,
  CheckCircle2,
  Info
>>>>>>> origin/main
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

<<<<<<< HEAD
=======
const currentYear = new Date().getFullYear();
>>>>>>> origin/main
const YEARS = Array.from({ length: 6 }, (_, i) => 2026 - i); 

export default function SettingsPage() {
  const { settings, saveSettings, entries, loading } = useTracker();
  const { user, isUserLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [exportRange, setExportRange] = useState<string>("all");
  const [exportDate, setExportDate] = useState<Date>(new Date());
  
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const darshanImg = PlaceHolderImages.find(img => img.id === 'darshan-profile');

  useEffect(() => {
    setMounted(true);
  }, []);

<<<<<<< HEAD
=======
  const lifetimeStats = useMemo(() => {
    return entries.reduce((acc, curr) => ({
      earnings: acc.earnings + curr.earnings + curr.tips + (curr.incentive || 0),
      profit: acc.profit + curr.netProfit,
      orders: acc.orders + curr.orders,
      km: acc.km + curr.distance,
      hours: acc.hours + curr.onlineHours,
      expenses: acc.expenses + (curr.manualExpenses || 0)
    }), { earnings: 0, profit: 0, orders: 0, km: 0, hours: 0, expenses: 0 });
  }, [entries]);

>>>>>>> origin/main
  const exportPeriod = useMemo(() => {
    if (exportRange === "all") return null;
    const date = exportDate;
    if (exportRange === "day") return { start: date, end: date };
    if (exportRange === "week") return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    if (exportRange === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
    if (exportRange === "year") return { start: startOfYear(date), end: endOfYear(date) };
    return null;
  }, [exportRange, exportDate]);

  const filteredExportEntries = useMemo(() => {
    if (exportRange === "all") return entries;
    const period = exportPeriod;
    if (!period) return entries;

    return entries.filter(e => {
      const entryDate = parseISO(e.date);
      try {
        if (exportRange === "day") return isSameDay(entryDate, period.start);
        return isWithinInterval(entryDate, {
          start: period.start,
          end: period.end
        });
      } catch (err) {
        return false;
      }
    });
  }, [entries, exportRange, exportPeriod]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  const handleProtectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUpgrading(true);
    try {
      const credential = EmailAuthProvider.credential(upgradeEmail, upgradePassword);
      await linkWithCredential(user, credential);
      toast({ title: "Account Secured", description: "Your data is now safely synced with your email." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Protection failed", description: error.message });
    } finally {
      setUpgrading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredExportEntries.length === 0) return alert("No data found for the selected timeframe.");

    const headers = [
      "Date",
      "Total Orders",
      "Base Earnings (INR)",
      "Incentives (INR)",
      "Tips (INR)",
      "Total Revenue (INR)",
      "Distance (KM)",
      "Online Hours",
      "Time Formatted",
      "Fuel Cost (INR)",
      "Other Expenses (INR)",
      "Total Costs (INR)",
      "Net Profit (INR)",
      "Profit Margin (%)"
    ].join(",") + "\n";

    const csvContent = filteredExportEntries.map(e => {
      const h = Math.floor(e.onlineHours);
      const m = Math.round((e.onlineHours % 1) * 60);
      const totalRevenue = e.earnings + e.tips + (e.incentive || 0);
      const totalCosts = e.fuelCost + e.manualExpenses;
      const profitPerc = totalRevenue > 0 ? ((e.netProfit / totalRevenue) * 100).toFixed(1) : 0;
      
      return [
        e.date,
        e.orders,
        e.earnings,
        e.incentive || 0,
        e.tips,
        totalRevenue,
        e.distance.toFixed(1),
        e.onlineHours.toFixed(2),
        `"${h}h ${m}m"`,
        e.fuelCost,
        e.manualExpenses,
        totalCosts.toFixed(2),
        e.netProfit,
        `${profitPerc}%`
      ].join(",");
    }).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProfitRide_Report_${exportRange}_${format(exportDate, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getExportDateLabel = () => {
    if (exportRange === "all") return "Lifetime Data";
    const period = exportPeriod;
    if (!period) return "Select Period";

    if (exportRange === "day") return format(period.start, 'MMM dd, yyyy');
    if (exportRange === "week") return `${format(period.start, 'MMM dd')} - ${format(period.end, 'MMM dd')}`;
    if (exportRange === "month") return format(period.start, 'MMMM yyyy');
    if (exportRange === "year") return format(period.start, 'yyyy');
    return "Select Period";
  };

  const isAnonymous = user?.isAnonymous;

  if (isUserLoading || loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="py-6 space-y-6 pb-32">
      <h1 className="text-2xl font-black tracking-tight px-1 text-foreground">Settings</h1>
      
      {isAnonymous && (
        <Card className="glass border-rose-500/20 rounded-3xl overflow-hidden bg-rose-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Account Vulnerable</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Your guest account is not secured. Add an email to prevent data loss.
            </p>
            <form onSubmit={handleProtectAccount} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
                <Input 
                  placeholder="Protect with Email" 
<<<<<<< HEAD
                  className="h-10 pl-10 rounded-xl bg-background/50 border-none text-xs font-bold text-foreground"
=======
                  className="h-10 pl-10 rounded-xl bg-background/50 border-none text-xs font-bold"
>>>>>>> origin/main
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
                <Input 
                  type="password"
                  placeholder="Set Password" 
<<<<<<< HEAD
                  className="h-10 pl-10 rounded-xl bg-background/50 border-none text-xs font-bold text-foreground"
=======
                  className="h-10 pl-10 rounded-xl bg-background/50 border-none text-xs font-bold"
>>>>>>> origin/main
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={upgrading}>
                {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Secure My Data"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

<<<<<<< HEAD
=======
      <Card className="glass border-none rounded-[2rem] overflow-hidden card-grad-primary shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">Lifetime Stats</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Lifetime Revenue</p>
            <p className="text-xl font-black">₹{lifetimeStats.earnings.toFixed(0)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Total Profit</p>
            <p className="text-xl font-black text-emerald-400">₹{lifetimeStats.profit.toFixed(0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Orders</p>
            <p className="text-xl font-black">{lifetimeStats.orders}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-black">₹{lifetimeStats.expenses.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

>>>>>>> origin/main
      <Card className="glass border-none rounded-[2rem] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
              <User className="w-5 h-5" />
            </div>
<<<<<<< HEAD
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70 text-foreground">Configuration</CardTitle>
=======
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">Settings</CardTitle>
>>>>>>> origin/main
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary relative overflow-hidden">
               <ShieldCheck className={cn("w-5 h-5", !isAnonymous && "text-emerald-400")} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{isAnonymous ? "Guest Mode" : "Verified Account"}</p>
<<<<<<< HEAD
              <p className="text-md font-black text-foreground">{user?.displayName || "Partner"}</p>
=======
              <p className="text-md font-black">{user?.displayName || "Partner"}</p>
>>>>>>> origin/main
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Petrol Price (₹/L)</Label>
              <Input
                type="number"
<<<<<<< HEAD
                className="h-11 rounded-xl bg-muted/50 border-none font-bold text-foreground"
=======
                className="h-11 rounded-xl bg-muted/50 border-none font-bold"
>>>>>>> origin/main
                value={settings.petrolPrice}
                onChange={(e) => saveSettings({ ...settings, petrolPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mileage (km/L)</Label>
              <Input
                type="number"
<<<<<<< HEAD
                className="h-11 rounded-xl bg-muted/50 border-none font-bold text-foreground"
=======
                className="h-11 rounded-xl bg-muted/50 border-none font-bold"
>>>>>>> origin/main
                value={settings.mileage}
                onChange={(e) => saveSettings({ ...settings, mileage: Number(e.target.value) })}
              />
            </div>
          </div>

<<<<<<< HEAD
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Daily Goal (₹)</Label>
              <Input
                type="number"
                className="h-11 rounded-xl bg-muted/50 border-none font-bold text-foreground"
                value={settings.dailyGoal}
                onChange={(e) => saveSettings({ ...settings, dailyGoal: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">App Theme</Label>
              <Select value={theme} onValueChange={(val: any) => setTheme(val)}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-none font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    {theme === 'light' && <Sun className="w-4 h-4" />}
                    {theme === 'dark' && <Moon className="w-4 h-4" />}
                    {theme === 'system' && <Monitor className="w-4 h-4" />}
                    <SelectValue placeholder="Theme" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="light" className="font-bold">Light</SelectItem>
                  <SelectItem value="dark" className="font-bold">Dark</SelectItem>
                  <SelectItem value="system" className="font-bold">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
=======
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Daily Goal (₹)</Label>
            <Input
              type="number"
              className="h-11 rounded-xl bg-muted/50 border-none font-bold"
              value={settings.dailyGoal}
              onChange={(e) => saveSettings({ ...settings, dailyGoal: Number(e.target.value) })}
            />
>>>>>>> origin/main
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-white/5">
            <div className="space-y-0.5">
<<<<<<< HEAD
              <Label className="text-sm font-bold text-foreground">Auto Fuel Cost</Label>
=======
              <Label className="text-sm font-bold">Auto Fuel Cost</Label>
>>>>>>> origin/main
              <p className="text-[10px] text-muted-foreground font-medium">Calculate fuel based on km</p>
            </div>
            <Switch
              checked={settings.autoFuelCalc}
              onCheckedChange={(val) => saveSettings({ ...settings, autoFuelCalc: val })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-none rounded-[2rem] overflow-hidden shadow-2xl border-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-400/10 text-emerald-400 shadow-inner">
              <FileDown className="w-5 h-5" />
            </div>
<<<<<<< HEAD
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70 text-foreground">Export Data</CardTitle>
=======
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">Reports</CardTitle>
>>>>>>> origin/main
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 bg-muted/20 rounded-[1.5rem] space-y-5 border border-white/5 neural-glow">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase tracking-widest opacity-50 ml-1">Range</Label>
                <Select value={exportRange} onValueChange={setExportRange}>
<<<<<<< HEAD
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider text-foreground">
=======
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider">
>>>>>>> origin/main
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="all">Lifetime</SelectItem>
                    <SelectItem value="day">Single Day</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportRange !== "all" && (
                <div className="space-y-1.5">
                  <Label className="text-[8px] font-black uppercase tracking-widest opacity-50 ml-1">
                    Select Period
                  </Label>
                  
                  {exportRange === "month" ? (
                    <div className="flex gap-2">
                      <Select 
                        value={exportDate.getMonth().toString()} 
                        onValueChange={(val) => setExportDate(prev => setMonth(prev, parseInt(val)))}
                      >
<<<<<<< HEAD
                        <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider text-foreground">
=======
                        <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider">
>>>>>>> origin/main
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {MONTHS.map((m, i) => (
                            <SelectItem key={m} value={i.toString()}>{m.substring(0, 3)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : exportRange === "year" ? (
                    <Select 
                      value={exportDate.getFullYear().toString()} 
                      onValueChange={(val) => setExportDate(prev => setYear(prev, parseInt(val)))}
                    >
<<<<<<< HEAD
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider text-foreground">
=======
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider">
>>>>>>> origin/main
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {YEARS.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
<<<<<<< HEAD
                        <Button variant="outline" className="h-11 w-full rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider justify-start gap-2 px-3 overflow-hidden text-foreground">
=======
                        <Button variant="outline" className="h-11 w-full rounded-xl bg-background/50 border-none font-black text-[10px] uppercase tracking-wider justify-start gap-2 px-3 overflow-hidden">
>>>>>>> origin/main
                          <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{getExportDateLabel()}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="end">
                        <Calendar
                          mode="single"
                          selected={exportDate}
                          onSelect={(date) => date && setExportDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
            </div>

            <Button 
              className="w-full h-14 rounded-2xl gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 neural-glow" 
              onClick={handleExportCSV}
              disabled={filteredExportEntries.length === 0}
            >
              <FileDown className="w-5 h-5" /> Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-none rounded-[2rem] overflow-hidden shadow-2xl border-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
              <Code2 className="w-5 h-5" />
            </div>
<<<<<<< HEAD
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70 text-foreground">Developer Info</CardTitle>
=======
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-70">Developer Info</CardTitle>
>>>>>>> origin/main
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg bg-muted">
              <Image 
                src={darshanImg?.imageUrl || "https://picsum.photos/seed/dev/200/200"} 
                alt="Developer" 
                fill 
                className="object-cover"
                data-ai-hint="professional man"
              />
            </div>
            <div className="space-y-1">
<<<<<<< HEAD
              <h3 className="text-lg font-black tracking-tight text-foreground">Darshan Padhiyar</h3>
=======
              <h3 className="text-lg font-black tracking-tight">Darshan Padhiyar</h3>
>>>>>>> origin/main
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Full Stack Engineer</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
<<<<<<< HEAD
            <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/5 bg-muted/20 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/40 text-foreground" asChild>
=======
            <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/5 bg-muted/20 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/40" asChild>
>>>>>>> origin/main
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </Button>
<<<<<<< HEAD
            <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/5 bg-muted/20 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/40 text-foreground" asChild>
=======
            <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/5 bg-muted/20 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/40" asChild>
>>>>>>> origin/main
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="outline" 
        className="w-full h-14 rounded-2xl gap-3 text-destructive border-destructive/20 hover:bg-destructive/10 font-black text-xs uppercase tracking-widest shadow-xl"
        onClick={handleSignOut}
      >
        <LogOut className="w-5 h-5" /> Sign Out
      </Button>

      <div className="mt-4 text-center">
<<<<<<< HEAD
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30 text-foreground">Secured by ProfitRide Security</span>
=======
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Secured by ProfitRide Security</span>
>>>>>>> origin/main
      </div>

      <BottomNav />
    </div>
  );
}
