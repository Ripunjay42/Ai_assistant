import { create } from "zustand";

export const useSidebarStore = create((set) => ({
  isMobileOpen: false,
  setIsMobileOpen: (open) => set({ isMobileOpen: open }),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
}));
