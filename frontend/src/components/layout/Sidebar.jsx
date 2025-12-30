import { useState } from "react";
import { PenSquare, MessagesSquare, Trash2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useChatStore } from "../../store/chat.store";
import { useAuthStore } from "../../store/auth.store";
import { useSidebarStore } from "../../store/sidebar.store";

export default function Sidebar() {
  const { chats, createChat, setActiveChat, activeChatId, deleteChat } = useChatStore();
  const token = useAuthStore((s) => s.token);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileOpen, setIsMobileOpen } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full z-40
          transition-all duration-300 ease-in-out
          border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col
          ${isCollapsed ? 'lg:w-16' : 'lg:w-52'}
          ${isMobileOpen ? 'translate-x-0 w-52' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <button
            onClick={() => {
              createChat();
              setIsMobileOpen(false);
            }}
            className={`flex items-center gap-2 text-foreground hover:text-primary transition-all duration-300 ${
              isCollapsed ? 'lg:w-full lg:justify-center' : ''
            }`}
            title="New Chat"
          >
            <PenSquare className="w-4 h-4 shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'
            }`}>New Chat</span>
          </button>
          
          {/* Collapse toggle - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:block p-1.5 rounded-lg transition-all duration-300 text-primary ${
              isCollapsed ? '' : 'ml-auto'
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <div className={`text-center py-10 ${isCollapsed ? 'px-0' : 'px-4'}`}>
              <div className="w-12 h-12 mx-auto mb-3 bg-secondary/50 rounded-xl flex items-center justify-center">
                <MessagesSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-muted-foreground text-sm">
                    No conversations
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-1">
                    Start a new chat
                  </p>
                </>
              )}
            </div>
          ) : (
            chats.map((chat, index) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat.id);
                  setIsMobileOpen(false);
                }}
                className={`group flex items-center rounded-lg cursor-pointer transition-all duration-150 ${
                  isCollapsed ? 'lg:px-2 lg:py-2.5 lg:justify-center px-3 py-2.5 gap-2.5' : 'px-3 py-2.5 gap-2.5'
                } ${
                  chat.id === activeChatId
                    ? "bg-primary/15 border border-primary/25"
                    : "hover:bg-secondary/50 border border-transparent"
                }`}
                title={isCollapsed ? chat.title : ""}
              >
                <MessageCircle className={`w-4 h-4 shrink-0 ${
                  chat.id === activeChatId ? "text-primary" : "text-muted-foreground"
                }`} />
                <div className={`flex-1 min-w-0 whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'
                }`}>
                  <span className={`text-sm truncate block ${
                    chat.id === activeChatId ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {chat.title}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className={`p-1 hover:bg-destructive/20 rounded shrink-0 transition-all ${
                    isCollapsed ? 'lg:hidden' : 'lg:opacity-0 lg:group-hover:opacity-100 opacity-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>      </div>
    </>
  );
}
