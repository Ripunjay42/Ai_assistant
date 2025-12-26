import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDocumentStore = create(
  persist(
    (set) => ({
      documents: [],
      
      setDocuments: (documents) => set({ documents }),
      
      addDocument: (document) =>
        set((state) => ({
          documents: [document, ...state.documents],
        })),
      
      removeDocument: (documentId) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== documentId),
        })),
      
      updateDocument: (documentId, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === documentId ? { ...doc, ...updates } : doc
          ),
        })),
      
      clearDocuments: () => set({ documents: [] }),
    }),
    {
      name: "document-storage",
      partialize: (state) => ({
        documents: state.documents,
      }),
    }
  )
);
