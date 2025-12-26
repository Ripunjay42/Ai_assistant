import { create } from "zustand";
import { useChatStore } from "./chat.store";
import { useDocumentStore } from "./document.store";

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
    localStorage.setItem("currentUserId", user.id); // Set current user ID for storage key
    set({ user, token });
    
    // Trigger re-hydration with new user's data
    useChatStore.persist.rehydrate();
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUserId"); // Clear current user ID
    set({ user: null, token: null });
    
    // Clear all chat data and documents on logout
    useChatStore.getState().clearChats();
    useDocumentStore.getState().clearDocuments();
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    }),
}));
