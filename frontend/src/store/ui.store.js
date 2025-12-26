import { create } from "zustand";

export const useUIStore = create((set) => ({
  authModalOpen: false,
  authModalTab: "login", // "login" | "signup"

  openAuthModal: (tab = "login") => set({ authModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuthModalTab: (tab) => set({ authModalTab: tab }),
}));
