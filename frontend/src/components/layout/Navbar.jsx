import { LogOut, CircleUser, Bot, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import { useSidebarStore } from "../../store/sidebar.store";

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { isMobileOpen, toggleMobileOpen } = useSidebarStore();

  const isLoggedIn = !!token;

  return (
    <div className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 lg:px-0 flex justify-between items-center relative z-10">
      <div className="flex items-center gap-2 ml-0 lg:ml-0">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleMobileOpen}
          className="lg:hidden p-2 -ml-2 hover:bg-secondary/50 rounded-lg text-primary transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="w-10 h-10  flex items-center justify-center">
          <Bot className="w-10 h-10 text-primary" />
        </div>
        <div className="hidden sm:block">
          <span className="font-extrabold text-cyan-500 text-lg">Query Quill</span>
          {/* <p className="text-[12px] text-white leading-tight">Document Intelligence</p> */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-lg">
              <CircleUser className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {user?.name || user?.email?.split('@')[0] || "User"}
              </span>
            </div>
            
            {/* Mobile user avatar */}
            <div className="sm:hidden w-8 h-8 bg-secondary/50 border border-border/50 rounded-lg flex items-center justify-center">
              <CircleUser className="w-4 h-4 text-primary" />
            </div>

            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 h-8 w-8 p-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            {/* Login button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => openAuthModal("login")}
              className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Sign in</span>
              <CircleUser className="w-4 h-4 sm:hidden" />
            </Button>

            {/* Signup button */}
            <Button 
              size="sm"
              onClick={() => openAuthModal("signup")}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 h-8 gap-1 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden text-xs">Sign up</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
