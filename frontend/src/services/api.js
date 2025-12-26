import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Stream chat using fetch (axios doesn't support streaming)
export const streamChat = async ({ question, workspaceId, chatId }) => {
  const token = useAuthStore.getState().token;
  
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, workspaceId, chatId }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please slow down.");
    }
    throw new Error("Chat request failed");
  }

  return response;
};

// Get documents for workspace
export const getDocuments = async (workspaceId) => {
  const response = await api.get(`/documents?workspaceId=${workspaceId}`);
  return response.data;
};

// Delete document
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

export default api;
