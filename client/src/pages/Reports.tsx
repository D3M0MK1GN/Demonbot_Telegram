import { useTopReportedNumbers } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { format } from "date-fns";
import { PhoneOff, Globe, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function Reports() {
  const { data: numbers, isLoading } = useTopReportedNumbers();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Fraud Database</h1>
        <p className="text-muted-foreground">Central registry of reported phone numbers and fraud sources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500">
            <PhoneOff className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase font-mono">Total Reports</p>
            <p className="text-2xl font-bold text-white">{numbers?.length || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase font-mono">High Risk</p>
            <p className="text-2xl font-bold text-white">{numbers?.filter(n => (n.reportCount || 0) > 5).length || 0}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase font-mono">Countries</p>
            <p className="text-2xl font-bold text-white">{new Set(numbers?.map(n => n.originCountry).filter(Boolean)).size || 0}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Phone Number</th>
                <th className="px-6 py-4 font-medium">Total Reports</th>
                <th className="px-6 py-4 font-medium">Fraud Type</th>
                <th className="px-6 py-4 font-medium">Origin</th>
                <th className="px-6 py-4 font-medium text-right">Last Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </td>
                </tr>
              ) : (
                numbers?.map((item, i) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-white text-base font-medium">{item.number}</td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[100px] h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            (item.reportCount || 0) > 10 ? 'bg-rose-500' : 
                            (item.reportCount || 0) > 5 ? 'bg-amber-500' : 'bg-blue-500'
                          }`} 
                          style={{ width: `${Math.min((item.reportCount || 0) * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 inline-block">
                        {item.reportCount} incidents
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-card border border-white/10 text-white capitalize">
                        {item.fraudType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{item.originCountry || '-'}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                      {item.lastReportedAt ? format(new Date(item.lastReportedAt), 'MMM d, yyyy') : '-'}
                    </td>
                  </motion.tr>
                ))
              )}
              {!isLoading && (!numbers || numbers.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No numbers reported yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
