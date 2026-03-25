import { useState } from "react";
import { toast } from "sonner";
import { Palmtree, Calendar, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLeave } from "@/hooks/useLeave";


export default function HRLeaveManagement() {
  const { user } = useAuth();
  const { applyLeave, getUserRequests, leaveTypes: dynamicTypes } = useLeave();
  const [showForm, setShowForm] = useState(false);
  const userRequests = getUserRequests(user?.email || "");

  const [formData, setFormData] = useState({
    leaveTypeId: null as number | null,
    from: "",
    to: "",
    reason: "",
  });

  const statusColors: Record<string, string> = {
    Approved: "bg-success/15 text-success",
    Pending: "bg-warning/15 text-warning",
    Rejected: "bg-destructive/15 text-destructive",
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.from || !formData.to || !formData.reason) {
      toast.error("Please fill all fields");
      return;
    }

    const fromDate = new Date(formData.from);
    const toDate = new Date(formData.to);
    if (toDate < fromDate) {
      toast.error("End date must be after start date");
      return;
    }

    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setLoading(true);
    try {
      await applyLeave({
        type: "", // Not used by backend now
        leave_type_id: formData.leaveTypeId!,
        from: formData.from,
        to: formData.to,
        days: diffDays,
        reason: formData.reason,
      });

      setShowForm(false);
      toast.success("Leave request submitted successfully!");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Palmtree size={20} className="text-primary-foreground" />
            </div>
            Leave Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Apply for leave and track your requests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          {showForm ? (
            <><X size={16} /> Cancel</>
          ) : (
            <><Plus size={16} /> Request Leave</>
          )}
        </button>
      </div>

      {/* Leave Request Form */}
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
                {dynamicTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
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
              onClick={handleSubmit}
              className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      )}

      {/* Leave History */}
      {userRequests.length > 0 && (
        <div className="card-surface overflow-hidden animate-fade-up-2">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-bold flex items-center gap-2">
              <div className="w-2 h-6 bg-primary rounded-full" /> My Leave History
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="p-3">Type</th>
                <th className="p-3">From</th>
                <th className="p-3">To</th>
                <th className="p-3">Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {userRequests.map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 font-medium">{l.type}</td>
                  <td className="p-3 text-muted-foreground">{l.from}</td>
                  <td className="p-3 text-muted-foreground">{l.to}</td>
                  <td className="p-3">{l.days}</td>
                  <td className="p-3 text-muted-foreground">{l.reason}</td>
                  <td className="p-3">
                    <span className={`badge-pill ${statusColors[l.status]}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!showForm && userRequests.length === 0 && (
        <div className="card-surface p-16 text-center space-y-4 border-dashed border-2 border-border/50">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Palmtree size={36} className="text-primary" />
          </div>
          <h3 className="text-lg font-heading font-bold">No Leave Requests Yet</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Click the "Request Leave" button above to submit a new leave application.
          </p>
        </div>
      )}
    </div>
  );
}
