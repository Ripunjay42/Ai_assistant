import { create } from "zustand";
import { persist } from "zustand/middleware";

const getStoredChats = () => {
  try {
    const stored = localStorage.getItem("chat-storage");
    return stored ? JSON.parse(stored) : { chats: [], activeChatId: null, messages: {} };
  } catch {
    return { chats: [], activeChatId: null, messages: {} };
  }
};

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
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        messages: state.messages,
      }),
    }
  )
);
