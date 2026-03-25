import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface DocumentRecord {
    id: number;
    name: string;
    type: "PDF" | "Excel" | "Image" | "Word" | "Other";
    size: string;
    by: string;
    date: string;
    version: string;
    access: string;
    portal: "hr" | "employee";
}

interface DocumentContextType {
    documents: DocumentRecord[];
    addDocument: (doc: Omit<DocumentRecord, "id" | "date" | "by" | "portal">) => void;
    removeDocument: (id: number) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const STORAGE_KEY = "sharedDocuments";

const defaultDocuments: DocumentRecord[] = [];

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role } = useAuth();

    const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        try {
            const parsed: DocumentRecord[] = JSON.parse(saved);
            // Filter out old dummy IDs if they exist in localStorage
            return parsed.filter(d => d.id > 10); // Real IDs use Date.now() which is > 10
        } catch (e) {
            return [];
        }
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    }, [documents]);

    // Cross-tab sync via storage event
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    setDocuments(JSON.parse(e.newValue));
                } catch { /* ignore */ }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // Polling fallback every 2s
    useEffect(() => {
        const interval = setInterval(() => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed: DocumentRecord[] = JSON.parse(saved);
                    setDocuments(prev => {
                        if (JSON.stringify(prev) !== saved) return parsed;
                        return prev;
                    });
                } catch { /* ignore */ }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const addDocument = (doc: Omit<DocumentRecord, "id" | "date" | "by" | "portal">) => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        // Build uploader name from current user
        const uploaderName = user?.name || "Unknown";

        const newDoc: DocumentRecord = {
            ...doc,
            id: Date.now(),
            date: formattedDate,
            by: uploaderName,
            portal: (role === "hr" || role === "manager" || role === "administrator") ? "hr" : "employee",
        };

        setDocuments(prev => [newDoc, ...prev]);
    };

    const removeDocument = (id: number) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
    };

    return (
        <DocumentContext.Provider value={{ documents, addDocument, removeDocument }}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocument = () => {
    const context = useContext(DocumentContext);
    if (context === undefined) {
        throw new Error("useDocument must be used within a DocumentProvider");
    }
    return context;
};
