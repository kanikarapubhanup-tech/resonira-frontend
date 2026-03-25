import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "./useAuth";
import { TaskRecord, TaskStatus } from "@/types/task.types";

interface TaskContextType {
    tasks: TaskRecord[];
    addTask: (task: any) => Promise<void>;
    updateTaskStatus: (id: number | string, status: TaskStatus) => Promise<void>;
    isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["tasks"],
        enabled: !!user,
        queryFn: async () => {
            try {
                const response = await api.get('/tasks');
                const rawData = response.data.data || [];
                console.log("[useTask] Raw tasks fetched:", rawData);

                const mappedTasks: TaskRecord[] = rawData.map((t: any) => {
                    // Robust normalization for status to match TaskStatus type
                    const normalizeStatus = (s: string): TaskStatus => {
                        const status = s?.toLowerCase()?.trim() || "todo";
                        if (status === "progress" || status === "in_progress" || status === "in progress") return "in_progress";
                        if (status === "review" || status === "in_review" || status === "in review") return "in_review";
                        if (status === "done" || status === "completed") return "done";
                        if (status === "cancelled" || status === "canceled") return "cancelled";
                        return "todo" as TaskStatus;
                    };

                    // Robust normalization for assignedTo (could be object or string ID)
                    const assignedTo = t.assignedTo && typeof t.assignedTo === 'object'
                        ? {
                            _id: String(t.assignedTo._id || t.assignedTo.id || ""),
                            name: t.assignedTo.name || "Unassigned",
                            email: t.assignedTo.email || "",
                            avatar: t.assignedTo.avatar || (t.assignedTo.name || "?").charAt(0)
                        }
                        : {
                            _id: String(t.assigned_to || t.assignedTo || ""), // Fallback to assigned_to or direct assignedTo string
                            name: t.assigned_to_name || "Unassigned",
                            email: t.assignee_email || "",
                            avatar: t.assignee_avatar || (t.assigned_to_name || "?").charAt(0)
                        };

                    const createdBy = t.createdBy && typeof t.createdBy === 'object'
                        ? {
                            _id: String(t.createdBy._id || t.createdBy.id || ""),
                            name: t.createdBy.name || "System"
                        }
                        : {
                            _id: String(t.assigned_by || ""),
                            name: t.assigned_by_name || "System"
                        };

                    const task: TaskRecord = {
                        id: t.id,
                        _id: String(t._id || t.id), // Ensure _id is always a string
                        title: t.title || "Untitled Task",
                        description: t.description || "",
                        project: t.project_name || t.project || "General",
                        priority: (t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)) || "Medium",
                        status: normalizeStatus(t.status),
                        category: t.category || "General",
                        deadline: t.due_date || t.deadline || "TBD",
                        comments: t.comments_count || t.comments || 0,
                        assignedTo,
                        createdBy,
                        createdAt: t.created_at || t.createdAt || new Date().toISOString(),
                        attachments: t.attachments || [],
                    };
                    return task;
                });
                console.log("[useTask] Mapped tasks:", mappedTasks);
                return mappedTasks;
            } catch (err) {
                console.error("[useTask] Fetch failed:", err);
                return [];
            }
        }
    });

    // Utility: Extract a clean numeric/string ID, stripping any accidental suffixes like ":1"
    const sanitizeId = (raw: any): string => {
        if (raw == null) return "";
        const str = String(raw);
        // Strip anything after a colon (source-map artifact like "7:1" → "7")
        return str.split(":")[0].trim();
    };

    // Create a new task
    const addMutation = useMutation({
        mutationFn: async (task: any) => {
            console.log("[useTask] mutationFn received task:", JSON.stringify(task));
            const rawAssigneeId = task.assigned_to || task.assignedTo;
            if (!rawAssigneeId) {
                throw new Error("Employee must be selected");
            }

            const cleanAssigneeId = sanitizeId(rawAssigneeId);

            const payload = {
                title: task.title,
                description: task.description,
                project_id: task.project_id || null,
                priority: task.priority?.toLowerCase() || "medium",
                assignedTo: cleanAssigneeId,
                assigned_to: cleanAssigneeId,   // backend expects this field
                due_date: task.due_date || task.deadline || null,
                category: task.category || "General",
                attachments: task.attachments || []
            };
            
            console.log("[useTask] Standardized creation payload:", payload);
            const response = await api.post("/tasks", payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    // Update task status
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number | string, status: TaskStatus }) => {
            const cleanId = sanitizeId(id);
            if (!cleanId) throw new Error("Task ID is missing");
            console.log(`[useTask] Updating task ${cleanId} to status: ${status}`);
            const response = await api.patch(`/tasks/${cleanId}`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
    });

    const addTask = async (task: Omit<TaskRecord, "id" | "comments" | "createdAt">) => {
        await addMutation.mutateAsync(task);
    };

    const updateTaskStatus = async (id: number | string, status: TaskStatus) => {
        await statusMutation.mutateAsync({ id, status });
    };

    return (
        <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, isLoading }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTask = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error("useTask must be used within a TaskProvider");
    }
    return context;
};
