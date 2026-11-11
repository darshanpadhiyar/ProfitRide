"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signInAnonymously, updateProfile, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Loader2, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName: name });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign in failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (mode === "register") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name || email.split('@')[0] });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center space-y-2">
        <div className="mx-auto p-4 rounded-[2rem] bg-primary/10 w-fit neural-glow">
          <BrainCircuit className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">ProfitRide</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60">Delivery Earning</p>
      </div>

      <Card className="w-full max-w-md glass border-none rounded-[2.5rem] shadow-2xl">
        <CardContent className="pt-6">
          <Tabs defaultValue="permanent" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 p-1.5 glass rounded-2xl h-12">
              <TabsTrigger value="permanent" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Permanent</TabsTrigger>
              <TabsTrigger value="anonymous" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Quick Start</TabsTrigger>
            </TabsList>

            <TabsContent value="permanent" className="space-y-6 focus-visible:outline-none">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black tracking-tight">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                      <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-muted/30 border-none h-12 pl-12 rounded-2xl font-bold"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                    <Input
                      type="email"
                      placeholder="partner@delivery.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/30 border-none h-12 pl-12 rounded-2xl font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-none h-12 pl-12 rounded-2xl font-bold"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 neural-glow mt-4" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? "Sign In" : "Register"}
                </Button>
                
                <p className="text-center text-[10px] font-black uppercase tracking-widest">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    type="button" 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-2 text-primary hover:underline"
                  >
                    {mode === 'login' ? "Register" : "Login"}
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="anonymous" className="space-y-6 focus-visible:outline-none">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black tracking-tight">Guest Access</h3>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">
                    ⚠️ Warning: Guest data will be lost if you clear browser cache. Use Permanent login for safety.
                  </p>
                </div>
              </div>

              <form onSubmit={handleQuickStart} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Display Name</Label>
                  <Input
                    placeholder="Guest Partner"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-muted/30 border-none h-12 rounded-2xl font-bold"
                  />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-secondary text-secondary-foreground shadow-xl shadow-secondary/20 mt-4" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue as Guest"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex items-center gap-2 opacity-30">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Secured by ProfitRide Security</span>
      </div>
    </div>
  );
}
