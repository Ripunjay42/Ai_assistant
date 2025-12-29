import { CircleUser, Bot, AlertCircle } from "lucide-react";

export default function MessageBubble({ role, text, loading, error }) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser 
            ? "bg-primary/20 border border-primary/30" 
            : "bg-secondary border border-border/50"
        }`}
      >
        {isUser ? (
          <CircleUser className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
          isUser
            ? "bg-cyan-700 text-white rounded-tr-sm"
            : error
            ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-tl-sm"
            : "bg-secondary/50 border border-border/50 text-foreground rounded-tl-sm"
        }`}
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-sm">{text}</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}
