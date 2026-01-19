import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, PhoneOff, ShieldAlert, LogOut, Menu, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CaseChat } from "@/components/CaseChat";
import { useChat } from "@/hooks/use-cases";

const navItems = [
  { href: "/", label: "Panel de Control", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/cases", label: "Reportes de Incidentes", icon: <FileText className="w-5 h-5" /> },
  { href: "/reports", label: "Base de Fraude", icon: <PhoneOff className="w-5 h-5" /> },
];

function SidebarContent() {
  const [location] = useLocation();
  const { openChat } = useChat();

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/20 text-primary">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-tight">CYBERGUARD</h1>
            <p className="text-xs text-muted-foreground font-mono">APOYO A VÍCTIMAS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive 
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-3px_var(--primary)]" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`
            }>
              <span className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Button 
          onClick={() => openChat("GENERAL", "Soporte")}
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 gap-3"
        >
          <MessageSquare className="w-5 h-5" />
          Asistencia
        </Button>
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
          Desconectar
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { chats } = useChat();

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-card border-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-white/10 bg-background">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      {/* Global Chat Component - Support for multiple chats */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="pointer-events-auto contents">
          {chats.map((chat, index) => (
            <CaseChat key={chat.id} chat={chat} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
