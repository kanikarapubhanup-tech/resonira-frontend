import { useState, useEffect } from "react";
import { Clock, Coffee, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAttendance, AttendanceRecord } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";

// ── Real-Time Clock Component ────────────────────────────────────
const RealTimeClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="mb-6 flex flex-col items-center justify-center animate-fade-in">
      <div
        className="text-4xl md:text-5xl font-mono font-bold text-primary mb-1 tracking-wider"
        style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}
      >
        {timeString}
      </div>
      <div className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-widest">
        {dateString}
      </div>
    </div>
  );
};

// ── Check-In Time Validation ─────────────────────────────────────
const OFFICE_START = 10 * 60;       // 10:00 AM in minutes
const GRACE_PERIOD = 10 * 60 + 15;  // 10:15 AM — after this it's "Late"
const CHECKIN_CLOSE = 18 * 60;      // 6:00 PM — no more check-ins after this

const holidays = ["2026-01-26", "2026-08-15", "2026-10-02"];

interface TimeEligibility {
  allowed: boolean;
  reason: string;
  status: "On Time" | "Late" | null;
  lateMinutes: number;
}

const getTimeEligibility = (date: Date): TimeEligibility => {
  const result: TimeEligibility = { allowed: false, reason: "", status: null, lateMinutes: 0 };

  const day = date.getDay();
  if (day === 0) { result.reason = "Sunday — office closed"; return result; }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (holidays.includes(`${y}-${m}-${d}`)) { result.reason = "Public holiday"; return result; }

  const totalMinutes = date.getHours() * 60 + date.getMinutes();

  if (totalMinutes < OFFICE_START) {
    result.reason = "Check-in not allowed before 10:00 AM";
    return result;
  }
  if (totalMinutes > CHECKIN_CLOSE) {
    result.reason = "Check-in closed after 6:00 PM";
    return result;
  }

  result.allowed = true;
  if (totalMinutes <= GRACE_PERIOD) {
    result.status = "On Time";
  } else {
    result.status = "Late";
    result.lateMinutes = totalMinutes - OFFICE_START;
  }

  return result;
};

