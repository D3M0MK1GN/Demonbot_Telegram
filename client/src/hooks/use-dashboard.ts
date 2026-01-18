import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStatsDashboard() {
  return useQuery({
    queryKey: [api.stats.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.stats.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.stats.dashboard.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useStatsByType() {
  return useQuery({
    queryKey: [api.stats.byType.path],
    queryFn: async () => {
      const res = await fetch(api.stats.byType.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch crime type stats");
      return api.stats.byType.responses[200].parse(await res.json());
    },
  });
}

export function useStatsHistory() {
  return useQuery({
    queryKey: [api.stats.history.path],
    queryFn: async () => {
      const res = await fetch(api.stats.history.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch case history");
      return api.stats.history.responses[200].parse(await res.json());
    },
  });
}

export function useActiveUsers() {
  return useQuery({
    queryKey: [api.users.active.path],
    queryFn: async () => {
      const res = await fetch(api.users.active.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active users");
      return api.users.active.responses[200].parse(await res.json());
    },
    refetchInterval: 15000,
  });
}

export function useTopReportedNumbers() {
  return useQuery({
    queryKey: [api.reportedNumbers.top.path],
    queryFn: async () => {
      const res = await fetch(api.reportedNumbers.top.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch top reported numbers");
      return api.reportedNumbers.top.responses[200].parse(await res.json());
    },
  });
}
