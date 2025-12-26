import { useState, useRef } from "react";
import { Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "../../store/chat.store";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import { streamChat } from "../../services/api";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { activeChatId, addMessage, updateLastMessage } = useChatStore();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const inputRef = useRef(null);

  const send = async () => {
    // Check if user is logged in
    if (!token) {
      openAuthModal("login");
      return;
    }

    if (!text.trim() || loading) return;

    const question = text.trim();
    setText("");
    setLoading(true);

    // Add user message
    addMessage(activeChatId, { role: "user", text: question });

    // Add placeholder for assistant response
    addMessage(activeChatId, { role: "assistant", text: "", loading: true });

    try {
      // Use streaming endpoint via api service
      const response = await streamChat({
        question,
        workspaceId: user?.workspaceId || "default",
        chatId: activeChatId,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data && data !== "end") {
              fullText += data;
              updateLastMessage(activeChatId, { role: "assistant", text: fullText, loading: false });
            }
          } else if (line.startsWith("event: error")) {
            // Next line will have error data
          } else if (line.startsWith("event: done")) {
            // Stream complete
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      updateLastMessage(activeChatId, {
        role: "assistant",
        text: err.message || "Sorry, something went wrong. Please try again.",
        loading: false,
        error: true,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // Allow Shift+Enter for new lines (default behavior)
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={token ? "Ask a question..." : "Sign in to start chatting..."}
          disabled={loading}
          rows={1}
          className="w-full min-h-20 max-h-40 px-4 pr-10 py-2 resize-none bg-secondary/50 border border-[1px] border-cyan-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-600 transition-all text-sm scrollbar-thin scrollbar-thumb-primary/20"
          style={{ overflowY: 'auto' }}
        />
        {!token && (
          <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <Button 
        onClick={send} 
        disabled={loading || !text.trim()}
        className="h-11 w-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg disabled:opacity-50 disabled:bg-secondary/50 disabled:text-muted-foreground disabled:border-border/50"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
