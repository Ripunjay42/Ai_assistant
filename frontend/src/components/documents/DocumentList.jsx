import { useEffect, useRef, useState } from "react";
import { FileText, CheckCircle, Loader2, AlertCircle, Trash2, Clock, Zap } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useDocumentStore } from "../../store/document.store";
import { getDocuments, deleteDocument } from "../../services/api";
import { toast } from "sonner";

export default function DocumentList() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { documents, setDocuments, removeDocument } = useDocumentStore();
  const pollingRef = useRef(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

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
      pollingRef.current = setInterval(() => {
        fetchDocuments(true);
      }, 2000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [hasProcessingDocs, token, user?.workspaceId]);

  const fetchDocuments = async (isPolling = false) => {
    if (!user?.workspaceId) return;
    
    try {
      const data = await getDocuments(user.workspaceId);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    setDeletingIds(prev => new Set([...prev, docId]));
    try {
      await deleteDocument(docId);
      removeDocument(docId);
      toast.success(`"${docName}" deleted`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(`Failed to delete "${docName}"`);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
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

  if (!token) {
    return null;
  }

  return (
    <div className="px-3 sm:px-6 pt-3 sm:pt-4 min-h-[60px]">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-muted-foreground">Documents</p>
        {hasProcessingDocs && (
          <span className="text-xs text-blue-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Processing...
          </span>
        )}
      </div>
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => {
            const statusDisplay = getDocStatusDisplay(doc.status);
            return (
              <div
                key={doc.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full group transition-all ${statusDisplay.bg} border border-border/30`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs text-foreground truncate max-w-[120px]">
                  {doc.name}
                </span>
                <span className={`flex items-center gap-1 text-[10px] ${statusDisplay.color}`}>
                  {statusDisplay.icon}
                  <span>{statusDisplay.label}</span>
                </span>
                <button
                  onClick={() => handleDeleteDocument(doc.id, doc.name)}
                  disabled={deletingIds.has(doc.id)}
                  className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-full transition-all disabled:opacity-100"
                >
                  {deletingIds.has(doc.id) ? (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
