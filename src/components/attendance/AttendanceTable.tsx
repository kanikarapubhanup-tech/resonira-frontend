import React, { useState } from 'react';
import { Search, Filter, Calendar as CalendarIcon, Users, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react';
import { useAttendance, AttendanceRecord } from "@/hooks/useAttendance";
import { useUserManagement } from "@/hooks/useUserManagement";

export const AttendanceTable = () => {
  const { records } = useAttendance();
  const { users } = useUserManagement();
  const [activeTab, setActiveTab] = useState<'hr' | 'employee'>('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'present' | 'absent' | 'late'>('All');
  const [showFullHistory, setShowFullHistory] = useState(true);

  // For individual history view
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Map display labels to hook statuses
  const displayStatusMap: Record<string, string> = {
    present: 'Present',
    late: 'Late',
    absent: 'Absent'
  };

  const filteredData = records.filter(record => {
    const isToday = record.punchIn.startsWith(today);
    const dateMatch = showFullHistory || isToday;
    const nameMatch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role check logic:
    // Administrator/HR/Manager can see everyone usually, 
    // but the ledger is split by 'Management & HR' and 'Employees' tabs.
    const isEmployeeTab = activeTab === 'employee';
    const roleStr = (record.role || 'employee').toLowerCase();
    const roleMatch = isEmployeeTab 
      ? roleStr === 'employee' 
      : ['hr', 'admin', 'super_admin', 'administrator', 'manager'].includes(roleStr);

    const statusMatch = statusFilter === 'All' || record.status === statusFilter;
    return nameMatch && roleMatch && statusMatch && dateMatch;
  });

  // Debug log for visibility
  if (records.length > 0) {
    console.log(`[AttendanceTable] Total records: ${records.length}, Filtered: ${filteredData.length} (Tab: ${activeTab})`);
  }

  const totalPresent = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const totalAbsent = records.filter(r => r.status === 'absent').length;
  const totalLate = records.filter(r => r.status === 'late').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present': return 'bg-success/15 text-success border border-success/20';
      case 'absent': return 'bg-destructive/15 text-destructive border border-destructive/20';
      case 'late': return 'bg-warning/15 text-warning border border-warning/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const safeDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Get records for a specific user
  const userHistory = selectedUserId
    ? records.filter(r => r.userId === selectedUserId).sort((a, b) => new Date(b.punchIn).getTime() - new Date(a.punchIn).getTime())
    : selectedUserEmail
        ? records.filter(r => r.userEmail === selectedUserEmail).sort((a, b) => new Date(b.punchIn).getTime() - new Date(a.punchIn).getTime())
        : [];

  const selectedUserNameLookup = users.find(u => 
    (selectedUserId && u.id === selectedUserId) || 
    (selectedUserEmail && u.email === selectedUserEmail)
  )?.name;
  const selectedUserName = selectedUserNameLookup || (userHistory.length > 0 ? userHistory[0].userName : "");

  return (
    <div className="space-y-6 mt-8 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/10 p-2 rounded-xl border border-border/30">
        <div className="flex p-1 bg-background rounded-lg border border-border w-full md:w-auto">
          {(['hr', 'employee'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
            >
              {tab === 'hr' ? 'Management & HR' : 'Employees'}
            </button>
          ))}
        </div>

        {activeTab === 'employee' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
            </div>
          </div>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide text-primary">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wide">ID</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Department</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Date</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Month</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Year</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Check In</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Check Out</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredData.length > 0 ? (
                filteredData.map((record) => {
                  const linkedUser = users.find(u => 
                    (record.userId && u.id === record.userId) || 
                    (record.employeeId && u.employeeId === record.employeeId) ||
                    (record.employeeId && u.customEmployeeId === record.employeeId) ||
                    (record.userEmail && u.email?.toLowerCase() === record.userEmail.toLowerCase())
                  );
                  
                  return (
                    <tr key={record.id} className={`hover:bg-secondary/10 transition-colors ${!record.punchOut ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">
                          {(linkedUser?.name && linkedUser.name !== "Unknown")
                              ? linkedUser.name
                              : (record.userName && record.userName !== "Unknown")
                                ? record.userName
                                : (record.userEmail || "Staff Member")
                          }
                          {!record.punchOut && <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mt-1">
                          {record.userEmail}
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      <span className="badge-pill bg-secondary text-muted-foreground text-[10px] font-mono">
                        {linkedUser?.customEmployeeId || record.employeeId || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{record.department || '—'}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                        {safeDate(record.punchIn)?.getDate()?.toString()?.padStart(2, '0') ?? '--'}
                    </td>
                    <td className="px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground/60">
                      {safeDate(record.punchIn)?.toLocaleString('default', { month: 'short' }) ?? '--'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground/60">
                      {safeDate(record.punchIn)?.getFullYear() ?? '--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-primary">{formatTime(record.punchIn)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{!record.punchOut ? '—' : formatTime(record.punchOut)}</td>
                    <td className="px-6 py-4">
                      {!record.punchOut ? (
                        <span className="badge-pill bg-primary/20 border border-primary/30 text-primary text-[10px] animate-pulse">ON DUTY</span>
                      ) : (
                        <span className={`badge-pill text-[10px] tracking-wider font-bold shadow-sm ${getStatusStyle(record.status)}`}>
                          {displayStatusMap[record.status]?.toUpperCase() || record.status.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUserEmail(record.userEmail);
                          setSelectedUserId(record.userId || null);
                        }}
                        className="flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                      >
                        <Eye size={14} /> History
                      </button>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-muted-foreground italic">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual History Modal Overlay */}
      {(selectedUserEmail || selectedUserId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-4xl max-h-[80vh] rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            <div className="p-6 border-b border-border flex items-center justify-between gradient-primary text-white">
              <div>
                <h3 className="text-xl font-heading font-black tracking-tight">{selectedUserName}'s Attendance</h3>
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mt-1">Complete Personal History</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserEmail(null);
                  setSelectedUserId(null);
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-secondary/90 backdrop-blur-md text-muted-foreground z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold border-b border-border/50">Date</th>
                    <th className="px-6 py-4 font-bold border-b border-border/50 text-center">Month/Year</th>
                    <th className="px-6 py-4 font-bold border-b border-border/50 text-center">Check In</th>
                    <th className="px-6 py-4 font-bold border-b border-border/50 text-center">Check Out</th>
                    <th className="px-6 py-4 font-bold border-b border-border/50 text-center">Duration</th>
                    <th className="px-6 py-4 font-bold border-b border-border/50 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {userHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">
                          {new Date(rec.punchIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                          {new Date(rec.punchIn).toLocaleDateString('en-IN', { weekday: 'long' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-muted-foreground uppercase text-xs tracking-wider">
                        {new Date(rec.punchIn).toLocaleString('default', { month: 'long' })} {new Date(rec.punchIn).getFullYear()}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-primary">
                        {formatTime(rec.punchIn)}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                        {formatTime(rec.punchOut)}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">
                        {Math.floor(rec.duration / 3600)}h {Math.floor((rec.duration % 3600) / 60)}m
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`badge-pill text-[10px] tracking-wider font-bold shadow-sm ${getStatusStyle(rec.status)}`}>
                          {displayStatusMap[rec.status]?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  setSelectedUserEmail(null);
                  setSelectedUserId(null);
                }}
                className="px-6 py-2 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:bg-secondary transition-all shadow-sm"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
