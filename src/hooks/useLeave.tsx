import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import api from "@/lib/api";

export interface LeaveRequest {
    id: string;
    userName: string;
    userEmail: string;
    role: string;
    dept: string;
    type: string;
    leave_type_id: number;
    from: string;
    to: string;
    days: number;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    appliedDate: string;
    avatar: string;
}

export interface LeaveType {
    id: number;
    name: string;
    max_days_per_year: number;
    color?: string;
}

export type LeaveStats = {
    [key: string]: { used: number, max: number, color?: string };
};

interface LeaveContextType {
    leaveRequests: LeaveRequest[];
    applyLeave: (request: Omit<LeaveRequest, "id" | "userName" | "userEmail" | "role" | "dept" | "status" | "appliedDate" | "avatar">) => Promise<void>;
    updateLeaveStatus: (id: string, status: "Approved" | "Rejected") => Promise<void>;
    getUserRequests: (email: string) => LeaveRequest[];
    getLeaveStats: (email: string) => LeaveStats;
    leaveTypes: LeaveType[];
    isLoading: boolean;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role } = useAuth();
    const queryClient = useQueryClient();

    const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
        queryKey: ["leaveTypes"],
        enabled: !!user,
        queryFn: async () => {
            const response = await api.get('/leave/types');
            const types = response.data.data || [];
            
            // Map colors in frontend for UI consistency
            const colorMap: Record<string, string> = {
                annual: "bg-primary",
                sick: "bg-destructive",
                casual: "bg-warning",
                maternity: "bg-purple-500",
                paternity: "bg-blue-500",
                unpaid: "bg-muted-foreground",
                other: "bg-slate-500"
            };

            return types.map((t: any) => ({
                ...t,
                color: colorMap[t.name.toLowerCase()] || "bg-primary"
            }));
        }
    });

    const { data: leaveRequests = [], isLoading } = useQuery({
        queryKey: ["leaves", role],
        enabled: !!user,
        queryFn: async () => {
            const endpoint = '/leave';
            const response = await api.get(endpoint);
            const rawData = response.data.data || [];
            console.log('[useLeave] Raw Data for Leave requests:', rawData);
            return rawData.map((l: any) => ({
                ...l,
                userName: l.employee_name || (l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : "Unknown User"),
                dept: l.department_name || (l.employee?.department?.name) || "General",
                type: l.leave_type_name || l.leave_type || "N/A",
                leave_type_id: l.leave_type_id,
                from: l.start_date ? l.start_date.split('T')[0] : "",
                to: l.end_date ? l.end_date.split('T')[0] : "",
                status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1)) : "Pending",
                userEmail: l.employee_email || l.employee?.user?.email || "",
                role: l.designation_name || "Employee",
                days: l.total_days || (l.start_date && l.end_date ? Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24)) + 1 : 0)
            }));
        }
    });

    const applyMutation = useMutation({
        mutationFn: async (request: Omit<LeaveRequest, "id" | "userName" | "userEmail" | "dept" | "status" | "appliedDate" | "avatar">) => {
            // Include user context metadata for the backend if needed
            const payload = {
                leave_type_id: request.leave_type_id,
                start_date: request.from,
                end_date: request.to,
                reason: request.reason,
            };
            console.log('[useLeave] Submitting payload:', payload);
            const response = await api.post('/leave', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaves"] });
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: "Approved" | "Rejected" }) => {
            const response = await api.patch(`/leave/${id}/status`, { status: status.toLowerCase() });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaves"] });
        }
    });

    const applyLeave = async (request: Omit<LeaveRequest, "id" | "userName" | "userEmail" | "dept" | "status" | "appliedDate" | "avatar">) => {
        if (!user) return;
        await applyMutation.mutateAsync(request);
    };

    const updateLeaveStatus = async (id: string, status: "Approved" | "Rejected") => {
        await statusMutation.mutateAsync({ id, status });
    };

    const getUserRequests = (email: string) => {
        return leaveRequests.filter((req: LeaveRequest) => req.userEmail === email);
    };

    const getLeaveStats = (email: string) => {
        const userApprovedRequests = leaveRequests.filter((req: LeaveRequest) => 
            req.userEmail === email && req.status === "Approved"
        );

        const stats: LeaveStats = {};
        
        // Initialize stats with all available types
        leaveTypes.forEach(type => {
            stats[type.name.toLowerCase()] = { 
                used: 0, 
                max: type.max_days_per_year,
                color: type.color
            };
        });

        // Ensure defaults exist if types haven't loaded yet
        if (leaveTypes.length === 0) {
            ["annual", "sick", "casual", "unpaid"].forEach(t => {
                stats[t] = { used: 0, max: 0 };
            });
        }

        userApprovedRequests.forEach((req: LeaveRequest) => {
            const typeKey = req.type.toLowerCase();
            if (stats[typeKey]) {
                stats[typeKey].used += req.days;
            } else {
                // Handle dynamic types not in the initial list if any
                stats[typeKey] = { used: req.days, max: 0 };
            }
        });

        return stats;
    };

    return (
        <LeaveContext.Provider value={{ leaveRequests, leaveTypes, applyLeave, updateLeaveStatus, getUserRequests, getLeaveStats, isLoading }}>
            {children}
        </LeaveContext.Provider>
    );
};

export const useLeave = () => {
    const context = useContext(LeaveContext);
    if (context === undefined) {
        throw new Error("useLeave must be used within a LeaveProvider");
    }
    return context;
};
