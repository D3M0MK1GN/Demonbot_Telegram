import { useStatsDashboard, useStatsByType, useStatsHistory, useTopReportedNumbers, useActiveUsers } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { 
  Users, Briefcase, Activity, AlertTriangle, TrendingUp, DollarSign, CheckCircle, Smartphone 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-sm font-mono text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold text-white">
          {payload[0].value}
          <span className="text-xs ml-1 text-primary">cases</span>
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function Dashboard() {
  const { data: dashboard, isLoading: isLoadingDash } = useStatsDashboard();
  const { data: byType, isLoading: isLoadingType } = useStatsByType();
  const { data: history, isLoading: isLoadingHistory } = useStatsHistory();
  const { data: topNumbers, isLoading: isLoadingNumbers } = useTopReportedNumbers();
  const { data: activeUsers } = useActiveUsers();

  if (isLoadingDash || isLoadingType || isLoadingHistory) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-display font-bold text-white mb-2"
        >
          Operations Center
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Real-time overview of cybercrime incidents and victim support.
        </motion.p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Total Cases" 
          value={dashboard?.totalCases || 0} 
          icon={<Briefcase className="w-6 h-6" />}
          trend="+12% vs last week"
          trendUp={false} // increasing crime is bad
          delay={0}
        />
        <KPICard 
          title="New Today" 
          value={dashboard?.newCasesToday || 0} 
          icon={<Activity className="w-6 h-6" />}
          trend="Active now"
          trendUp={true}
          delay={1}
        />
        <KPICard 
          title="Total Loss" 
          value={`$${Number(dashboard?.totalAmountLost || 0).toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6" />}
          className="border-primary/20 shadow-[0_0_20px_-10px_var(--primary)]"
          delay={2}
        />
        <KPICard 
          title="Resolved" 
          value={dashboard?.casesResolved || 0} 
          icon={<CheckCircle className="w-6 h-6" />}
          trend="Resolution rate 45%"
          trendUp={true}
          delay={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Incident Trend
            </h3>
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map(range => (
                <button key={range} className="px-3 py-1 text-xs font-mono rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Crime Type Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-xl p-6"
        >
          <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Attack Vectors
          </h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {byType?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-mono text-white">{dashboard?.totalCases}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {byType?.map((item, idx) => (
              <div key={item.type} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="capitalize truncate">{item.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Reported Numbers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-500" />
              High Risk Numbers
            </h3>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
              FRAUD DATABASE
            </span>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Number</th>
                  <th className="px-6 py-3 font-medium">Reports</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topNumbers?.map((item, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-white">{item.number}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {item.reportCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{item.fraudType || 'Unknown'}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono text-xs">
                      {item.lastReportedAt ? format(new Date(item.lastReportedAt), 'MMM d, HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
                {(!topNumbers || topNumbers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                      No reports yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Live Active Users */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-panel rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Live Active Users
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-emerald-400">LIVE FEED</span>
            </div>
          </div>
          <div className="p-0">
            <div className="divide-y divide-white/5">
              {activeUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.fullName?.substring(0, 2).toUpperCase() || 'UN'}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{user.fullName || 'Anonymous User'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.telegramId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-emerald-400">Online</p>
                    <p className="text-[10px] text-muted-foreground">Last seen: {format(new Date(), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
              {(!activeUsers || activeUsers.length === 0) && (
                <div className="px-6 py-8 text-center text-muted-foreground italic">
                  No active users currently.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
