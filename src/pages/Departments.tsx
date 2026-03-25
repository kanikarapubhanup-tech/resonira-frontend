import { Building, Users, Clock, ArrowUpRight, Plus, Search, X, Mail, Briefcase } from "lucide-react";
import { useState } from "react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useTask } from "@/hooks/useTask";
import { useAuth } from "@/hooks/useAuth";

const departmentIcons = [
    { name: "Engineering", color: "text-primary" },
    { name: "Design", color: "text-accent" },
    { name: "Marketing", color: "text-warning" },
    { name: "HR", color: "text-success" },
    { name: "Human Resources", color: "text-success" },
    { name: "Sales", color: "text-destructive" },
    { name: "IT", color: "text-primary" },
    { name: "Operations", color: "text-accent" },
    { name: "Finance", color: "text-warning" },
];

export default function Departments() {
    const { users, departments, createDepartment } = useUserManagement();
    const { tasks } = useTask();
    const { role } = useAuth();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // Modal state for Add Department
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");
    const [newDeptDesc, setNewDeptDesc] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) {
            return;
        }
        setIsSubmitting(true);
        try {
            await createDepartment({ name: newDeptName, description: newDeptDesc });
            setShowAddModal(false);
            setNewDeptName("");
            setNewDeptDesc("");
        } catch (err: any) {
            console.error("Failed to add department", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Use REAL departments from backend (fallback to unique ones if API empty)
    const uniqueDeptNames = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
    const deptListToMap = departments && departments.length > 0 
        ? departments.map((d: any) => d.name) 
        : uniqueDeptNames;

    const realDepts = Array.from(new Set(deptListToMap)).map((name: any, index: number) => {
        const deptUsers = users.filter(u => u.department === name);
        const deptTasks = tasks.filter(t => t.project === name);
        
        // Find a manager-level head if possible
        const headUser = deptUsers.find(u => u.role === "Manager") || deptUsers[0];
        const iconInfo = departmentIcons.find(i => i.name === name) || { name, color: "text-primary" };

        return {
            id: index + 1,
            name: name!,
            head: headUser?.name || "Not Assigned",
            staff: deptUsers.length,
            activities: deptTasks.length || 0,
            growth: Math.floor(Math.random() * 20) + 1, // Simulated for variety
            color: iconInfo.color
        };
    });

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold">Departments</h1>
                    <p className="text-muted-foreground text-sm">Manage organization structure and headcounts</p>
                </div>
                {(role === "administrator" || role === "hr") && (
                    <button 
                        onClick={() => setShowAddModal(true)} 
                        className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <Plus size={16} /> Add Department
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realDepts.map((dept) => (
                    <div key={dept.id} className="card-surface p-6 group cursor-pointer hover:border-primary/50 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl bg-secondary/50 ${dept.color} group-hover:scale-110 transition-transform`}>
                                <Building size={24} />
                            </div>
                            <div className="flex items-center text-success text-xs font-bold gap-1 bg-success/10 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} /> {dept.growth}%
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{dept.name}</h3>
                        <p className="text-muted-foreground text-sm mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Head: {dept.head}
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                            <div>
                                <p className="text-2xl font-bold">{dept.staff}</p>
                                <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                                    <Users size={12} /> Employees
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{dept.activities}</p>
                                <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                                    <Clock size={12} /> Projects
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedDept(dept.name)}
                            className="w-full mt-6 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-all"
                        >
                            View Details
                        </button>
                    </div>
                ))}
            </div>

            {/* Department Details Modal */}
            {selectedDept && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-card w-full max-w-2xl max-h-[80vh] rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-border flex items-center justify-between gradient-primary text-white">
                    <div>
                      <h3 className="text-xl font-heading font-black tracking-tight">{selectedDept} Breakdown</h3>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-widest mt-1">Management & Staff List</p>
                    </div>
                    <button 
                      onClick={() => setSelectedDept(null)}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {users.filter(u => u.department === selectedDept).map((u) => (
                      <div key={u.id} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {u.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground truncate">{u.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail size={12} /> {u.email}</span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Briefcase size={12} /> {u.employeeRole || u.role}</span>
                          </div>
                        </div>
                        <span className={`badge-pill text-[9px] font-black uppercase tracking-widest ${u.role === "Manager" ? "bg-accent/20 text-accent border border-accent/20" : "bg-primary/20 text-primary border border-primary/20"}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
                    <button 
                      onClick={() => setSelectedDept(null)}
                      className="px-6 py-2 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:bg-secondary transition-all"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Department Modal */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 relative animate-scale-up">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                  <h2 className="text-xl font-heading font-bold mb-5">Create Department</h2>
                  
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Department Name</label>
                        <input 
                            type="text"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            placeholder="e.g. Sales"
                            className="w-full mt-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Description (Optional)</label>
                        <textarea 
                            value={newDeptDesc}
                            onChange={(e) => setNewDeptDesc(e.target.value)}
                            placeholder="Brief description of the department's role..."
                            className="w-full mt-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none h-24"
                        />
                    </div>
                  </div>

                  <button 
                    disabled={!newDeptName.trim() || isSubmitting}
                    onClick={handleAddDepartment}
                    className="w-full mt-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50 transition-all hover:shadow-lg"
                  >
                    {isSubmitting ? "Creating..." : "Save Department"}
                  </button>
                </div>
              </div>
            )}
        </div>
    );
}
