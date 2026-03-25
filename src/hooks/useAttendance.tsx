import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import api from "@/lib/api";

export interface AttendanceRecord {
    id: string;
    userName: string;
    userEmail: string;
    date: string;
    punchIn: string;
    punchOut: string | null;
    status: "present" | "absent" | "late";
    duration: number; // in seconds
    role?: string;
    department?: string;
    userId?: string;
    employeeId?: string;
}

// Attendance state for today
export type TodayStatus = "not_checked_in" | "checked_in" | "checked_out";

interface AttendanceContextType {
    records: AttendanceRecord[];
    isPunchedIn: boolean;
    currentSession: AttendanceRecord | null;
    todayStatus: TodayStatus;
    todayRecord: AttendanceRecord | null;
    punchIn: () => Promise<void>;
    punchOut: () => Promise<void>;
    getDuration: () => number;
    isLoading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Helper: is the given date string the same calendar day as today?
const isToday = (dateStr: string | undefined | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
};

// Helper: safely parse a date, returns null if invalid
const safeDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeSeconds, setActiveSeconds] = useState(0);

    // ─── 1. Fetch attendance history ─────────────────────────────
    const { data: records = [], isLoading } = useQuery({
        queryKey: ["attendance-history", user?.email],
        enabled: !!user,
        // Refetch every 30 seconds if user is Admin/HR to show live updates in ledger
        refetchInterval: (user?.role === 'administrator' || user?.role === 'hr') ? 30000 : false,
        queryFn: async () => {
            try {
                const response = await api.get('/attendance');
                const rawData = response.data.data || [];
                
                if (user?.role === 'administrator' || user?.role === 'hr') {
                    console.log(`[useAttendance] History Fetch: ${rawData.length} records. Raw Data:`, rawData);
                }

                return rawData.map((r: any) => {
                    const mappedRecord = {
                        id: r.id?.toString() || `ATT-${Date.now()}-${Math.random()}`,
                        userName: r.employee?.user?.name || r.user?.name || r.name || r.userName || 
                                 (r.first_name ? `${r.first_name} ${r.last_name || ""}`.trim() : "") ||
                                 (r.user?.first_name ? `${r.user.first_name} ${r.user.last_name || ""}`.trim() : "") ||
                                 "",
                        userEmail: r.employee?.user?.email || r.user?.email || r.email || r.userEmail || r.user?.email || "",
                        date: r.date || r.punch_in?.split('T')[0] || r.check_in?.split('T')[0] || "",
                        punchIn: r.punch_in || r.check_in || r.punchIn || "",
                        punchOut: r.punch_out || r.check_out || r.punchOut || null,
                        status: (r.status?.toLowerCase() as any) || "present",
                        duration: r.duration || 0,
                        role: r.role || (r.employee?.user?.role?.toLowerCase()) || (r.user?.role?.toLowerCase()) || "employee",
                        department: r.department || r.employee?.department?.name || "General",
                        userId: r.user_id?.toString() || r.userId?.toString() || r.user?.id?.toString() || r.employee?.user_id?.toString() || "",
                        employeeId: r.employee_id?.toString() || r.employeeId?.toString() || r.employee?.id?.toString() || r.employee?.employee_id?.toString() || ""
                    };

                    // ─── Identity Resolution ───
                    // If email is missing, try to fill it in from Auth context (since this is likely the current user)
                    if (!mappedRecord.userEmail && user?.email) {
                        mappedRecord.userEmail = user.email;
                        mappedRecord.userName = user.name || "Me";
                    }

                    // If it belongs to current user, ensure metadata is complete
                    if (user?.email && mappedRecord.userEmail?.toLowerCase() === user.email.toLowerCase()) {
                        if (!mappedRecord.userName || mappedRecord.userName === "Unknown") {
                            mappedRecord.userName = user.name || "";
                        }
                        if (user.employeeId && (!mappedRecord.employeeId || !isNaN(Number(mappedRecord.employeeId)))) {
                            mappedRecord.employeeId = user.employeeId;
                        }
                    }

                    return mappedRecord;
                });
            } catch (err) {
                console.error("[useAttendance] Fetch history failed:", err);
                return [];
            }
        }
    });

    // ─── 2. Fetch today's active session from backend ────────────
    const { data: currentSession = null } = useQuery({
        queryKey: ["attendance-session", user?.email],
        enabled: !!user,
        refetchOnWindowFocus: true, // Re-fetch when user returns to tab
        queryFn: async () => {
            try {
                const response = await api.get('/attendance/current');
                const r = response.data.data;
                console.log(`[useAttendance] /attendance/current returned:`, r);
                if (!r) return null;

                // Extract check-in timestamp — must be valid
                const rawPunchIn = r.check_in || r.punch_in || r.punchIn || "";
                if (!rawPunchIn || !safeDate(rawPunchIn)) return null;

                const rawPunchOut = r.check_out || r.punch_out || r.punchOut || null;

                return {
                    id: r.id?.toString(),
                    userName: r.employee?.user?.name || r.user?.name || r.name || r.userName || "Unknown",
                    userEmail: r.employee?.user?.email || r.user?.email || r.email || r.userEmail || "",
                    date: r.date || rawPunchIn.split('T')[0] || "",
                    punchIn: rawPunchIn,
                    punchOut: rawPunchOut && safeDate(rawPunchOut) ? rawPunchOut : null,
                    status: (r.status?.toLowerCase() as any) || "present",
                    duration: r.duration || 0,
                    role: r.role || (r.employee?.user?.role?.toLowerCase()) || (r.user?.role?.toLowerCase()) || "employee",
                    department: r.department || r.employee?.department?.name || "General",
                    userId: r.user_id?.toString() || r.userId?.toString() || r.user?.id?.toString() || r.employee?.user_id?.toString() || "",
                    employeeId: r.employee_id?.toString() || r.employeeId?.toString() || r.employee?.id?.toString() || ""
                };
            } catch {
                return null;
            }
        }
    });

    // ─── 3. Derive today's status ────────────────────────────────
    // Check from currentSession first (active session from /attendance/current)
    // Then fallback to records for today (completed sessions)
    const todayStr = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD

    // Find today's record from history (for completed check-out sessions)
    const todayRecordFromHistory = records.find(
        (r: AttendanceRecord) => r.date === todayStr && r.userEmail === user?.email
    ) || null;

    // Determine the authoritative today record
    const todayRecord = currentSession && isToday(currentSession.punchIn)
        ? currentSession
        : todayRecordFromHistory;

    // Determine today's attendance status
    let todayStatus: TodayStatus = "not_checked_in";
    if (todayRecord) {
        if (todayRecord.punchOut) {
            todayStatus = "checked_out"; // Already completed for today
        } else if (todayRecord.punchIn) {
            todayStatus = "checked_in"; // Currently on duty
        }
    }

    const isPunchedIn = todayStatus === "checked_in";

    // ─── 4. Mutations ────────────────────────────────────────────
    const punchInMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/attendance/check-in');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-session"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
        }
    });

    const punchOutMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/attendance/check-out');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-session"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
        }
    });

    // ─── 5. Timer for active session ─────────────────────────────
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPunchedIn && todayRecord?.punchIn) {
            const startTime = new Date(todayRecord.punchIn).getTime();
            if (!isNaN(startTime)) {
                // Set initial value immediately
                setActiveSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
                interval = setInterval(() => {
                    setActiveSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
                }, 1000);
            }
        } else {
            setActiveSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isPunchedIn, todayRecord?.punchIn]);

    // ─── 6. Public API ───────────────────────────────────────────
    const punchIn = async () => {
        await punchInMutation.mutateAsync();
    };

    const punchOut = async () => {
        await punchOutMutation.mutateAsync();
    };

    return (
        <AttendanceContext.Provider value={{
            records,
            isPunchedIn,
            currentSession: todayRecord,
            todayStatus,
            todayRecord,
            punchIn,
            punchOut,
            getDuration: () => activeSeconds,
            isLoading
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (context === undefined) {
        throw new Error("useAttendance must be used within an AttendanceProvider");
    }
    return context;
};
