import { useEffect, useRef } from "react";
import { PenSquare, Bot, Search, FileSearch, MessageSquare } from "lucide-react";
import { useChatStore } from "../../store/chat.store";
import { Button } from "@/components/ui/button";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import DocumentList from "../documents/DocumentList";

export default function ChatWindow() {
  const { activeChatId, messages, createChat } = useChatStore();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md w-full">
          {/* Hero icon */}
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
              <Bot className="w-14 h-14 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">How can I help you?</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Ask questions about your uploaded documents
          </p>

          {/* Feature cards */}
          {/* <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-left">
              <Search className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-medium text-sm">Smart Search</h3>
              <p className="text-xs text-muted-foreground">Find answers instantly</p>
            </div>
            <div className="p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-left">
              <FileSearch className="w-5 h-5 text-primary mb-2" />
              <h3 className="font-medium text-sm">Document Q&A</h3>
              <p className="text-xs text-muted-foreground">Query your files</p>
            </div>
          </div> */}

          {/* CTA Button */}
          <Button 
            onClick={createChat} 
            size="lg"
            className="bg-primary/10 hover:bg-primary/20 text-primary h-11 px-6"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
        </div>
      </div>
    );
  }

  const chatMessages = messages[activeChatId] || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-none">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center min-h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-secondary/50 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-base text-muted-foreground mb-1">Ready to assist</p>
              <p className="text-sm text-muted-foreground/60">Type your question below</p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((m, i) => (
              <MessageBubble
                key={i}
                role={m.role}
                text={m.text}
                loading={m.loading}
                error={m.error}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area with documents */}
      <div className="shrink-0 border-t border-border/30 bg-background">
        <DocumentList />
        <div className="pl-6 pt-3">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
