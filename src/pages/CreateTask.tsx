import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Send, X, Paperclip, Calendar, User,
    Tag, Flag, ListChecks, Type
} from "lucide-react";
import { useTask } from "@/hooks/useTask";
import { useAuth } from "@/hooks/useAuth";
import { useUserManagement } from "@/hooks/useUserManagement";
import { TaskPriority } from "@/types/task.types";

const CreateTask = () => {
    const { addTask } = useTask();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("Medium");
    const [category, setCategory] = useState("Development");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { users } = useUserManagement();

    // Dynamically derive assignee options from real users (Employees only)
    const assigneeOptions = users
        .map(u => ({
            id: u.employeeId || u.id,
            name: u.name,
            dept: u.department || "General",
            avatar: (u.name || "U").split(" ").map(n => n[0]).join("").toUpperCase(),
            email: u.email
        }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            toast.error("Title is required");
            return;
        }

        // Task 4: Use alert for missing assignee
        if (!assigneeId) {
            alert("Please select an employee");
            return;
        }

        if (!dueDate) {
            toast.error("Please select a due date");
            return;
        }

        console.log("[Protocol] Submitting task with assigneeId:", assigneeId);
        setLoading(true);

        try {
            const taskToSubmit = {
                title,
                description,
                assignedTo: String(assigneeId),
                deadline: dueDate,
                priority,
                category,
                attachments: attachments.map(f => f.name),
            };
            console.log("[Protocol] Calling addTask with:", JSON.stringify(taskToSubmit));
            await addTask(taskToSubmit);

            toast.success(`Task "${title}" assigned successfully`);
            navigate("/tasks");
        } catch (error: any) {
            console.error("[Protocol] Task creation failed", error);
            
            // Task 7: Proper error handling
            if (error.response?.status === 403) {
                toast.error("You don’t have permission");
            } else if (error.response?.status === 400) {
                toast.error(error.response?.data?.message || "Validation error: Check your input");
            } else {
                toast.error("Failed to create task. Please try again.");
            }
            // Do NOT navigate on failure (Task 7)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Create New Task</h1>
                    <p className="text-muted-foreground text-sm">Assign a new task to your team members</p>
                </div>
                <button onClick={() => navigate("/tasks")} className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card-surface p-8 space-y-8">
                    {/* Task Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
                            <Type size={16} /> Basic Information
                        </div>
                        <div className="space-y-4">
                            <input
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Task title (e.g. Implement OAuth Flow)"
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-lg font-medium focus:border-primary outline-none transition-all"
                            />
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Description of the task..."
                                rows={4}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Assignment & Due Date */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <User size={14} /> Assignee
                                </label>
                                <select
                                    required
                                    value={assigneeId || ""}
                                    onChange={e => setAssigneeId(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                >
                                    <option value="">Select team member</option>
                                    {assigneeOptions.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.dept})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar size={14} /> Due Date
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Priority & Category */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Flag size={14} /> Priority
                                </label>
                                <div className="flex gap-2">
                                    {(["Low", "Medium", "High"] as const).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${priority === p
                                                ? p === "High"
                                                    ? "bg-destructive/20 border-destructive text-destructive"
                                                    : p === "Medium"
                                                        ? "bg-warning/20 border-warning text-warning"
                                                        : "bg-success/20 border-success text-success"
                                                : "bg-secondary/50 border-border hover:border-primary"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Tag size={14} /> Category
                                </label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                >
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Review</option>
                                    <option>Documentation</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Checklist & Attachments */}
                    <div className="pt-8 border-t border-border space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <button type="button" className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all">
                                <ListChecks size={18} /> Add Checklist
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                multiple 
                                className="hidden" 
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                        toast.success(`${e.target.files.length} file(s) attached`);
                                    }
                                }}
                            />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all"
                            >
                                <Paperclip size={18} /> Attach Files
                            </button>
                        </div>

                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 animate-fade-in">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-secondary/80 border border-border px-3 py-1.5 rounded-lg text-xs font-medium group">
                                        <Paperclip size={12} className="text-muted-foreground" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button 
                                            type="button"
                                            onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" className="px-8 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all">
                        Save Draft
                    </button>
                    <button
                        disabled={loading}
                        type="submit"
                        className="flex items-center gap-2 gradient-primary text-primary-foreground px-10 py-3 rounded-xl text-sm font-bold shadow-xl hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        {loading ? "Creating..." : <><Send size={18} /> Create Task</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTask;
