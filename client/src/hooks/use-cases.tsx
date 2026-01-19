import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { createContext, useContext, useState, ReactNode } from "react";

// --- Chat Context ---
export interface ChatInstance {
  id: string;
  caseNumber: string;
  userName: string;
  isOpen: boolean;
  isMinimized: boolean;
}

interface ChatContextType {
  chats: ChatInstance[];
  openChat: (caseNumber: string, userName: string) => void;
  closeChat: (id: string) => void;
  toggleMinimize: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatInstance[]>([]);

  const openChat = (caseNumber: string, userName: string) => {
    setChats((prev: ChatInstance[]) => {
      const existing = prev.find(c => c.caseNumber === caseNumber);
      if (existing) {
        return prev.map(c => 
          c.caseNumber === caseNumber 
            ? { ...c, isOpen: true, isMinimized: false } 
            : c
        );
      }
      if (prev.length >= 7) return prev;
      return [...prev, {
        id: Math.random().toString(36).substring(2, 11),
        caseNumber,
        userName,
        isOpen: true,
        isMinimized: false
      }];
    });
  };

  const closeChat = (id: string) => {
    setChats((prev: ChatInstance[]) => prev.filter(c => c.id !== id));
  };

  const toggleMinimize = (id: string) => {
    setChats((prev: ChatInstance[]) => prev.map(c => 
      c.id === id ? { ...c, isMinimized: !c.isMinimized } : c
    ));
  };

  return (
    <ChatContext.Provider value={{ chats, openChat, closeChat, toggleMinimize }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// --- Case Hooks ---
export function useCases(filters: { status?: string } = {}): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: [api.cases.list.path, filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      const res = await fetch(`${api.cases.list.path}${queryParams.toString() ? "?" + queryParams.toString() : ""}`, { 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch cases");
      const data = await res.json();
      const parsed = api.cases.list.responses[200].parse(data);
      return Array.isArray(parsed) ? (parsed as any[]) : [];
    },
  });
}

export function useCase(id: number): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: [api.cases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cases.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch case");
      const data = await res.json();
      return api.cases.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateCase(): UseMutationResult<any, Error, any> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.cases.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create case");
      const result = await res.json();
      return api.cases.create.responses[201].parse(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
    },
  });
}

export function useUpdateCaseStatus(): UseMutationResult<any, Error, { id: number; status: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.cases.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update case status");
      const result = await res.json();
      return api.cases.updateStatus.responses[200].parse(result);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cases.get.path, id] });
    },
  });
}
