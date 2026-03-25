import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Clock, CheckSquare, Palmtree,
  FileText, Calendar, MessageCircle, BarChart3, Shield, Settings, Bell,
  Plus, Building, UserCircle, LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotification } from "@/hooks/useNotification";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useTask } from "@/hooks/useTask";
import { useLeave } from "@/hooks/useLeave";

export function AppSidebar({ onNotifClick, isOpen, onClose }: { onNotifClick: () => void; isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { role, user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { users } = useUserManagement();
  const { tasks } = useTask();
  const { leaveRequests } = useLeave();
  const navigate = useNavigate();

  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // 1. Calculate unread chat messages
  useEffect(() => {
    const calculateChatUnread = () => {
      const savedLogs = localStorage.getItem("globalChatLogs");
      const currentUserData = users.find(u => u.email === user?.email);
      const myId = user?.email === "admin@resonira.com" ? 999 : (currentUserData ? (parseInt(currentUserData.id.replace(/\D/g, '')) || 0) : 0);

      if (!savedLogs || !myId) {
        setChatUnreadCount(0);
        return;
      }

      try {
        const logs: Record<string, any[]> = JSON.parse(savedLogs);
        let count = 0;
        Object.entries(logs).forEach(([roomKey, messages]) => {
          // Room keys are "ID1-ID2". Only count messages if I am one of the IDs.
          const participants = roomKey.split('-').map(id => parseInt(id));
          if (participants.includes(myId)) {
            messages.forEach(msg => {
              // Use non-strict equality to handle potential string/number mismatches from different login flows
              if (msg.senderId != myId && !msg.read) {
                count++;
              }
            });
          }
        });
        setChatUnreadCount(count);
      } catch (e) {
        setChatUnreadCount(0);
      }
    };

    calculateChatUnread();
    window.addEventListener("storage", calculateChatUnread);
    const interval = setInterval(calculateChatUnread, 2000); // Polling sync for within same tab
    return () => {
      window.removeEventListener("storage", calculateChatUnread);
      clearInterval(interval);
    };
  }, [user?.email, users]);

  // 2. Calculate dynamic badges
  const activeTasksCount = role === "employee"
    ? (Array.isArray(tasks) ? tasks.filter(t => t.assigneeEmail === user?.email && t.status !== "done").length : 0)
    : (Array.isArray(tasks) ? tasks.filter(t => t.status !== "done").length : 0);

  const pendingLeavesCount = Array.isArray(leaveRequests) ? leaveRequests.filter(req => req.status === "Pending").length : 0;

  const allNavItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["employee", "hr", "manager", "administrator"], badge: undefined },
    { to: "/employees", icon: Users, label: "Employees", roles: ["hr", "administrator"], badge: undefined },
    { to: "/attendance", icon: Clock, label: "Attendance", roles: ["employee", "hr", "manager"], badge: undefined },
    { to: "/attendance-reports", icon: BarChart3, label: "Attendance Reports", roles: ["hr", "administrator"], badge: undefined },
    { to: "/tasks", icon: CheckSquare, label: "Tasks", roles: ["employee", "hr", "manager", "administrator"], badge: activeTasksCount > 0 ? activeTasksCount : undefined },
    { to: "/create-task", icon: Plus, label: "Create Task", roles: ["hr", "manager", "administrator"], badge: undefined },
    { to: "/leave", icon: Palmtree, label: "Leave", roles: ["employee", "administrator"], badge: undefined },
    { to: "/leave-approvals", icon: Shield, label: "Leave Approvals", roles: ["hr", "manager", "administrator"], badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined },
    { to: "/hr-leave-management", icon: Palmtree, label: "Leave Management", roles: ["hr"], badge: undefined },
    { to: "/documents", icon: FileText, label: "Documents", roles: ["employee", "hr", "manager", "administrator"], badge: undefined },
    { to: "/departments", icon: Building, label: "Departments", roles: ["hr", "administrator"], badge: undefined },
    { to: "/meetings", icon: Calendar, label: "Meetings", roles: ["employee", "manager", "administrator"], badge: undefined },
    { to: "/calendar", icon: Calendar, label: "Calendar", roles: ["employee", "hr", "manager", "administrator"], badge: undefined },
    { to: "/chat", icon: MessageCircle, label: "Chat", roles: ["employee", "hr", "manager", "administrator"], badge: chatUnreadCount > 0 ? chatUnreadCount : undefined },
    { to: "/analytics", icon: BarChart3, label: "Analytics", roles: ["hr", "manager", "administrator"], badge: undefined },
    { to: "/settings", icon: Settings, label: "Settings", roles: ["employee", "hr", "manager", "administrator"], badge: undefined },
    { to: "/user-management", icon: Users, label: "User Management", roles: ["administrator"], badge: undefined },
    { to: "/profile", icon: UserCircle, label: "Profile", roles: ["employee", "administrator"], badge: undefined },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role as string));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-[220px] bg-background border-r border-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center font-heading font-black text-sm text-primary-foreground">
            R
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-foreground leading-none">Resonira</div>
            <div className="text-[11px] text-muted-foreground leading-none mt-0.5">Workplace</div>
          </div>
        </div>

        <ThemeToggle />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                  ? "gradient-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-foreground" />
                )}
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"
                    }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.name || 'Guest'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email || 'No email provided'}</div>
            </div>
            <button
              onClick={onNotifClick}
              className="relative p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Bell size={18} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-[10px] text-primary font-black uppercase tracking-widest leading-none block">{role} Portal</span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
