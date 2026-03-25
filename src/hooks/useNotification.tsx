import React, { createContext, useContext, useState, useEffect } from "react";

export interface NotificationRecord {
    id: number;
    title: string;
    message: string;
    time: string;
    type: "task" | "leave" | "message" | "system";
    read: boolean;
}

interface NotificationContextType {
    notifications: NotificationRecord[];
    unreadCount: number;
    addNotification: (notif: Omit<NotificationRecord, "id" | "time" | "read">) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "sharedNotifications";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationRecord[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        // Start with an empty list for "real" notifications
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (notif: Omit<NotificationRecord, "id" | "time" | "read">) => {
        const newNotif: NotificationRecord = {
            ...notif,
            id: Date.now(),
            time: "Just now",
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            addNotification, 
            markAsRead, 
            markAllAsRead, 
            clearNotifications 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};
