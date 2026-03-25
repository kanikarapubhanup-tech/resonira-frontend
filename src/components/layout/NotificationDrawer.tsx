import { useNotification, NotificationRecord } from "@/hooks/useNotification";
import { X, Clock, CheckCircle, Calendar, Palmtree, Megaphone, Bell } from "lucide-react";

const iconMap: Record<string, any> = {
  attendance: Clock,
  task: CheckCircle,
  meeting: Calendar,
  leave: Palmtree,
  system: Megaphone,
};

const colorMap: Record<string, string> = {
  attendance: "text-warning",
  task: "text-success",
  meeting: "text-primary",
  leave: "text-accent",
  system: "text-destructive",
};

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification();
  if (!open) return null;

  const today = notifications.filter(n => n.time === "Just now" || !n.time.includes("Yesterday"));
  const yesterday = notifications.filter(n => n.time.includes("Yesterday"));

  return (
    <>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-card border-l border-border z-50 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <span className="badge-pill bg-primary/15 text-primary text-[10px]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark All Read</button>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 opacity-60">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Bell size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">When you receive updates about tasks or leaves, they'll show up here.</p>
            </div>
          ) : (
            <>
              <NotifGroup label="Today" items={today} />
              <NotifGroup label="Yesterday" items={yesterday} />
              <div className="pt-4 flex justify-center">
                <button onClick={clearNotifications} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                  Clear all history
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function NotifGroup({ label, items }: { label: string; items: NotificationRecord[] }) {
  if (!items.length) return null;
  const { markAsRead } = useNotification();

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1">
        {items.map(n => {
          const Icon = iconMap[n.type] || Megaphone;
          return (
            <div key={n.id} onClick={() => markAsRead(n.id)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group">
              <Icon size={18} className={`mt-0.5 ${colorMap[n.type] || "text-primary"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm ${!n.read ? "font-bold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                </div>
                <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-glow" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
