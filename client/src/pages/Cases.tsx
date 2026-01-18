import { useState } from "react";
import { useCases } from "@/hooks/use-cases";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, Filter, ChevronRight, AlertCircle, Phone, Globe, Smartphone, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CreateCaseDialog } from "@/components/CreateCaseDialog";

const statusColors = {
  nuevo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  en_proceso: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  denunciado: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  resuelto: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cerrado: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const typeIcons = {
  phishing: Globe,
  hackeo_whatsapp: Phone,
  hackeo_email: AlertCircle,
  extorsion: Shield,
  otro: AlertCircle,
};

export default function Cases() {
  const [filter, setFilter] = useState("all");
  const { data: cases, isLoading } = useCases(filter === "all" ? {} : { status: filter });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Case Management</h1>
          <p className="text-muted-foreground">Manage and track victim support cases.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by case number, name, or phone..." 
            className="w-full bg-background/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
          {['all', 'nuevo', 'en_proceso', 'resuelto'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
                filter === status 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cases?.map((c, idx) => {
            const Icon = typeIcons[c.type as keyof typeof typeIcons] || AlertCircle;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/cases/${c.id}`} className="block">
                  <div className="glass-card rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center hover:scale-[1.01] transition-transform duration-200 group border border-white/5 hover:border-primary/30">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-mono font-bold text-white group-hover:text-primary transition-colors">
                          {c.caseNumber}
                        </h3>
                        <span className="text-xs text-muted-foreground capitalize">{c.type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Victim</p>
                        <p className="text-sm font-medium text-white truncate">{c.user?.fullName || 'Anonymous'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Amount Lost</p>
                        <p className="text-sm font-medium text-white font-mono">
                          {c.amountLost ? `$${Number(c.amountLost).toLocaleString()}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono uppercase">Incident Date</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {c.incidentDate ? format(new Date(c.incidentDate), 'MMM d, yyyy') : '-'}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[c.status as keyof typeof statusColors]}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="md:border-l md:border-white/10 md:pl-6 flex items-center justify-end">
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          
          {(!cases || cases.length === 0) && (
            <div className="text-center py-20 bg-card/30 rounded-xl border border-white/5 border-dashed">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white">No cases found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or create a new case.</p>
            </div>
          )}
        </div>
      )}

      <CreateCaseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Layout>
  );
}
