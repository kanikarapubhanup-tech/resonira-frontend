import { useState } from "react";
import {
  Users, UserPlus, Search, Mail, Building, Clock,
  Check, X, Edit, Trash2, UserCheck, UserX, Shield, Key
} from "lucide-react";
import { toast } from "sonner";
import { useUserManagement, SystemRole, UserRecord } from "@/hooks/useUserManagement";

export default function UserManagement() {
  const { users, isLoading, departments, designations, createUser, updateUser, deleteUser, toggleUserStatus } = useUserManagement();
  
  const [activeTab, setActiveTab] = useState<"view" | "addManager" | "addHR" | "addEmployee">("view");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editUser, setEditUser] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    department: "",
    employeeRole: "",
    mobileNumber: "",
    joiningDate: "",
    employeeId: "",
  });

  const resetForm = () => {
    setFormData({ 
      firstName: "",
      lastName: "", 
      email: "", 
      password: "", 
      department: "", 
      employeeRole: "", 
      mobileNumber: "", 
      joiningDate: "",
      employeeId: ""
    });
  };

  const handleCreate = async (role: SystemRole) => {
    if (!formData.firstName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields (First Name, Email, Password)");
      return;
    }

    if ((role === "Employee" || role === "HR" || role === "Manager") && (!formData.department || !formData.employeeRole)) {
      toast.error(`Please provide Department and Role for the ${role}`);
      return;
    }

    try {
      await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: role,
        department: formData.department,
        employeeRole: formData.employeeRole,
        mobileNumber: formData.mobileNumber,
        joiningDate: formData.joiningDate,
        employeeId: formData.employeeId,
      });
      
      toast.success(`${role} account created successfully!`);
      resetForm();
      setActiveTab("view");
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null);
      toast.error(serverMessage || error.message || "Failed to create user");
    }
  };

  const filteredUsers = users.filter(u => {
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch = name.includes(searchLower) || 
                         email.includes(searchLower) ||
                         role.includes(searchLower);
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Admin access to manage system accounts and permissions</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-border">
        {[
          { id: "view", label: "View All Users", icon: Users },
          { id: "addManager", label: "Add Manager", icon: UserPlus },
          { id: "addHR", label: "Add HR", icon: UserPlus },
          { id: "addEmployee", label: "Add Employee", icon: UserPlus },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as "view" | "addManager" | "addHR" | "addEmployee"); setEditUser(null); }}
            className={`px-6 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {activeTab === "view" && !editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select 
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-secondary border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>All</option>
                <option>Employee</option>
                <option>Manager</option>
                <option>HR</option>
                <option>Admin</option>
              </select>
            </div>

            <div className="card-surface overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Loading accounts from database...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <span className={`badge-pill ${
                              u.role === "Admin" ? "bg-destructive/15 text-destructive" :
                              u.role === "Manager" ? "bg-primary/15 text-primary" :
                              u.role === "HR" ? "bg-success/15 text-success" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {u.role === "Employee" && u.employeeRole ? `${u.employeeRole}` : u.role}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.department || "—"}</td>
                          <td className="p-4">
                            <button 
                              onClick={() => toggleUserStatus(u.id)}
                              className={`badge-pill flex items-center gap-1.5 transition-all hover:scale-105 ${
                                u.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {u.status === "Active" ? <UserCheck size={12} /> : <UserX size={12} />}
                              {u.status}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => setEditUser(u)}
                                className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setIsDeleting(u.id)}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === "addManager" || activeTab === "addHR" || activeTab === "addEmployee") && (
          <div className="max-w-xl mx-auto animate-fade-up">
            <div className="card-surface p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold">
                  {activeTab === "addManager" ? "Create Manager Account" : 
                   activeTab === "addHR" ? "Create HR Account" : 
                   "Create Employee Account"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generate new login credentials for system users. 
                  {activeTab !== "addEmployee" ? " Role will be automatically assigned." : " Specify department and operational role."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      Last Name
                    </label>
                    <input
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {activeTab === "addEmployee" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      Employee ID
                    </label>
                    <input
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="e.g. EMP101"
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                ) : null}

                {(activeTab === "addEmployee" || activeTab === "addHR" || activeTab === "addManager") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        Department <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d: any) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        Role / Designation <span className="text-destructive">*</span>
                      </label>
                      <input
                        list="designations-list"
                        value={formData.employeeRole}
                        onChange={e => setFormData({ ...formData, employeeRole: e.target.value })}
                        placeholder="Select or type a role..."
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                      />
                      <datalist id="designations-list">
                        {designations
                          .filter((des: any) => !formData.department || des.department_name === formData.department || des.department?.name === formData.department)
                          .map((des: any) => (
                            <option key={des.id} value={des.title} />
                          ))
                        }
                      </datalist>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@resonira.com"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    Initial Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      Mobile Number
                    </label>
                    <input
                      value={formData.mobileNumber}
                      onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  
                  {(activeTab === "addHR" || activeTab === "addEmployee") && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleCreate(
                    activeTab === "addManager" ? "Manager" : 
                    activeTab === "addHR" ? "HR" : "Employee"
                  )}
                  className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  <UserPlus size={18} />
                  Create {activeTab === "addManager" ? "Manager" : activeTab === "addHR" ? "HR" : "Employee"} Account
                </button>
              </div>
            </div>
          </div>
        )}

        {editUser && (
          <div className="max-w-xl mx-auto animate-fade-up">
            <div className="card-surface p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                  <Edit size={20} className="text-primary" /> Edit Account
                </h2>
                <button onClick={() => setEditUser(null)} className="p-2 hover:bg-secondary rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">First Name</label>
                    <input
                      value={editUser.first_name || ""}
                      onChange={e => setEditUser({ ...editUser, first_name: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Last Name</label>
                    <input
                      value={editUser.last_name || ""}
                      onChange={e => setEditUser({ ...editUser, last_name: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email (Login Identity)</label>
                  <input
                    value={editUser.email}
                    onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                  />
                </div>
                {editUser.role !== "Admin" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                    <input
                      value={editUser.password || ""}
                      onChange={e => setEditUser({ ...editUser, password: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mobile Number</label>
                    <input
                      value={editUser.phone || ""}
                      onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Joining Date</label>
                    <input
                      type="date"
                      value={editUser.date_of_joining ? editUser.date_of_joining.split('T')[0] : ""}
                      onChange={e => setEditUser({ ...editUser, date_of_joining: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {editUser.role === "Employee" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department</label>
                      <input
                        value={editUser.department || ""}
                        onChange={e => setEditUser({ ...editUser, department: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee Role</label>
                      <input
                        value={editUser.employeeRole || ""}
                        onChange={e => setEditUser({ ...editUser, employeeRole: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee ID (Corporate Code)</label>
                  <input
                    value={editUser.employee_code || ""}
                    onChange={e => setEditUser({ ...editUser, employee_code: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    placeholder="e.g. EMP123"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  await updateUser(editUser.id, editUser);
                  setEditUser(null);
                  toast.success("User details updated");
                }}
                className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} /> Update User Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDeleting(null)} />
          <div className="relative z-10 card-surface p-6 w-full max-w-sm border-destructive/20 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 size={32} className="text-destructive" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Permanently Delete User?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This action will permanently remove the user's access and records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleting(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const idToDelete = isDeleting;
                    setIsDeleting(null); // Close modal first for UX
                    await deleteUser(idToDelete);
                  } catch (err) {
                    // Error is handled by the hook's toast.error
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-destructive/90 transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
