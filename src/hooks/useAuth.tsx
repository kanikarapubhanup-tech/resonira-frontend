import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "employee" | "hr" | "manager" | "administrator" | null;

interface UserInfo {
    _id?: string;
    id?: number; // Keep id as optional for backward compatibility if needed
    name: string;
    email: string;
    role: Role;
    department?: string;
    employeeId?: string;
    employee_id?: string | number;
}

interface AuthContextType {
    role: Role;
    user: UserInfo | null;
    login: (role: Role, userInfo: UserInfo) => void;
    logout: () => void;
    updateProfile: (userInfo: Partial<UserInfo>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role>(() => {
        return (localStorage.getItem("userRole") as Role) || null;
    });

    const [user, setUser] = useState<UserInfo | null>(() => {
        const saved = localStorage.getItem("userInfo");
        if (!saved) return null;
        try {
            const parsed = JSON.parse(saved);
            // Protocol: Deriving _id from any available identifier
            if (parsed && !parsed._id) {
                const derivedId = String(parsed.employeeId || parsed.id || parsed.employee_id || "");
                if (derivedId) {
                    parsed._id = derivedId;
                }
            }
            console.log("[useAuth] Initialized user from storage:", parsed);
            return parsed;
        } catch (e) {
            console.error("[useAuth] Failed to parse stored user:", e);
            return null;
        }
    });

    const login = (newRole: Role, userInfo: UserInfo) => {
        // Aggressively ensure _id exists, prioritize employeeId for task linking
        const normalizedUser = { 
            ...userInfo, 
            _id: userInfo._id || String(userInfo.employeeId || userInfo.id || userInfo.employee_id || ""),
        };
        console.log("[useAuth] Login with normalized user:", normalizedUser);
        setRole(newRole);
        setUser(normalizedUser);
        localStorage.setItem("userRole", newRole || "");
        localStorage.setItem("userInfo", JSON.stringify(normalizedUser));
        // Support both "token" and "authToken" keys
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        if (token) localStorage.setItem("token", token);
    };

    const logout = () => {
        setRole(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userInfo");
    };

    const updateProfile = (updates: Partial<UserInfo>) => {
        const newUser = user ? { ...user, ...updates } : null;
        if (newUser) {
            // Re-normalize if needed
            if (!newUser._id) newUser._id = String(newUser.employeeId || newUser.id || "");
            setUser(newUser);
            localStorage.setItem("userInfo", JSON.stringify(newUser));
        }
    };

    return (
        <AuthContext.Provider value={{ role, user, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
