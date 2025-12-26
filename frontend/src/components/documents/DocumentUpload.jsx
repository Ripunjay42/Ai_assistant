import { useState, useRef, useEffect } from "react";
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../store/auth.store";
import { useUIStore } from "../../store/ui.store";
import { useDocumentStore } from "../../store/document.store";
import api, { getDocuments, deleteDocument } from "../../services/api";

export default function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const { documents, setDocuments, addDocument, removeDocument } = useDocumentStore();

  // Fetch existing documents on mount and when workspaceId changes
  useEffect(() => {
    if (token && user?.workspaceId) {
      fetchDocuments();
    }
  }, [token, user?.workspaceId]);

  const fetchDocuments = async () => {
    if (!user?.workspaceId) return;
    
    setLoadingDocs(true);
    try {
      const data = await getDocuments(user.workspaceId);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

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

        const response = await api.post('/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
        
        // Add to document store
        if (response.data.document) {
          addDocument(response.data.document);
        }
      } catch (err) {
        console.error('Upload error:', err);
        
        // Check for duplicate error (409 status)
        if (err.response?.status === 409) {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'duplicate' }));
        } else {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        }
      }
    }

    setUploading(false);
    
    // Refresh document list
    await fetchDocuments();
    
    // Clear successful and duplicate uploads after 2 seconds
    setTimeout(() => {
      setFiles(prev => prev.filter(f => 
        uploadStatus[f.name] !== 'success' && uploadStatus[f.name] !== 'duplicate'
      ));
      setUploadStatus({});
    }, 2000);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(docId);
      removeDocument(docId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getStatusIcon = (filename) => {
    const status = uploadStatus[filename];
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusMessage = (filename) => {
    const status = uploadStatus[filename];
    if (status === 'duplicate') return 'Already exists';
    if (status === 'error') return 'Failed';
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">Uploaded Documents</p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg group"
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">
                  {doc.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {doc.status}
                </span>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingDocs && (
        <div className="flex items-center justify-center p-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">Loading documents...</span>
        </div>
      )}
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
              {getStatusMessage(file.name) && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {getStatusMessage(file.name)}
                </span>
              )}
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
