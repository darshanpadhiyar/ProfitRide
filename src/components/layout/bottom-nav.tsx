
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { LayoutDashboard, ListPlus, Settings, CalendarCheck } from "lucide-react";
=======
import { LayoutDashboard, ListPlus, Settings, CalendarCheck, BrainCircuit } from "lucide-react";
>>>>>>> origin/main
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: ListPlus, label: "Logs", href: "/entries" },
  { icon: CalendarCheck, label: "Attendance", href: "/attendance" },
<<<<<<< HEAD
=======
  { icon: BrainCircuit, label: "AI Tips", href: "/ai" },
>>>>>>> origin/main
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-20 px-2 pb-4 flex items-center justify-around z-50 pointer-events-none">
      <div className="w-full h-full glass rounded-3xl flex items-center justify-around px-1 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative rounded-2xl px-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
              )}
              <item.icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110 stroke-[2.5px]")} />
              <span className={cn("text-[8px] font-black uppercase tracking-tighter text-center leading-none", isActive && "opacity-100")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
