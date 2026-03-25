import { useState } from "react";
import { Plus, Zap, Settings, Video, Copy, X, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useMeeting } from "@/hooks/useMeeting";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";

const recordings: { title: string; date: string; duration: string }[] = [];

const calDays = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  meetings: Math.random() > 0.6 ? Math.ceil(Math.random() * 3) : 0,
  today: i + 1 === new Date().getDate(),
}));

const typeColors: Record<string, string> = { Recurring: "bg-primary/15 text-primary", "One-time": "bg-accent/15 text-accent", External: "bg-warning/15 text-warning" };

export default function Meetings() {
  const { meetings, addMeeting, updateMeeting } = useMeeting();
  const { users } = useUserManagement();
  const { user, role } = useAuth();

  const [showSchedule, setShowSchedule] = useState(false);
  const [showInstant, setShowInstant] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [durationMatch, setDurationMatch] = useState(30); // in minutes
  const [newTargetRole, setNewTargetRole] = useState("All");

  const employees = users.filter(u => u.role !== 'Admin');

  const filteredMeetings = meetings.filter(m => {
    if (role === "administrator") return true;
    const target = m.targetRole || "All";
    if (target === "All") return true;

    const myRoleLabel = role === "hr" ? "HR" : role === "manager" ? "Manager" : "Employee";
    const nameMatch = target.startsWith("Employee: ") && target.includes(user?.name || "");

    return target === myRoleLabel || nameMatch;
  });

  const handleSchedule = async () => {
    if (!newTitle || !newDate || !newTime) {
      toast.error("Please fill all fields");
      return;
    }

    // 1. Calculate proper ISO dates for backend
    // Combine YYYY-MM-DD and HH:mm into a valid Date object
    const startDateTimeStr = `${newDate}T${newTime}:00`;
    const startDate = new Date(startDateTimeStr);
    
    // Check if date is valid
    if (isNaN(startDate.getTime())) {
      toast.error("Invalid date or time");
      return;
    }

    // Add duration in minutes to start date to get end date
    const endDate = new Date(startDate.getTime() + durationMatch * 60000);

    const startTimeISO = startDate.toISOString();
    const endTimeISO = endDate.toISOString();

    // Still calc display time for UI fallback/optimistic updates
    const [h, m] = newTime.split(':');
    const hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayTime = `${(hours % 12 || 12).toString().padStart(2, '0')}:${m} ${ampm}`;

    const targetDesc = newTargetRole === "Employee" && selectedEmployees.length > 0 
      ? `Employee: ${selectedEmployees.map(e => e.name).join(", ")}` 
      : newTargetRole;

    // Backend participant requirements
    const participantIds = newTargetRole === "Employee" 
        ? selectedEmployees.map(e => e.id) 
        // If 'All', conceptually should send all employee IDs. For now, sending dummy if Empty because Joi needs min(1) integer
        : employees.map(e => e.id).slice(0, 10); 

    if (participantIds.length === 0) {
        toast.error("At least one participant is required");
        return;
    }

    const meetingLink = `https://meet.resonira.dev/rsn-${Math.random().toString(36).substring(2, 7)}`;

    setLoading(true);
    try {
      if (editingId) {
        await updateMeeting(editingId, {
          title: newTitle,
          date: newDate,
          time: displayTime,
          start_time: startTimeISO,
          end_time: endTimeISO,
          targetRole: targetDesc,
          participants: participantIds,
        } as any);
        toast.success("Meeting updated");
      } else {
        await addMeeting({
          title: newTitle,
          date: newDate,
          time: displayTime,
          start_time: startTimeISO,
          end_time: endTimeISO,
          participants: participantIds,
          meeting_link: meetingLink,
          attendees: participantIds.length,
          type: "team",
          duration: durationMatch,
          targetRole: targetDesc,
        } as any);
        toast.success("Meeting scheduled");
      }

      setShowSchedule(false);
      setEditingId(null);
      setNewTitle("");
      setNewDate("");
      setNewTime("");
      setNewTargetRole("All");
      setSelectedEmployees([]);
    } catch (error: any) {
      console.error("Failed to schedule/update meeting", error);
      toast.error(error.response?.data?.message || "Failed to save meeting on the server");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (m: any) => {
    setNewTitle(m.title);
    setNewDate(m.date);
    const [time, ampm] = m.time.split(" ");
    let [h, min] = time.split(":");
    let hours = parseInt(h);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    setNewTime(`${hours.toString().padStart(2, "0")}:${min}`);
    
    if (m.targetRole?.startsWith("Employee: ")) {
      setNewTargetRole("Employee");
      // Not perfect reconstruction of IDs from names, but avoids crashing
      const names = m.targetRole.replace("Employee: ", "").split(", ");
      const matched = employees.filter(e => names.includes(e.name)).map(e => ({id: e.id, name: e.name}));
      setSelectedEmployees(matched);
    } else {
      setNewTargetRole(m.targetRole || "All");
      setSelectedEmployees([]);
    }
    setEditingId(m.id);
    setShowSchedule(true);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Meetings & Calendar</h1>
        <div className="flex gap-3">
          <button onClick={() => { setShowInstant(true); }} className="border border-border px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-secondary transition-colors">
            <Zap size={16} className="text-warning" /> Instant Meeting
          </button>
          <button onClick={() => setShowSchedule(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Schedule
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meeting List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMeetings.map(m => (
            <div key={m.id} className="card-surface p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
              <div className="text-center bg-primary/10 rounded-xl px-3 py-2 min-w-[70px]">
                <div className="text-sm font-mono font-bold text-primary">{m.time.split(" ")[0]}</div>
                <div className="text-[10px] text-primary/70">{m.time.split(" ")[1]}</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{m.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="text-[11px] text-muted-foreground">{m.attendees} attendees · {m.duration}</div>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div className="text-[10px] font-bold text-primary uppercase tracking-tighter italic">{m.targetRole || "All Participants"}</div>
                </div>
              </div>
              <span className={`badge-pill ${typeColors[m.type]} text-[10px]`}>{m.type}</span>
              <button 
                onClick={() => m.meeting_link ? window.open(m.meeting_link, '_blank') : toast.error("No link available")}
                className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                Join
              </button>
              <button
                onClick={() => startEdit(m)}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                title="Edit Meeting"
              >
                <Edit3 size={14} className="text-primary" />
              </button>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="card-surface p-12 text-center text-muted-foreground">
              No meetings scheduled.
            </div>
          )}
        </div>

        {/* Mini Calendar */}
        <div className="card-surface p-5">
          <h3 className="font-heading font-bold mb-3">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-muted-foreground py-1">{d}</div>
            ))}
            {calDays.map(d => (
              <div key={d.day} className={`py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${d.today ? "gradient-primary text-primary-foreground font-bold" : "hover:bg-secondary/50"}`}>
                {d.day}
                {d.meetings > 0 && !d.today && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(d.meetings, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recordings */}
      <div className="card-surface p-5 animate-fade-up-1">
        <h3 className="font-heading font-bold mb-4">Meeting Recordings</h3>
        <div className="space-y-3">
          {recordings.map((r, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <Video size={16} className="text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">{r.title}</div>
                <div className="text-[11px] text-muted-foreground">{r.date} · {r.duration}</div>
              </div>
              <button className="text-xs text-primary hover:underline">Play</button>
              <button className="text-xs text-muted-foreground hover:underline">Download</button>
            </div>
          ))}
          {recordings.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm italic">
              No meeting recordings available.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowSchedule(false)} />
          <div className="relative z-10 card-surface p-6 w-full max-w-lg animate-fade-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-heading font-bold text-lg">{editingId ? "Edit Meeting" : "Schedule Meeting"}</h2>
              <button onClick={() => { setShowSchedule(false); setEditingId(null); }}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Meeting Title"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:border-primary outline-none"
                />
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Duration</label>
                  <select
                    value={durationMatch}
                    onChange={e => setDurationMatch(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm focus:border-primary outline-none"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Scheduled For</label>
                <select
                  value={newTargetRole}
                  onChange={e => setNewTargetRole(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm focus:border-primary outline-none"
                >
                  <option>All</option>
                  <option>Manager</option>
                  <option>HR</option>
                  <option>Employee</option>
                </select>
              </div>

              {newTargetRole === "Employee" && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Select Employees</label>
                  <div className="bg-secondary border border-border rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                    {employees.map(e => (
                      <label key={e.email} className="flex items-center gap-3 p-2 hover:bg-primary/5 rounded-lg cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.some(emp => emp.id === e.id)}
                          onChange={() => {
                            setSelectedEmployees(prev => 
                              prev.some(emp => emp.id === e.id) 
                                ? prev.filter(emp => emp.id !== e.id)
                                : [...prev, { id: e.id, name: e.name }]
                            );
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium group-hover:text-primary transition-colors">{e.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{e.email}</div>
                        </div>
                      </label>
                    ))}
                    {employees.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground italic">No employees found</div>
                    )}
                  </div>
                  <div className="text-[10px] text-primary font-medium mt-1 ml-1">
                    {selectedEmployees.length} employee(s) selected
                  </div>
                </div>
              )}

              <textarea placeholder="Agenda..." rows={2} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm resize-none focus:border-primary outline-none" />
            </div>
            <button disabled={loading} onClick={handleSchedule} className="gradient-primary text-primary-foreground w-full mt-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity">
              {loading ? "Saving..." : editingId ? "Update Changes" : "Schedule Meeting"}
            </button>
          </div>
        </div>
      )}

      {/* Instant Meeting Modal */}
      {showInstant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setShowInstant(false)} />
          <div className="relative z-10 card-surface p-6 w-full max-w-sm animate-fade-up text-center">
            <Zap size={32} className="text-warning mx-auto mb-3" />
            <h2 className="font-heading font-bold text-lg mb-2">Instant Meeting Ready</h2>
            <div className="bg-secondary rounded-xl p-3 flex items-center gap-2 mb-4">
              <code className="flex-1 text-sm text-foreground truncate">meet.resonira.dev/rsn-42x8k</code>
              <button onClick={() => { navigator.clipboard.writeText("meet.resonira.dev/rsn-42x8k"); toast.success("Link copied"); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Copy size={14} className="text-primary" /></button>
            </div>
            <button onClick={() => setShowInstant(false)} className="gradient-primary text-primary-foreground w-full py-2.5 rounded-xl text-sm font-semibold">Join Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
