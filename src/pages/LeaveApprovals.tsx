import { toast } from "sonner";
import { Check, X, Clock, User, Calendar } from "lucide-react";

import { useLeave } from "@/hooks/useLeave";
import { LeaveSummaryTable } from "@/components/leave/LeaveSummaryTable";

const LeaveApprovals = () => {
    const { leaveRequests, updateLeaveStatus } = useLeave();
    const pendingRequests = leaveRequests.filter(req => req.status === "Pending");

    const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
        updateLeaveStatus(id, action);
        toast.success(`Request ${action === 'Approved' ? 'approved' : 'rejected'} successfully`);
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div>
                <h1 className="text-2xl font-heading font-bold">Leave Approvals</h1>
                <p className="text-muted-foreground text-sm">Review and manage employee leave requests</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {pendingRequests.map((req) => (
                    <div key={req.id} className="card-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-primary/30 transition-all border-l-4 border-l-warning">
                        <div className="flex items-center gap-4 min-w-[300px]">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                {req.avatar}
                            </div>
                            <div>
                                <h3 className="font-bold">{req.userName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="badge-pill bg-secondary text-muted-foreground">{req.dept}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} className="text-warning" /> Finalizing Approval
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">Type & Duration</p>
                                <p className="text-sm font-medium">{req.type} ({req.days} days)</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">Requested Dates</p>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar size={14} className="text-primary" /> {req.from} – {req.to}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">Employee Reason</p>
                                <p className="text-sm text-muted-foreground italic truncate max-w-[200px]" title={req.reason}>"{req.reason}"</p>
                            </div>
                        </div>

                        <div className="flex gap-3 min-w-[200px] justify-end">
                            <button
                                onClick={() => handleAction(req.id, 'Rejected')}
                                className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-lg shadow-destructive/10"
                                title="Reject Application"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={() => handleAction(req.id, 'Approved')}
                                className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all shadow-lg shadow-success/10"
                                title="Approve Application"
                            >
                                <Check size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {pendingRequests.length === 0 && (
                    <div className="card-surface p-12 text-center space-y-4 border-dashed border-2 border-border/50">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground/50">
                            <Clock size={32} />
                        </div>
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-muted-foreground">There are no pending leave requests to review at this time.</p>
                    </div>
                )}
            </div>

            <LeaveSummaryTable />
        </div>
    );
};

export default LeaveApprovals;