// ── Safe date helpers ────────────────────────────────────────────
const safeTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "00:00:00";
  return `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
};

// ── Main Attendance Page ─────────────────────────────────────────
export default function Attendance() {
  const { records, isPunchedIn, todayStatus, todayRecord, punchIn, punchOut, getDuration } = useAttendance();
  const { role, user } = useAuth();
  const [onBreak, setOnBreak] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [localTime, setLocalTime] = useState(new Date());

  // ── Stats Calculation ──────────────────────────────────────────
  const userRecords = records.filter((r: AttendanceRecord) => r.userEmail === user?.email);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRecords = userRecords.filter((r: AttendanceRecord) => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const presentDays = monthRecords.filter((r: AttendanceRecord) => r.status === "present" || r.status === "late").length;
  const lateLogins = monthRecords.filter((r: AttendanceRecord) => r.status === "late").length;

  const today = new Date().getDate();
  let workingDaysSoFar = 0;
  for (let i = 1; i <= today; i++) {
    const d = new Date(currentYear, currentMonth, i);
    if (d.getDay() !== 0) workingDaysSoFar++;
  }
  const absentDays = Math.max(0, workingDaysSoFar - presentDays);

  const stats = [
    { label: "Present Days", value: presentDays.toString(), color: "text-success", bg: "bg-success/15", pct: workingDaysSoFar > 0 ? (presentDays / workingDaysSoFar) * 100 : 0 },
    { label: "Absent Days", value: absentDays.toString(), color: "text-destructive", bg: "bg-destructive/15", pct: workingDaysSoFar > 0 ? (absentDays / workingDaysSoFar) * 100 : 0 },
    { label: "Late Logins", value: lateLogins.toString(), color: "text-warning", bg: "bg-warning/15", pct: workingDaysSoFar > 0 ? (lateLogins / workingDaysSoFar) * 100 : 0 },
  ];

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isPunchedIn) setSeconds(getDuration());
  }, [isPunchedIn, getDuration]);

  useEffect(() => {
    if (!isPunchedIn || onBreak) return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [isPunchedIn, onBreak]);

  // ── Live clock for eligibility ─────────────────────────────────
  useEffect(() => {
    const timerId = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const eligibility = getTimeEligibility(localTime);

  // ── Button State Logic ─────────────────────────────────────────
  // State machine: not_checked_in -> checked_in -> checked_out
  const canCheckIn = todayStatus === "not_checked_in" && eligibility.allowed;
  const canCheckOut = todayStatus === "checked_in";
  const isCompleted = todayStatus === "checked_out";

  // ── Status Message ─────────────────────────────────────────────
  const getStatusMessage = (): { text: string; color: string; icon?: typeof AlertCircle } | null => {
    if (isCompleted) return { text: "You have completed today's attendance", color: "text-success", icon: CheckCircle };
    if (todayStatus === "checked_in") return null; // Timer is showing instead
    // Not yet checked in
    if (!eligibility.allowed) return { text: eligibility.reason, color: "text-destructive", icon: AlertCircle };
    if (eligibility.status === "On Time") return { text: "✓ On Time — you may check in", color: "text-success" };
    if (eligibility.status === "Late") return { text: `⚠ Late by ${eligibility.lateMinutes} minutes`, color: "text-warning" };
    return null;
  };

  const statusMsg = getStatusMessage();

  // ── Handle Check-In / Check-Out ────────────────────────────────
  const handlePunchToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (todayStatus === "checked_in") {
        // CHECK OUT
        await punchOut();
        setSeconds(0);
        setOnBreak(false);
        toast.success("Checked Out — your attendance has been recorded!");
      } else if (todayStatus === "not_checked_in") {
        // CHECK IN
        if (!eligibility.allowed) {
          toast.error(eligibility.reason);
          return;
        }
        await punchIn();
        setSeconds(0);
        if (eligibility.status === "Late") {
          toast.warning(`Checked In Late (${eligibility.lateMinutes} mins after 10 AM)`);
        } else {
          toast.success("Checked In — you're On Time!");
        }
      } else {
        // Already completed
        toast.info("You have already completed today's attendance.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update attendance";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Button Label ───────────────────────────────────────────────
  const getButtonLabel = () => {
    if (loading) return "Processing...";
    if (isCompleted) return "Completed for Today";
    if (todayStatus === "checked_in") return "Check Out";
    return "Check In";
  };

  // ── Button Style ───────────────────────────────────────────────
  const getButtonStyle = () => {
    if (isCompleted || (!canCheckIn && !canCheckOut)) {
      return "bg-muted text-muted-foreground cursor-not-allowed opacity-70";
    }
    if (todayStatus === "checked_in") {
      return "gradient-danger text-destructive-foreground hover:-translate-y-0.5";
    }
    return "gradient-primary text-primary-foreground hover:-translate-y-0.5";
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold">Attendance & Time Tracking</h1>

      {/* Personal Punch Card & Stats — for Employees and HR */}
      {(role === "employee" || role === "hr") && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-up">
          {/* ── Clock + Action Buttons ── */}
          <div className={`card-surface p-6 flex flex-col items-center justify-center transition-all min-h-[250px] ${isPunchedIn ? "glow-green border-success/30" : ""}`}>
            <RealTimeClock />

            <div className="flex gap-3 justify-center w-full max-w-[280px]">
              <button
                onClick={handlePunchToggle}
                disabled={loading || isCompleted || (!canCheckIn && !canCheckOut)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${getButtonStyle()}`}
              >
                {getButtonLabel()}
              </button>

              {/* Break button — only show when checked in */}
              {isPunchedIn && !isCompleted && (
                <button
                  onClick={() => { setOnBreak(!onBreak); toast.info(onBreak ? "Break ended" : "Break started"); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-border hover:bg-secondary transition-colors shadow-sm"
                >
                  {onBreak ? "End Break" : "Start Break"}
                </button>
              )}
            </div>

            {/* ── Status Messages ── */}
            {statusMsg && (
              <div className={`mt-3 text-sm font-medium text-center ${statusMsg.color}`}>
                {statusMsg.icon && <statusMsg.icon size={14} className="inline mr-1 -mt-0.5" />}
                {statusMsg.text}
              </div>
            )}

            {/* ── Active Session Timer ── */}
            {isPunchedIn && todayRecord?.punchIn && (
              <div className="mt-2 flex flex-col items-center gap-1 animate-fade-up">
                <div className="font-mono text-lg font-bold text-success flex items-center gap-2" style={{ textShadow: "0 0 10px hsl(var(--success) / 0.4)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  {fmt(seconds)}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Punched in at {safeTime(todayRecord.punchIn)}
                </p>
              </div>
            )}

            {/* ── Completed State ── */}
            {isCompleted && (
              <div className="mt-4 flex flex-col items-center gap-2 animate-fade-up">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success mb-2">
                  <CheckCircle size={24} />
                </div>
                <p className="text-sm font-bold text-success">Shift Completed</p>
                <p className="text-xs text-muted-foreground">See you tomorrow!</p>
              </div>
            )}

            {/* Spacer when neither active nor completed */}
            {!isPunchedIn && !isCompleted && !statusMsg && (
              <div className="h-[44px]"></div>
            )}
          </div>

          {/* ── Today's Log ── */}
          <div className="card-surface p-5">
            <h3 className="font-heading font-bold mb-4">Today's Log</h3>
            <div className="space-y-3">
              {[
                { 
                  icon: Clock, 
                  label: "Check In", 
                  time: todayRecord?.punchIn ? safeTime(todayRecord.punchIn) : "--:--",
                  color: todayRecord?.punchIn ? "text-success" : "text-muted-foreground" 
                },
                { 
                  icon: Coffee, 
                  label: "Break", 
                  time: onBreak ? "On Break" : "--:--", 
                  color: onBreak ? "text-warning" : "text-muted-foreground" 
                },
                { 
                  icon: LogOut, 
                  label: "Check Out", 
                  time: todayRecord?.punchOut ? safeTime(todayRecord.punchOut) : "--:--",
                  color: todayRecord?.punchOut ? "text-destructive" : "text-muted-foreground" 
                },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <l.icon size={16} className={l.color} />
                  <span className="text-sm text-muted-foreground flex-1">{l.label}</span>
                  <span className={`font-mono text-sm ${l.color}`}>{l.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Monthly Stats ── */}
          <div className="space-y-3">
            {stats.map(s => (
              <div key={s.label} className="card-surface p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="w-full h-1.5 rounded-full bg-secondary mt-1">
                    <div className={`h-full rounded-full ${s.color === "text-success" ? "bg-success" : s.color === "text-destructive" ? "bg-destructive" : s.color === "text-warning" ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizational logs for HR, Manager, and Admin */}
      {(role === "administrator" || role === "hr" || role === "manager") && (
        <AttendanceTable />
      )}
    </div>
  );
}
