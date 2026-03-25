import { useState, useEffect } from "react";
import { CheckSquare, Palmtree, Calendar, MessageCircle, TrendingUp, Plus, Clock, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance } from "@/hooks/useAttendance";
import { useTask } from "@/hooks/useTask";
import { useLeave } from "@/hooks/useLeave";
import { useMeeting } from "@/hooks/useMeeting";
import { useNavigate } from "react-router-dom";

const productivityData = [
  { day: "Mon", tasks: 8 }, { day: "Tue", tasks: 12 }, { day: "Wed", tasks: 6 },
  { day: "Thu", tasks: 10 }, { day: "Fri", tasks: 11 },
];

const meetings = [
  { time: "10:00 AM", title: "Sprint Planning", attendees: 8, tag: "Recurring" },
  { time: "2:00 PM", title: "Design Review", attendees: 4, tag: "One-time" },
  { time: "4:30 PM", title: "Client Sync — Fintech", attendees: 3, tag: "External" },
];

const quickActions = [
  { label: "New Task", icon: Plus, path: "/create-task" },
  { label: "Request Leave", icon: Palmtree, path: "/leave" },
  { label: "Schedule Meeting", icon: Calendar, path: "/meetings" },
  { label: "Upload Document", icon: FileText, path: "/documents" },
];

