import { useState } from "react";
import {
  Users, UserCheck, UserX, Building, Search, Plus, X, Shield,
  ClipboardList, Lock, Megaphone, Server, CreditCard, Activity,
  Database, Globe, Cpu, Clock, Palmtree, Check, X as CloseIcon, AlertCircle, Edit, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import { useLeave } from "@/hooks/useLeave";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useNavigate } from "react-router-dom";

const tabs = [
  { key: "users", label: "User Management", icon: Users },
  { key: "leave", label: "Leave Management", icon: Palmtree },
  { key: "roles", label: "Roles & Permissions", icon: Shield },
  { key: "audit", label: "Audit Log", icon: ClipboardList },
  { key: "security", label: "Security", icon: Lock },
  { key: "announce", label: "Announcements", icon: Megaphone },
  { key: "infra", label: "System Infra", icon: Server },
  { key: "billing", label: "Billing", icon: CreditCard },
];

const roles = ["Super Admin", "HR Manager", "Manager", "Employee", "IT Support"];
const modules = ["Dashboard", "Employees", "Attendance", "Tasks", "Leave", "Documents", "Meetings", "Chat", "Analytics", "Admin"];
const permTypes = ["View", "Create", "Edit", "Delete", "Export"];
const permColors = ["bg-primary/15 text-primary", "bg-success/15 text-success", "bg-warning/15 text-warning", "bg-destructive/15 text-destructive", "bg-accent/15 text-accent"];

const auditLog = [
  { time: "2026-03-07 09:15:32", user: "Arjun Sharma", avatar: "AS", action: "Login", module: "Auth", ip: "192.168.1.42", status: "Success" },
  { time: "2026-03-07 09:20:14", user: "Priya Patel", avatar: "PP", action: "Create", module: "Tasks", ip: "192.168.1.38", status: "Success" },
  { time: "2026-03-07 08:55:01", user: "Vikram Reddy", avatar: "VR", action: "Edit", module: "Documents", ip: "10.0.0.15", status: "Success" },
  { time: "2026-03-06 18:30:22", user: "Rahul Menon", avatar: "RM", action: "Delete", module: "Leave", ip: "172.16.0.8", status: "Warning" },
  { time: "2026-03-06 17:12:45", user: "System", avatar: "SY", action: "Export", module: "Analytics", ip: "10.0.0.1", status: "Success" },
];

const actionColors: Record<string, string> = { Login: "border-l-primary", Create: "border-l-success", Edit: "border-l-warning", Delete: "border-l-destructive", Export: "border-l-accent" };

const securityAlerts = [
  { severity: "High", msg: "Multiple failed login attempts from IP 203.45.12.8", time: "10 min ago" },
  { severity: "Medium", msg: "Unusual file download pattern detected for user VR", time: "2 hours ago" },
  { severity: "Low", msg: "Password expiry warning for 3 users", time: "1 day ago" },
];

const sessions = [
  { name: "Arjun Sharma", avatar: "AS", device: "Chrome · macOS", location: "Hyderabad", time: "Active now", current: true },
  { name: "Arjun Sharma", avatar: "AS", device: "Mobile · iOS", location: "Hyderabad", time: "2 hours ago", current: false },
  { name: "Priya Patel", avatar: "PP", device: "Firefox · Windows", location: "Bangalore", time: "30 min ago", current: false },
];

const announcements = [
  { title: "Office Diwali Celebration", target: "All", date: "Mar 5", views: 42, status: "Sent" },
  { title: "Q2 Goals Kickoff", target: "Engineering", date: "Mar 10", views: 0, status: "Scheduled" },
];

