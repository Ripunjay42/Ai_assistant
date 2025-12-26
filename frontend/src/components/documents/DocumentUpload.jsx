import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import api from "../../services/api";

export default function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({}); // { filename: 'pending' | 'uploading' | 'success' | 'error' }
  const fileInputRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useUIStore((s) => s.openAuthModal);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/json'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    });
    
    setFiles(prev => [...prev, ...validFiles]);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!token) {
      openAuthModal("login");
      return;
    }

    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', user?.workspaceId || 'default');

        await api.post('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
      } catch (err) {
        console.error('Upload error:', err);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setUploading(false);
    
    // Clear successful uploads after 2 seconds
    setTimeout(() => {
      setFiles(prev => prev.filter(f => uploadStatus[f.name] !== 'success'));
      setUploadStatus({});
    }, 2000);
  };

  const getStatusIcon = (filename) => {
    const status = uploadStatus[filename];
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border/50 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-secondary/20"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop files or <span className="text-primary">browse</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          PDF, TXT, MD, JSON (max 10MB)
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg"
            >
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">
                {file.name}
              </span>
              {getStatusIcon(file.name)}
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-destructive/20 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
          
          <Button
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            className="w-full h-9 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
