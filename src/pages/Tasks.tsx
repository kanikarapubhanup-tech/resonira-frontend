import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageCircle, Calendar, X, Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { useTask } from "@/hooks/useTask";
import { useAuth } from "@/hooks/useAuth";
import { TaskRecord, TaskPriority, TaskStatus } from "@/types/task.types";

const columns: { key: TaskRecord["status"]; label: string; color: string; dot: string }[] = [
  { key: "todo", label: "To Do", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  { key: "in_progress", label: "In Progress", color: "text-primary", dot: "bg-primary" },
  { key: "in_review", label: "In Review", color: "text-warning", dot: "bg-warning" },
  { key: "done", label: "Done", color: "text-success", dot: "bg-success" },
];

const priorityColors: Record<TaskPriority, string> = {
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-success/15 text-success",
};

export default function Tasks() {
  const { tasks, updateTaskStatus, isLoading } = useTask();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);

  const handleStatusUpdate = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success(`Task moved to ${newStatus}`);
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error: any) {
      console.error("Status update failed:", error);
      if (error.response?.status === 403) {
        toast.error("Insufficient permissions to update this task");
      } else {
        toast.error(error.response?.data?.message || "Failed to update status");
      }
    }
  };

  const handleDownload = (filename: string) => {
    toast.success(`Opening ${filename}...`);
    // Create a dummy blob to trigger a real browser download behavior
    const blob = new Blob([`Content of ${filename}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    console.log("Current User:", user);
    console.log("Tasks from API:", tasks);
  }, [user, tasks]);

  // Standardized Normalization Helper (Task 1)
  const getAssignedUserId = (task: any) => {
    if (!task) return null;

    if (task.assignedTo) {
      if (typeof task.assignedTo === "string") return task.assignedTo;
      if (typeof task.assignedTo === "object") {
        return String(task.assignedTo.userId || task.assignedTo._id || "");
      }
    }

    if (task.assigned_to) {
      return String(task.assigned_to);
    }

    return null;
  };

  // Safe Name Helper
  const getAssignedName = (task: TaskRecord) => {
    if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
        return task.assignedTo.name;
    }
    return task.assigned_to_name || "Unassigned";
  };

  // Safe Avatar Helper
  const getAssignedAvatar = (task: TaskRecord) => {
    if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
        return task.assignedTo.avatar || task.assignedTo.name?.charAt(0);
    }
    return (task.assigned_to_name || "?").charAt(0);
  };

  // Show all tasks for HR/Admin, only assigned tasks for employees
  const filteredTasks = useMemo(() => {
    const lowerRole = role?.toLowerCase();
    
    // HR and Admin can see all tasks (using common role strings)
    if (lowerRole === "hr" || lowerRole === "administrator" || lowerRole === "admin" || lowerRole === "manager") {
        return tasks || [];
    }

    // 🔥 BACKEND ALREADY FILTERS FOR EMPLOYEES
    // We trust the backend's filtered result to avoid ID-mismatch bugs on frontend (e.g. Employee ID vs User ID)
    console.log(`[Protocol] Employee View: Found ${tasks?.length || 0} tasks from backend`);
    return tasks || [];
  }, [tasks, role]);

  // Protocol Guard: Only hang if basic user session is missing (Task 3)
  if (!user) {
      console.log("[Protocol] Guard Active: User session not found.");
      return (
          <div className="flex items-center justify-center p-20">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-muted-foreground font-medium">Loading user session...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Tasks & Productivity</h1>
        {role !== "employee" && (
          <button
            onClick={() => navigate("/create-task")}
            className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns?.map(col => {
          const colTasks = filteredTasks?.filter(t => t.status === col.key) || [];
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className={`font-heading font-bold text-sm ${col.color}`}>{col.label}</span>
                <span className="badge-pill bg-secondary text-muted-foreground text-[10px] ml-1">{colTasks?.length || 0}</span>
              </div>
              {colTasks?.map(task => (
                <div
                  key={task?.id || Math.random()}
                  onClick={() => setSelectedTask(task)}
                  className="card-surface p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <div className="text-[11px] text-muted-foreground mb-1">{task.project || "General"}</div>
                  <div className="text-sm font-medium mb-3">{task.title || "Untitled Task"}</div>
                  <div className="flex items-center justify-between">
                    <span className={`badge-pill ${priorityColors[task.priority] || priorityColors.Medium} text-[10px]`}>{task.priority || "Medium"}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold" title={getAssignedName(task)}>
                        {getAssignedAvatar(task)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={12} />{task.deadline || "No Date"}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} />{task.comments || 0}</span>
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-primary animate-pulse-slow">
                        <Paperclip size={12} /> {task.attachments.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
           <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
           <p className="text-sm text-muted-foreground font-medium">Crunching task data...</p>
        </div>
      )}

      {/* Task Detail */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          <div className="relative z-10 card-surface p-6 w-full max-w-lg animate-fade-up">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-xs text-muted-foreground">{selectedTask.project || "General"}</div>
                <h2 className="font-heading font-bold text-lg">{selectedTask.title || "Untitled Task"}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <span className={`badge-pill ${priorityColors[selectedTask.priority] || priorityColors.Medium}`}>{selectedTask.priority}</span>
              <span className="badge-pill bg-secondary text-muted-foreground">{selectedTask.deadline}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedTask.description || `This task involves implementing the ${selectedTask.title.toLowerCase()} feature for the ${selectedTask.project} project.`}
            </p>

            {/* Status Update Buttons */}
            <div className="border-t border-border pt-4 mb-4">
              <h4 className="text-xs text-muted-foreground font-medium mb-3">Move to</h4>
              <div className="flex flex-wrap gap-2">
                {columns.filter(c => c.key !== selectedTask.status).map(c => (
                  <button
                    key={c.key}
                    onClick={() => handleStatusUpdate(selectedTask.id, c.key)}
                    className={`badge-pill cursor-pointer hover:opacity-80 transition-opacity ${c.dot === "bg-success" ? "bg-success/15 text-success" : c.dot === "bg-primary" ? "bg-primary/15 text-primary" : c.dot === "bg-warning" ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachments Display in Detail */}
            {selectedTask.attachments && selectedTask.attachments.length > 0 && (
              <div className="border-t border-border pt-4 mb-4">
                <h4 className="text-xs text-muted-foreground font-medium mb-3 flex items-center gap-2">
                  <Paperclip size={14} className="text-primary" /> Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.attachments.map((file, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleDownload(file)}
                      className="group flex items-center gap-2 bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-primary transition-all truncate max-w-[200px]"
                    >
                      <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                      {file}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="text-xs text-muted-foreground font-medium mb-2">Activity</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                    Assigned to: {getAssignedName(selectedTask)} 
                    · Created by: {
                        typeof selectedTask?.createdBy === 'string' 
                        ? selectedTask?.assigned_by_name || "System" 
                        : selectedTask?.createdBy?.name || "System"
                    }
                </div>
                <div>Status: {selectedTask?.status || "todo"} · Deadline: {selectedTask?.deadline || "No Date"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

