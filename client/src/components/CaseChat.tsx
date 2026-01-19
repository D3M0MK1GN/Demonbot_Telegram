import { useState } from "react";
import { Send, X, Minus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat, ChatInstance } from "@/hooks/use-cases";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  content: string;
  fromAdmin: boolean;
  timestamp: Date;
}

interface CaseChatProps {
  chat: ChatInstance;
  index: number;
}

export function CaseChat({ chat, index }: CaseChatProps) {
  const { toggleMinimize, closeChat } = useChat();
  const [messages] = useState<Message[]>([
    { id: 1, content: `Hola, estamos revisando el caso ${chat.caseNumber}. ¿En qué podemos ayudarte?`, fromAdmin: true, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState("");

  // Cálculo de posición para múltiples burbujas/ventanas
  const rightOffset = 24 + (index * 60); // Para burbujas
  const windowRightOffset = 24 + (index * 400); // Para ventanas abiertas (si caben)

  if (chat.isMinimized) {
    return (
      <motion.div
        key={`bubble-${chat.id}`}
        className="fixed bottom-6 z-50"
        style={{ right: rightOffset }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-primary shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95 transition-transform duration-200"
          onClick={() => toggleMinimize(chat.id)}
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full border-2 border-background" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`window-${chat.id}`}
        className="fixed bottom-6 z-50 w-[380px] sm:w-[400px] origin-bottom-right"
        style={{ right: index === 0 ? 24 : 24 + (index * 40) }}
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Card className="flex flex-col h-[500px] glass-panel border-primary/20 shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-white/5 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {chat.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-[#0a0e1a]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-bold text-white truncate">
                  Incidente {chat.caseNumber}
                </CardTitle>
                <p className="text-[10px] text-primary uppercase tracking-wider font-mono truncate">
                  {chat.userName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => toggleMinimize(chat.id)} className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                <Minus className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => closeChat(chat.id)} className="h-8 w-8 hover:bg-white/10 text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-hidden bg-black/20">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.fromAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.fromAdmin
                          ? "bg-white/5 text-white border border-white/10 rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none shadow-[0_0_15px_-5px_var(--primary)]"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 opacity-50 ${msg.fromAdmin ? "text-left" : "text-right"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 bg-primary/5 border-t border-white/5">
            <form
              className="flex w-full items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-white/10 focus-within:border-primary/50 transition-all"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm h-9"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button size="icon" type="submit" className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/20">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
