import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  Approved: "bg-success/15 text-success",
  Pending: "bg-warning/15 text-warning",
  Rejected: "bg-destructive/15 text-destructive",
};

import { useAuth } from "@/hooks/useAuth";
import { useLeave, LeaveRequest } from "@/hooks/useLeave";

export default function Leave() {
  const { user, role } = useAuth();
  const { applyLeave, getUserRequests, getLeaveStats, leaveTypes: dynamicTypes } = useLeave();
  const [showForm, setShowForm] = useState(false);
  const userRequests = getUserRequests(user?.email || "");
  const stats = getLeaveStats(user?.email || "");

  const displayTypes = Object.entries(stats).map(([type, data]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    total: data.max,
    used: data.used,
    color: data.color || "bg-primary"
  }));

  const [formData, setFormData] = useState({
    leaveTypeId: null as number | null,
    from: "",
    to: "",
    reason: ""
  });

  const [loading, setLoading] = useState(false);

  const handleLeaveSubmit = async () => {
    if (!formData.from || !formData.to || !formData.reason) {
      toast.error("Please fill all fields");
      return;
    }

    const fromDate = new Date(formData.from);
    const toDate = new Date(formData.to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setLoading(true);
    try {
      console.log('[Leave] Selected leaveTypeId:', formData.leaveTypeId);
      await applyLeave({
        type: "", // Not used by backend now, but kept for interface compatibility if needed
        leave_type_id: formData.leaveTypeId!,
        from: formData.from,
        to: formData.to,
        days: diffDays,
        reason: formData.reason
      });

      setShowForm(false);
      toast.success("Leave request submitted successfully");
      setFormData({ leaveTypeId: dynamicTypes[0]?.id || null, from: "", to: "", reason: "" });
    } catch (error: any) {
      console.error("Failed to submit leave request:", error);
      toast.error(error.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Leave Management</h1>
        {role !== 'administrator' && (
          <button onClick={() => setShowForm(!showForm)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-all">
            {showForm ? "Cancel Request" : "Request Leave"}
          </button>
        )}
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {displayTypes.map(l => (
          <div key={l.type} className="card-surface p-4">
            <div className="text-xs text-muted-foreground mb-1">{l.type} Leave</div>
            <div className="text-2xl font-heading font-bold">{l.total - l.used}<span className="text-sm text-muted-foreground font-normal">/{l.total}</span></div>
            <div className="w-full h-1.5 rounded-full bg-secondary mt-2">
              <div className={`h-full rounded-full ${l.color}`} style={{ width: l.total ? `${(l.used / l.total) * 100}%` : "0%" }} />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{l.used} used</div>
          </div>
        ))}
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="card-surface p-6 animate-fade-up border-primary/20">
          <h3 className="font-heading font-bold mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" /> New Leave Application
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Leave Type</label>
              <select
                value={formData.leaveTypeId || ""}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: Number(e.target.value) })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="" disabled>Select Leave Type</option>
                {dynamicTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">From Date</label>
              <input
                type="date"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">To Date</label>
              <input
                type="date"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Reason for Leave</label>
              <textarea
                placeholder="Provide a brief explanation for your absence..."
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              disabled={loading}
              onClick={handleLeaveSubmit}
              className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}


      {/* Leave History */}
      <div className="card-surface overflow-hidden animate-fade-up-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="p-3">Type</th><th className="p-3">From</th><th className="p-3">To</th>
              <th className="p-3">Days</th><th className="p-3">Reason</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {userRequests.map(l => (
              <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{l.type}</td>
                <td className="p-3 text-muted-foreground">{l.from}</td>
                <td className="p-3 text-muted-foreground">{l.to}</td>
                <td className="p-3">{l.days}</td>
                <td className="p-3 text-muted-foreground">{l.reason}</td>
                <td className="p-3"><span className={`badge-pill ${statusColors[l.status]}`}>{l.status}</span></td>
              </tr>
            ))}
            {userRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground italic">No leave applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
