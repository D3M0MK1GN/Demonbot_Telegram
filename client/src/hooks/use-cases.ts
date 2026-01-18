import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCase } from "@shared/schema";

export function useCases(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: [api.cases.list.path, params],
    queryFn: async () => {
      const url = buildUrl(api.cases.list.path);
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset) queryParams.append("offset", params.offset.toString());
      if (params?.status) queryParams.append("status", params.status);
      
      const fullUrl = `${url}?${queryParams.toString()}`;
      const res = await fetch(fullUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cases");
      return api.cases.list.responses[200].parse(await res.json());
    },
  });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: [api.cases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cases.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch case details");
      return api.cases.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCase) => {
      const res = await fetch(api.cases.create.path, {
        method: api.cases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.cases.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create case");
      }
      return api.cases.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}

export function useUpdateCaseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "nuevo" | "en_proceso" | "denunciado" | "resuelto" | "cerrado" }) => {
      const url = buildUrl(api.cases.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.cases.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.cases.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.cases.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.dashboard.path] });
    },
  });
}
