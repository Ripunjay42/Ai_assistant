import { useState, useRef } from "react";
import { Send, Lock, Paperclip, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "../../store/chat.store";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import { useDocumentStore } from "../../store/document.store";
import api, { streamChat } from "../../services/api";
import { toast } from "sonner";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const { activeChatId, addMessage, updateLastMessage } = useChatStore();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const { addDocument } = useDocumentStore();
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/json'];
      return validTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    });
    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    
    for (const file of files) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', user?.workspaceId || 'default');
        const response = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
        if (response.data.document) addDocument(response.data.document);
      } catch (err) {
        if (err.response?.status === 409) {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'duplicate' }));
          toast.warning("Doc already exist");
        } else {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
          toast.error("Failed to upload ");
        }
      }
    }
    setUploading(false);
    // Clear immediately after upload completes
    setFiles([]);
    setUploadStatus({});
  };

  const getStatusIcon = (filename) => {
    const status = uploadStatus[filename];
    switch (status) {
      case 'uploading': return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
      case 'success': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'duplicate': return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-destructive" />;
      default: return null;
    }
  };

  const send = async () => {
    // Check if user is logged in
    if (!token) {
      openAuthModal("login");
      return;
    }

    if (!text.trim() || loading) return;

    const question = text.trim();
    setText("");
    setLoading(true);

    // Add user message
    addMessage(activeChatId, { role: "user", text: question });

    // Add placeholder for assistant response
    addMessage(activeChatId, { role: "assistant", text: "", loading: true });

    try {
      // Use streaming endpoint via api service
      const response = await streamChat({
        question,
        workspaceId: user?.workspaceId || "default",
        chatId: activeChatId,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data && data !== "end") {
              fullText += data;
              updateLastMessage(activeChatId, { role: "assistant", text: fullText, loading: false });
            }
          } else if (line.startsWith("event: error")) {
            // Next line will have error data
          } else if (line.startsWith("event: done")) {
            // Stream complete
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      updateLastMessage(activeChatId, {
        role: "assistant",
        text: err.message || "Sorry, something went wrong. Please try again.",
        loading: false,
        error: true,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // Allow Shift+Enter for new lines (default behavior)
  };

  return (
    <div className="space-y-2">
      {/* File upload preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-secondary/30 rounded-lg border border-border/30">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-md text-xs">
              <FileText className="w-3 h-3 text-primary" />
              <span className="text-foreground truncate max-w-[100px]">{file.name}</span>
              {getStatusIcon(file.name)}
              {!uploading && (
                <button onClick={() => removeFile(index)} className="p-0.5 hover:bg-destructive/20 rounded">
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            size="sm"
            className="h-6 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Upload'}
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Upload button */}
        {token && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-11 w-11 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-primary border border-border/50 hover:border-primary/30 rounded-lg"
            title="Upload documents"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}
        
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={token ? "Ask a question..." : "Sign in to start chatting..."}
            disabled={loading}
            rows={1}
            className="w-full min-h-20 max-h-40 px-4 pr-10 py-3 resize-none bg-secondary/50 border border-cyan-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-600 transition-all text-sm scrollbar-thin scrollbar-thumb-primary/20"
            style={{ overflowY: 'auto' }}
          />
          {!token && (
            <Lock className="absolute right-3 top-4 w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <Button 
          onClick={send} 
          disabled={loading || !text.trim()}
          className="h-11 w-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg disabled:opacity-50 disabled:bg-secondary/50 disabled:text-muted-foreground disabled:border-border/50"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
