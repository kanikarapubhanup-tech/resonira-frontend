import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type CalendarEvent = {
  id: string | number;
  title: string;
  time: string;
  type: string;
  date: string; // YYYY-MM-DD
};

const indianHolidays: Record<string, { title: string, type: string }> = {
  // Fixed Dates (always same MM-DD)
  "01-01": { title: "New Year's Day", type: "corporate" },
  "01-14": { title: "Makar Sankranti / Pongal", type: "festival" },
  "01-26": { title: "Republic Day", type: "national" },
  "05-01": { title: "Labour Day", type: "national" },
  "08-15": { title: "Independence Day", type: "national" },
  "10-02": { title: "Gandhi Jayanti", type: "national" },
  "12-25": { title: "Christmas Day", type: "festival" },
  
  // 2026 Variable Lunar Dates (YYYY-MM-DD)
  "2026-03-03": { title: "Holi", type: "festival" },
  "2026-03-20": { title: "Eid ul-Fitr", type: "festival" },
  "2026-04-03": { title: "Good Friday", type: "holiday" },
  "2026-08-28": { title: "Raksha Bandhan", type: "festival" },
  "2026-10-18": { title: "Dussehra", type: "festival" },
  "2026-11-08": { title: "Diwali", type: "festival" },
  
  // Example Corporate Mandatory Dates
  "03-15": { title: "Company Foundation Day", type: "corporate" },
};

export default function CalendarPage() {
  const { role } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysCount = daysInMonth(currentYear, currentMonth);
  const startDay = firstDayOfMonth(currentYear, currentMonth);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("calendar_events");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("calendar_events");
      if (saved) {
        setEvents(JSON.parse(saved));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    type: "meeting",
    time: "",
    description: "",
  });

  const getEventsForDay = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const targetDate = `${currentYear}-${monthStr}-${dayStr}`;
    const targetMonthDay = `${monthStr}-${dayStr}`;
    
    const staticEvents: CalendarEvent[] = [];
    
    // 1. Check fixed Indian holidays (MM-DD)
    if (indianHolidays[targetMonthDay]) {
      staticEvents.push({
        id: `fixed-${targetMonthDay}`,
        title: indianHolidays[targetMonthDay].title,
        time: 'All Day',
        type: indianHolidays[targetMonthDay].type,
        date: targetDate
      });
    }

    // 2. Check variable Indian holidays (YYYY-MM-DD)
    if (indianHolidays[targetDate]) {
      staticEvents.push({
        id: `var-${targetDate}`,
        title: indianHolidays[targetDate].title,
        time: 'All Day',
        type: indianHolidays[targetDate].type,
        date: targetDate
      });
    }

    // Combine static with dynamic state events matching this date
    const dynamicEvents = events.filter(e => e.date === targetDate);
    return [...staticEvents, ...dynamicEvents];
  };

  const handleSaveEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;

    if (newEvent.type === "holiday" && events.some(e => e.date === newEvent.date && e.type === "holiday")) {
      toast.error("A holiday already exists on this date.");
      return;
    }

    const eventToAdd: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      time: newEvent.type === "holiday" ? "All Day" : newEvent.time,
      type: newEvent.type,
      date: newEvent.date,
    };

    const updatedEvents = [...events, eventToAdd];
    setEvents(updatedEvents);
    localStorage.setItem("calendar_events", JSON.stringify(updatedEvents));
    
    // Dispatch custom event to sync within the same tab if needed (though state update handles it here)
    window.dispatchEvent(new Event("storage"));
    
    toast.success("Event created successfully!");
    setIsModalOpen(false);
    setNewEvent({ title: "", date: "", type: "meeting", time: "", description: "" });
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-primary/20 text-primary border-primary/30';
      case 'deadline': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'event': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 border';
      case 'holiday': return 'bg-success/20 text-success border-success/30 border';
      case 'national': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 border';
      case 'festival': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 border';
      case 'corporate': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 border';
      default: return 'bg-secondary text-foreground border-border border';
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <CalendarIcon className="text-primary" /> Calendar
          </h1>
          <p className="text-muted-foreground text-sm">Manage your meetings, events, and important dates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
            Today
          </button>
          {(role === "administrator" || role === "hr") && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:opacity-90 transition-all">
              + New Event
            </button>
          )}
        </div>
      </div>

      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-heading font-bold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="text-sm font-medium text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-primary font-semibold">Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-border"></span>
              <span className="opacity-80">Saka Calendar: {new Intl.DateTimeFormat('en-IN', { calendar: 'indian', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date())}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-background transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-background transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="bg-card p-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Empty Cells before Start Day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-card/50 min-h-[120px] p-2" />
          ))}

          {/* Days */}
          {Array.from({ length: daysCount }).map((_, i) => {
            const day = i + 1;
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
            const events = getEventsForDay(day);

            return (
              <div 
                key={day} 
                className={`bg-card min-h-[120px] p-2 transition-colors hover:bg-secondary/20 relative ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'text-foreground'}`}>
                  {day}
                </div>
                
                <div className="space-y-1.5 mt-1 relative z-10">
                  {events.map(event => (
                    <div 
                      key={event.id}
                      className={`text-[10px] font-medium px-2 py-1 rounded border leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity ${getTypeStyle(event.type)}`}
                      title={`${event.title} - ${event.time}`}
                    >
                      {event.time !== 'All Day' && <span className="mr-1 opacity-70">{event.time}</span>}
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Empty Cells after End Day to fill grid */}
          {Array.from({ length: 42 - (startDay + daysCount) }).map((_, i) => (
            <div key={`empty-end-${i}`} className="bg-card/50 min-h-[120px] p-2" />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border overflow-hidden animate-fade-up shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h2 className="font-heading font-bold text-lg">Create New Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Event Title <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  placeholder="E.g., Team Sync, Diwali Holiday"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Date <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground [color-scheme:dark]"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="event">Event</option>
                    <option value="deadline">Deadline</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
              </div>

              {newEvent.type !== 'holiday' && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="text-sm font-medium text-foreground">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground [color-scheme:dark]"
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground min-h-[80px] resize-y"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-secondary/10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!newEvent.title.trim() || !newEvent.date}
                onClick={handleSaveEvent}
                className="px-5 py-2.5 rounded-xl text-sm font-bold gradient-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
