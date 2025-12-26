import { create } from "zustand";

// Parse user from localStorage if exists
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("token"),

  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    }),
}));
