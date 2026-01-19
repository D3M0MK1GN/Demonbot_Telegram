import { createContext, useContext, useState, ReactNode } from "react";

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
    setChats(prev => {
      // Si ya existe un chat para este caso, lo abrimos y lo maximizamos
      const existing = prev.find(c => c.caseNumber === caseNumber);
      if (existing) {
        return prev.map(c => 
          c.caseNumber === caseNumber 
            ? { ...c, isOpen: true, isMinimized: false } 
            : c
        );
      }

      // Si hay más de 7, no permitimos más por ahora (o podríamos cerrar el más antiguo)
      if (prev.length >= 7) return prev;

      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        caseNumber,
        userName,
        isOpen: true,
        isMinimized: false
      }];
    });
  };

  const closeChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
  };

  const toggleMinimize = (id: string) => {
    setChats(prev => prev.map(c => 
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
