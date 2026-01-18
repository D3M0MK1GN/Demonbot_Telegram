import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  delay?: number;
}

export function KPICard({ title, value, icon, trend, trendUp, className, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={cn(
        "glass-card rounded-xl p-6 relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 transform scale-150 -translate-y-2 translate-x-2">
        {icon}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary/10 rounded-lg text-primary ring-1 ring-primary/20">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full border",
            trendUp 
              ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" 
              : "text-rose-400 border-rose-400/20 bg-rose-400/10"
          )}>
            {trend}
          </span>
        )}
      </div>

      <h3 className="text-muted-foreground text-sm font-medium font-mono uppercase tracking-wider mb-1">
        {title}
      </h3>
      <div className="text-3xl font-bold font-display text-white tracking-tight">
        {value}
      </div>
      
      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
