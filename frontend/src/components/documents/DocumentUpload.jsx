import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, Loader2, AlertCircle, Trash2, Clock, Zap } from "lucide-react";
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
  const pollingRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const { documents, setDocuments, addDocument, removeDocument, updateDocument } = useDocumentStore();

  // Check if any documents are still processing
  const hasProcessingDocs = documents.some(
    (doc) => doc.status === 'UPLOADED' || doc.status === 'PROCESSING'
  );

  // Fetch existing documents on mount and when workspaceId changes
  useEffect(() => {
    if (token && user?.workspaceId) {
      fetchDocuments();
    }
  }, [token, user?.workspaceId]);

  // Poll for status updates when documents are processing
  useEffect(() => {
    if (hasProcessingDocs && token && user?.workspaceId) {
      // Start polling every 2 seconds
      pollingRef.current = setInterval(() => {
        fetchDocuments(true); // Pass true to indicate this is a polling request
      }, 2000);
    } else {
      // Stop polling when no documents are processing
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [hasProcessingDocs, token, user?.workspaceId]);

  const fetchDocuments = async (isPolling = false) => {
    if (!user?.workspaceId) return;
    
    // Only show loading spinner on initial fetch, not during polling
    if (!isPolling) {
      setLoadingDocs(true);
    }
    try {
      const data = await getDocuments(user.workspaceId);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      if (!isPolling) {
        setLoadingDocs(false);
      }
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

  // Get status icon and color for document status
  const getDocStatusDisplay = (status) => {
    switch (status) {
      case 'UPLOADED':
        return {
          icon: <Clock className="w-3 h-3 animate-pulse" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          label: 'Queued'
        };
      case 'PROCESSING':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          label: 'Processing'
        };
      case 'READY':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          label: 'Ready'
        };
      case 'FAILED':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          label: 'Failed'
        };
      default:
        return {
          icon: <FileText className="w-3 h-3" />,
          color: 'text-muted-foreground',
          bg: 'bg-secondary/30',
          label: status
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">Uploaded Documents</p>
            {hasProcessingDocs && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Processing...
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {documents.map((doc) => {
              const statusDisplay = getDocStatusDisplay(doc.status);
              return (
                <div
                  key={doc.id}
                  className={`flex items-center gap-2 p-2 rounded-lg group transition-all ${statusDisplay.bg}`}
                >
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">
                    {doc.name}
                  </span>
                  <span className={`text-xs shrink-0 flex items-center gap-1 ${statusDisplay.color}`}>
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </span>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loadingDocs && (
        <div className="flex items-center justify-center p-3">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">Loading documents...</span>
        </div>
      )}
    </div>
  );
}