export default function Dashboard() {
  const { user, role } = useAuth();
  const { records, punchIn, punchOut, isPunchedIn, getDuration } = useAttendance();
  const { tasks } = useTask();
  const { leaveRequests } = useLeave();
  const { meetings } = useMeeting();
  
  const navigate = useNavigate();
  const [localSeconds, setLocalSeconds] = useState(0);

  // Dynamic Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Tasks Due Today
  // 1. Tasks Due Today (Real count across whole org for Admin)
  // 1. Tasks Due Today (Real count across whole org for Admin)
  const tasksDueToday = (role === "administrator" ? tasks : tasks.filter(t => 
    typeof t.assignedTo === 'object' && t.assignedTo?.email === user?.email
  ))
    .filter(t => {
      const today = new Date();
      const dStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
      const fullDate = today.toISOString().split('T')[0];
      const deadline = (t.deadline || "").toLowerCase();
      return deadline && (deadline.includes(dStr) || deadline.includes(fullDate));
    }).length;

  // 2. Leave - For Admin show "Pending Applications", for others show "Balance"
  const pendingLeaves = leaveRequests.filter(r => r.status === "Pending").length;
  const approvedLeaves = leaveRequests.filter(r => r.status === "Approved" && r.userEmail === user?.email).reduce((acc, r) => acc + r.days, 0);
  const leaveBalance = Math.max(0, 24 - approvedLeaves);

  // 3. Meetings Today
  const todayMeetings = meetings.filter(m => {
    const isToday = m.date === todayStr;
    if (!isToday) return false;
    if (role === "administrator") return true;
    
    const target = m.targetRole || "All";
    if (target === "All") return true;
    
    const myRoleLabel = role === "hr" ? "HR" : role === "manager" ? "Manager" : "Employee";
    const nameMatch = target.startsWith("Employee: ") && target.includes(user?.name || "");
    
    return target === myRoleLabel || nameMatch;
  });
  const meetingsCount = todayMeetings.length;

  // 4. Unread Messages - Based on real log entries
  const [unreadMsgCount, setUnreadMsgCount] = useState(0); 
  useEffect(() => {
    const logs = localStorage.getItem("globalChatLogs");
    if (logs) {
      try {
        const parsed = JSON.parse(logs);
        let count = 0;
        Object.values(parsed).forEach((roomMsgs: any) => {
          if (Array.isArray(roomMsgs)) {
            roomMsgs.forEach((m: any) => {
              if (m.read === false && m.senderId !== user?.email) count++; 
            });
          }
        });
        setUnreadMsgCount(count);
      } catch { setUnreadMsgCount(0); }
    }
  }, [user?.email]);

  // 5. Attendance % - Organization-wide for Admin, personal for others
  const userRecords = records.filter(r => r.userEmail === user?.email);
  const attendanceRate = role === "administrator" 
    ? (records.length > 0 ? Math.min(100, Math.round((records.length / 50) * 100)) : 9) // Simulated org-wide goal of 50
    : (userRecords.length > 0 ? Math.min(100, Math.round((userRecords.length / 22) * 100)) : 0);

  const stats = [
    { 
      label: "Tasks Due Today", 
      value: tasksDueToday.toString(), 
      icon: CheckSquare, 
      color: "text-primary", 
      path: "/tasks" 
    },
    { 
      label: role === "administrator" ? "Pending Leaves" : "Leave Balance", 
      value: (role === "administrator" ? pendingLeaves : leaveBalance).toString(), 
      icon: Palmtree, 
      color: "text-success", 
      path: role === "administrator" ? "/leave-approvals" : "/leave" 
    },
    { 
      label: "Meetings Today", 
      value: meetingsCount.toString(), 
      icon: Calendar, 
      color: "text-accent", 
      path: "/meetings" 
    },
    { 
      label: "Unread Messages", 
      value: unreadMsgCount.toString(), 
      icon: MessageCircle, 
      color: "text-warning", 
      path: "/chat" 
    },
    { 
      label: role === "administrator" ? "Org Attendance %" : "Attendance %", 
      value: `${attendanceRate}%`, 
      icon: TrendingUp, 
      color: "text-success", 
      path: role === "administrator" ? "/attendance-reports" : "/attendance" 
    },
  ];

  useEffect(() => {
    setLocalSeconds(getDuration());
    const interval = setInterval(() => {
      setLocalSeconds(getDuration());
    }, 1000);
    return () => clearInterval(interval);
  }, [getDuration]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Good Morning, {user?.name || 'User'} 👋</h1>
          <p className="text-muted-foreground text-sm md:text-base capitalize">{user?.email ? `${user.email} · ` : ''}{role} Portal</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-up-1">
        {stats.map((s) => (
          <div 
            key={s.label} 
            onClick={() => navigate(s.path)}
            className="card-surface p-4 cursor-pointer hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:bg-secondary/40 transition-all duration-300 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(s.path);
              }
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={`${s.color} group-hover:drop-shadow-[0_0_8px_currentColor] transition-all`} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
            </div>
            <div className="text-2xl font-heading font-bold group-hover:text-primary transition-colors">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart + Meetings */}
      <div className="grid lg:grid-cols-3 gap-6 animate-fade-up-2">
        <div className="lg:col-span-2 card-surface p-5">
          <h3 className="font-heading font-bold mb-4">Weekly Productivity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
              <XAxis dataKey="day" stroke="hsl(217 25% 46%)" fontSize={12} />
              <YAxis stroke="hsl(217 25% 46%)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 30% 18%)", borderRadius: 12, color: "hsl(222 80% 97%)" }}
              />
              <Bar dataKey="tasks" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" />
                  <stop offset="100%" stopColor="hsl(263 70% 58%)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-5">
          <h3 className="font-heading font-bold mb-4">Upcoming Meetings</h3>
          <div className="space-y-3">
            {todayMeetings.length > 0 ? todayMeetings.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-1 rounded-lg">{m.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.title}</div>
                  <div className="text-[11px] text-muted-foreground">{m.attendees} attendees</div>
                </div>
                <span className="badge-pill bg-accent/15 text-accent text-[10px]">{m.type}</span>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground text-sm">No meetings scheduled for today</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-up-3">
        <h3 className="font-heading font-bold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)} className="card-surface px-4 py-2.5 flex items-center gap-2 text-sm font-medium hover:bg-secondary/50 transition-all duration-200 hover:scale-105">
              <a.icon size={16} className="text-primary" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
