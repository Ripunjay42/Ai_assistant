import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Create a custom storage that uses user-specific keys
const createUserStorage = () => ({
  getItem: (name) => {
    const userId = localStorage.getItem("currentUserId");
    const key = userId ? `${name}-${userId}` : name;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : null;
  },
  setItem: (name, value) => {
    const userId = localStorage.getItem("currentUserId");
    const key = userId ? `${name}-${userId}` : name;
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (name) => {
    const userId = localStorage.getItem("currentUserId");
    const key = userId ? `${name}-${userId}` : name;
    localStorage.removeItem(key);
  },
});

export const useChatStore = create(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      messages: {},

  createChat: () =>
    set((state) => {
      const id = crypto.randomUUID();
      const chatNumber = state.chats.length + 1;
      return {
        chats: [...state.chats, { id, title: `Chat ${chatNumber}` }],
        activeChatId: id,
        messages: { ...state.messages, [id]: [] },
      };
    }),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  updateLastMessage: (chatId, message) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      if (chatMessages.length === 0) return state;

      const updated = [...chatMessages];
      updated[updated.length - 1] = message;

      return {
        messages: {
          ...state.messages,
          [chatId]: updated,
        },
      };
    }),

  setActiveChat: (id) => set({ activeChatId: id }),

  renameChat: (id, title) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, title } : c)),
    })),

  deleteChat: (id) =>
    set((state) => {
      const newChats = state.chats.filter((c) => c.id !== id);
      const newMessages = { ...state.messages };
      delete newMessages[id];

      return {
        chats: newChats,
        activeChatId: state.activeChatId === id ? (newChats[0]?.id || null) : state.activeChatId,
        messages: newMessages,
      };
    }),

  // Clear all chat data (on logout)
  clearChats: () =>
    set({
      chats: [],
      activeChatId: null,
      messages: {},
    }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => createUserStorage()),
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        messages: state.messages,
      }),
    }
  )
);
