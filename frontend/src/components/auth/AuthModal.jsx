import { useState } from "react";
import { X, Bot, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import api from "../../services/api";

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, setAuthModalTab } = useUIStore();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authModalOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleTabChange = (tab) => {
    setAuthModalTab(tab);
    resetForm();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      closeAuthModal();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/signup", { name, email, password });
      login(res.data.user, res.data.token);
      closeAuthModal();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={closeAuthModal}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl p-8 mx-4 glow-subtle">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {authModalTab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {authModalTab === "login" 
              ? "Sign in to continue" 
              : "Get started with Query Quill"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 p-1 bg-secondary/50 rounded-lg">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              authModalTab === "login"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
            onClick={() => handleTabChange("login")}
          >
            Sign in
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              authModalTab === "signup"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
            onClick={() => handleTabChange("signup")}
          >
            Sign up
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        {authModalTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        )}

        {/* Signup Form */}
        {authModalTab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30" 
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}

        {/* Footer text */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {authModalTab === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => handleTabChange("signup")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => handleTabChange("login")}
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
