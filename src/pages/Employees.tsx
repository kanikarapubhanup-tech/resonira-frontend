import { useState } from "react";
import { Search, Plus, X, Users, UserCheck, UserX, Building } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserManagement } from "@/hooks/useUserManagement";

const departments = ["Engineering", "Design", "Marketing", "HR", "Finance", "Operations"];

const deptColors: Record<string, string> = {
  Engineering: "bg-primary/15 text-primary",
  Design: "bg-accent/15 text-accent",
  Marketing: "bg-warning/15 text-warning",
  HR: "bg-success/15 text-success",
  Finance: "bg-destructive/15 text-destructive",
  Operations: "bg-muted text-muted-foreground",
};

export default function Employees() {
  const { users, toggleUserStatus, createUser, deleteUser } = useUserManagement();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  
  // Add Employee form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newJobId, setNewJobId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newJoiningDate, setNewJoiningDate] = useState("");

  const resetForm = () => {
    setNewName(""); setNewEmail(""); setNewJobId(""); setNewPhone("");
    setNewDept(""); setNewRole(""); setNewJoiningDate("");
  };

  // Transform and Filter users: We only want to show users with the 'Employee' role in this module.
  // Managers and HR staff are excluded from this board as per requirements.
  const empList = users
    .filter(u => u.role === "Employee")
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dept: u.department || "General",
      role: u.employeeRole || u.role,
      lastLogin: "Just now", // In real app this would come from logs
      active: u.status === "Active",
      avatar: u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    }));

  // Dynamic Stat Calculations
  const totalEmployees = empList.length;
  const activeEmployees = empList.filter(u => u.active).length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  const departmentCount = new Set(empList.map(u => u.dept).filter(Boolean)).size;

  const statCards = [
    { label: "Total Employees", value: totalEmployees.toString(), icon: Users, color: "text-primary" },
    { label: "Active", value: activeEmployees.toString(), icon: UserCheck, color: "text-success" },
    { label: "Inactive", value: inactiveEmployees.toString(), icon: UserX, color: "text-destructive" },
    { label: "Departments", value: departmentCount.toString(), icon: Building, color: "text-accent" },
  ];

  const handleAddEmployee = async () => {
    if (!newName.trim() || !newEmail.trim() || !newJobId.trim() || !newDept || !newRole.trim()) {
      toast.error("Please fill all required fields (Name, Email, Job ID, Department, Role)");
      return;
    }
    
    try {
      await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: "Employee",
        department: newDept,
        employeeRole: newRole.trim(),
        password: "password123" // Default password
      });
      
      resetForm();
      setShowAddModal(false);
      toast.success(`${newName} added successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add employee");
    }
  };

  const filtered = empList.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.dept === deptFilter;
    return matchSearch && matchDept;
  });

  const toggleStatus = (id: string) => {
    toggleUserStatus(id);
    toast.success("Employee status updated");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold">Employee Management</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card-surface p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-heading font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or Job ID..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="All">All Departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="p-3 w-8"><input type="checkbox" className="rounded" /></th>
              <th className="p-3">Employee</th>
              <th className="p-3">Department</th>
              <th className="p-3">Role</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr
                key={e.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                style={{ borderLeft: `3px solid ${e.active ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)"}` }}
                onClick={() => navigate(`/employee-details/${e.id}`)}
              >
                <td className="p-3" onClick={ev => ev.stopPropagation()}><input type="checkbox" className="rounded" /></td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{e.avatar}</div>
                    <div>
                      <div className="font-medium text-foreground">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground">{e.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3"><span className={`badge-pill ${deptColors[e.dept] || "bg-secondary text-muted-foreground"}`}>{e.dept}</span></td>
                <td className="p-3 text-muted-foreground">{e.role}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${e.lastLogin.includes("min") ? "bg-success" : "bg-muted-foreground"}`} />
                    <span className="text-muted-foreground text-xs">{e.lastLogin}</span>
                  </div>
                </td>
                <td className="p-3" onClick={ev => ev.stopPropagation()}>
                  <button
                    onClick={() => toggleStatus(e.id)}
                    className={`badge-pill cursor-pointer transition-colors ${e.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                  >
                    {e.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3" onClick={ev => ev.stopPropagation()}>
                  <div className="flex gap-2">
                    <button className="text-xs text-primary hover:underline" onClick={() => navigate(`/employee-details/${e.id}`)}>Edit</button>
                    <button 
                      onClick={() => { deleteUser(e.id); toast.success("Employee deleted"); }}
                      className="text-xs text-destructive hover:underline"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <ModalOverlay onClose={() => { setShowAddModal(false); resetForm(); }}>
          <div className="card-surface p-6 w-full max-w-lg animate-fade-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-heading font-bold text-lg">Add Employee</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name *" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email *" type="email" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={newJobId} onChange={e => setNewJobId(e.target.value)} placeholder="Job ID *" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <select value={newDept} onChange={e => setNewDept(e.target.value)} className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm col-span-2">
                <option value="">Select Department *</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Designation *" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={newJoiningDate} onChange={e => setNewJoiningDate(e.target.value)} placeholder="Joining Date" type="date" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button
              onClick={handleAddEmployee}
              className="gradient-primary text-primary-foreground w-full mt-5 py-2.5 rounded-xl text-sm font-semibold hover:scale-[1.02] transition-transform"
            >Add Employee</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