export default function Admin() {
  const { role } = useAuth();
  const { records, currentSession, isPunchedIn } = useAttendance();
  const { leaveRequests, updateLeaveStatus } = useLeave();
  const { users, toggleUserStatus, deleteUser } = useUserManagement();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");

  const visibleTabs = tabs.filter(t => {
    if (t.key === "infra" || t.key === "billing") return role === "administrator";
    return true;
  });

  const [selectedRole, setSelectedRole] = useState("Super Admin");
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const p: Record<string, Record<string, boolean>> = {};
    modules.forEach(m => { p[m] = {}; permTypes.forEach(pt => { p[m][pt] = Math.random() > 0.3; }); });
    return p;
  });
  const [auditFilter, setAuditFilter] = useState("All Events");
  const [minPwdLen, setMinPwdLen] = useState(8);
  const [mfa, setMfa] = useState(true);

  const togglePerm = (mod: string, perm: string) => {
    setPermissions(prev => ({ ...prev, [mod]: { ...prev[mod], [perm]: !prev[mod][perm] } }));
    toast.success("Permission updated");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-2xl overflow-x-auto">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-up">
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {[
                  { label: "Total Users", value: users.length.toString(), icon: Users, color: "text-primary" },
                  { label: "Active", value: users.filter(u => u.status === "Active").length.toString(), icon: UserCheck, color: "text-success" },
                  { label: "System Roles", value: "4", icon: Shield, color: "text-accent" },
                  { label: "Live Active", value: (isPunchedIn ? 1 : 0).toString(), icon: Clock, color: "text-accent" },
                ].map(s => (
                  <div key={s.label} className="card-surface p-4">
                    <div className="flex items-center gap-2 mb-1"><s.icon size={16} className={s.color} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
                    <div className="text-2xl font-heading font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              {role === "administrator" && (
                <button 
                  onClick={() => navigate("/user-management")}
                  className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> Manage Accounts
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search system users..."
                  className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="p-3 w-8"><input type="checkbox" /></th>
                    <th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Department</th>
                    <th className="p-3">Status</th><th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(e => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors" style={{ borderLeft: `3px solid ${e.status === "Active" ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)"}` }}>
                      <td className="p-3"><input type="checkbox" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                            {e.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div><div className="font-medium text-xs">{e.name}</div><div className="text-[10px] text-muted-foreground">{e.email}</div></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`badge-pill text-[10px] ${
                          e.role === "Admin" ? "bg-destructive/15 text-destructive" :
                          e.role === "Manager" ? "bg-primary/15 text-primary" :
                          e.role === "HR" ? "bg-success/15 text-success" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {e.role}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{e.department || "—"}</td>
                      <td className="p-3">
                        <button onClick={() => { toggleUserStatus(e.id); toast.success("Status updated"); }}
                          className={`badge-pill cursor-pointer text-[10px] ${e.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {e.status}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={() => navigate("/user-management")} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit size={14} /></button>
                          <button onClick={() => { deleteUser(e.id); toast.success("User removed"); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "leave" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Requests", value: leaveRequests.length.toString(), icon: Palmtree, color: "text-primary" },
                { label: "Pending", value: leaveRequests.filter(r => r.status === "Pending").length.toString(), icon: Clock, color: "text-warning" },
                { label: "Approved", value: leaveRequests.filter(r => r.status === "Approved").length.toString(), icon: Check, color: "text-success" },
                { label: "Rejected", value: leaveRequests.filter(r => r.status === "Rejected").length.toString(), icon: CloseIcon, color: "text-destructive" },
              ].map(s => (
                <div key={s.label} className="card-surface p-4">
                  <div className="flex items-center gap-2 mb-1"><s.icon size={16} className={s.color} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
                  <div className="text-2xl font-heading font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            
            <div className="card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Applied</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">{r.avatar}</div>
                          <div><div className="font-medium text-xs">{r.userName}</div><div className="text-[10px] text-muted-foreground">{r.dept}</div></div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">{r.type}</td>
                      <td className="p-3">
                        <div className="text-xs font-medium">{r.days} Days</div>
                        <div className="text-[10px] text-muted-foreground">{r.from} - {r.to}</div>
                      </td>
                      <td className="p-3">
                        <span className={`badge-pill text-[10px] ${
                          r.status === "Approved" ? "bg-success/15 text-success" : 
                          r.status === "Pending" ? "bg-warning/15 text-warning" : 
                          "bg-destructive/15 text-destructive"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-muted-foreground">{r.appliedDate}</td>
                      <td className="p-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-2">
                            <button onClick={() => { updateLeaveStatus(r.id, "Approved"); toast.success("Approved"); }} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success hover:text-white transition-all"><Check size={14} /></button>
                            <button onClick={() => { updateLeaveStatus(r.id, "Rejected"); toast.success("Rejected"); }} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"><CloseIcon size={14} /></button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaveRequests.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leave records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              {roles.map(r => (
                <button key={r} onClick={() => setSelectedRole(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedRole === r ? "bg-secondary border-l-4 border-l-primary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                    }`}>{r}</button>
              ))}
              <button className="w-full text-left px-4 py-3 rounded-xl text-sm text-primary hover:bg-secondary/50 transition-colors">+ Create Custom Role</button>
            </div>
            <div className="lg:col-span-3 card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="p-3">Module</th>
                    {permTypes.map((p, i) => <th key={p} className="p-3 text-center">{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => (
                    <tr key={mod} className="border-b border-border/50">
                      <td className="p-3 font-medium">{mod}</td>
                      {permTypes.map((pt, i) => (
                        <td key={pt} className="p-3 text-center">
                          <button onClick={() => togglePerm(mod, pt)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${permissions[mod]?.[pt] ? permColors[i].split(" ")[0] : "bg-secondary"}`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${permissions[mod]?.[pt] ? "left-[calc(100%-22px)] bg-foreground" : "left-0.5 bg-muted-foreground"
                              }`} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {["All Events", "Login", "Create", "Edit", "Delete", "Export"].map(f => (
                <button key={f} onClick={() => setAuditFilter(f)}
                  className={`badge-pill cursor-pointer transition-colors ${auditFilter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{f}</button>
              ))}
            </div>
            <div className="card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="p-3">Timestamp</th><th className="p-3">User</th><th className="p-3">Action</th>
                    <th className="p-3">Module</th><th className="p-3">IP Address</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Real History from records */}
                  {records.map((r, i) => (
                    <tr key={`rec-${i}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors border-l-4 border-l-success">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{new Date(r.punchIn).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success text-[9px] font-bold">
                            {r.userName ? r.userName.split(' ').map(n => n[0]).join('') : "U"}
                          </div>
                          <span>{r.userName || "Unknown User"}</span>
                        </div>
                      </td>
                      <td className="p-3 italic">Check Out</td>
                      <td className="p-3"><span className="badge-pill bg-success/15 text-success">Attendance</span></td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">Internal</td>
                      <td className="p-3"><span className="badge-pill bg-success/15 text-success">Completed</span></td>
                    </tr>
                  ))}
                  {/* Live Punch In */}
                  {currentSession && (
                    <tr key="live" className="border-b border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors border-l-4 border-l-primary animate-pulse">
                      <td className="p-3 font-mono text-xs text-primary font-bold">LIVE NOW</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                            {currentSession.userName ? currentSession.userName.split(' ').map(n => n[0]).join('') : "U"}
                          </div>
                          <span className="font-bold">{currentSession.userName || "Unknown User"}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold">Check In</td>
                      <td className="p-3"><span className="badge-pill bg-primary/15 text-primary">Attendance</span></td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">Active Hub</td>
                      <td className="p-3"><span className="badge-pill bg-primary/20 text-primary animate-bounce">ON DUTY</span></td>
                    </tr>
                  )}
                  {auditLog.filter(l => auditFilter === "All Events" || l.action === auditFilter).map((l, i) => (
                    <tr key={i} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors border-l-4 ${actionColors[l.action] || ""}`}>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{l.time}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">{l.avatar}</div>
                          <span>{l.user}</span>
                        </div>
                      </td>
                      <td className="p-3">{l.action}</td>
                      <td className="p-3"><span className="badge-pill bg-secondary text-muted-foreground">{l.module}</span></td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{l.ip}</td>
                      <td className="p-3"><span className={`badge-pill ${l.status === "Success" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="card-surface p-5">
              <h3 className="font-heading font-bold mb-4">Security Alerts</h3>
              <div className="space-y-3">
                {securityAlerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border-l-4 ${a.severity === "High" ? "border-l-destructive" : a.severity === "Medium" ? "border-l-warning" : "border-l-success"
                    }`}>
                    <span className={`badge-pill text-[10px] ${a.severity === "High" ? "bg-destructive/15 text-destructive" : a.severity === "Medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                      }`}>{a.severity}</span>
                    <div className="flex-1">
                      <p className="text-sm">{a.msg}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{a.time}</p>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-5">
              <h3 className="font-heading font-bold mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{s.avatar}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.device} · {s.location} · {s.time}</div>
                    </div>
                    {s.current ? (
                      <span className="badge-pill bg-success/15 text-success text-[10px]">You</span>
                    ) : (
                      <button className="text-xs text-destructive hover:underline">Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-5">
              <h3 className="font-heading font-bold mb-4">Password Policy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Min Length</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setMinPwdLen(Math.max(6, minPwdLen - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">−</button>
                    <span className="font-mono text-lg font-bold w-8 text-center">{minPwdLen}</span>
                    <button onClick={() => setMinPwdLen(Math.min(20, minPwdLen + 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Expiry (days)</label>
                  <select className="w-full mt-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm"><option>90</option><option>60</option><option>30</option></select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MFA Required</span>
                  <button onClick={() => { setMfa(!mfa); toast.success("MFA " + (!mfa ? "enabled" : "disabled")); }}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${mfa ? "bg-success/30" : "bg-secondary"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${mfa ? "left-[calc(100%-22px)] bg-success" : "left-0.5 bg-muted-foreground"}`} />
                  </button>
                </div>
              </div>
              <button onClick={() => toast.success("Policy saved")} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold mt-4">Save Policy</button>
            </div>
          </div>
        )}

        {activeTab === "announce" && (
          <div className="space-y-6">
            <div className="card-surface p-5">
              <h3 className="font-heading font-bold mb-4">Compose Announcement</h3>
              <div className="space-y-3">
                <input placeholder="Title" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm" />
                <div className="relative">
                  <textarea placeholder="Message..." rows={4} maxLength={500} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm resize-none" />
                  <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">0/500</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm"><option>All Employees</option><option>Engineering</option><option>Design</option></select>
                  <input type="datetime-local" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => toast.success("Announcement sent")} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">Send Now</button>
                  <button onClick={() => toast.success("Announcement scheduled")} className="bg-warning/15 text-warning px-6 py-2 rounded-xl text-sm font-semibold">Schedule</button>
                </div>
              </div>
            </div>
            <div className="card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="p-3">Title</th><th className="p-3">Target</th><th className="p-3">Date</th><th className="p-3">Views</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                <tbody>
                  {announcements.map((a, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-medium">{a.title}</td>
                      <td className="p-3"><span className="badge-pill bg-primary/15 text-primary">{a.target}</span></td>
                      <td className="p-3 text-muted-foreground">{a.date}</td>
                      <td className="p-3">{a.views}</td>
                      <td className="p-3"><span className={`badge-pill ${a.status === "Sent" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{a.status}</span></td>
                      <td className="p-3"><div className="flex gap-2"><button className="text-xs text-primary hover:underline">Edit</button><button className="text-xs text-destructive hover:underline">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "infra" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "CPU Usage", value: "24%", icon: Cpu, color: "text-primary" },
                { label: "Memory", value: "4.2GB / 8GB", icon: Activity, color: "text-success" },
                { label: "DB Connections", value: "128", icon: Database, color: "text-accent" },
                { label: "Edge Nodes", value: "12", icon: Globe, color: "text-warning" },
              ].map(s => (
                <div key={s.label} className="card-surface p-4">
                  <div className="flex items-center gap-2 mb-1"><s.icon size={16} className={s.color} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
                  <div className="text-2xl font-heading font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="card-surface p-6">
              <h3 className="font-heading font-bold mb-4">System Logistics</h3>
              <div className="space-y-4">
                {[
                  { name: "Main API Cluster", status: "Healthy", uptime: "99.98%", load: "Low" },
                  { name: "Auth Microservice", status: "Healthy", uptime: "100%", load: "Idle" },
                  { name: "Real-time Gateway", status: "Healthy", uptime: "99.95%", load: "Medium" },
                ].map(svc => (
                  <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                    <div>
                      <div className="text-sm font-bold">{svc.name}</div>
                      <div className="text-[10px] text-muted-foreground">Uptime: {svc.uptime}</div>
                    </div>
                    <div className="text-right">
                      <span className="badge-pill bg-success/15 text-success text-[10px]">{svc.status}</span>
                      <div className="text-[10px] text-muted-foreground mt-1">Load: {svc.load}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="card-surface p-8 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold">Enterprise Plan</h3>
                  <p className="text-sm text-muted-foreground">Next billing date: April 1, 2026</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-primary">$499</span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Seats Used</p>
                  <p className="text-lg font-bold">48 / 100</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">Storage</p>
                  <p className="text-lg font-bold">124GB / 500GB</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground mb-1">API Calls</p>
                  <p className="text-lg font-bold">2.4M / 10M</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
