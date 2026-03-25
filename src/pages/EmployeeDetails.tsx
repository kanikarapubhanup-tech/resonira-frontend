import { useParams, useNavigate } from "react-router-dom";
import { 
    User, Briefcase, Calendar, Mail, Phone, 
    MapPin, Clock, Award, FileText, ChevronLeft 
} from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users } = useUserManagement();

    const employee = users.find(u => u.id === id);

    if (!employee) {
        return (
            <div className="card-surface p-12 text-center space-y-4">
                <p className="text-xl font-bold">Employee Not Found</p>
                <button onClick={() => navigate("/employees")} className="text-primary hover:underline font-bold">Return to List</button>
            </div>
        );
    }
    
    const avatar = employee.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const roleStr = employee.employeeRole || employee.role;

    return (
        <div className="space-y-6 animate-fade-up">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft size={16} /> Back to Employee List
            </button>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Core Profile */}
                <div className="lg:w-1/3 space-y-6">
                    <div className="card-surface p-8 text-center bg-gradient-to-b from-primary/5 to-transparent">
                        <div className="w-40 h-40 rounded-3xl bg-primary/20 flex items-center justify-center text-primary text-5xl font-heading font-black mx-auto mb-6 shadow-2xl">
                            {avatar}
                        </div>
                        <h2 className="text-2xl font-bold">{employee.name}</h2>
                        <p className="text-primary font-medium">{roleStr}</p>
                        <div className="mt-6 flex flex-col gap-2">
                            <span className={`badge-pill ${employee.status === 'Active' ? 'bg-success' : 'bg-destructive'} px-4 py-2 text-white mx-auto`}>
                                {employee.status} Employee
                            </span>
                        </div>
                    </div>

                    <div className="card-surface p-6 space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Key Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Projects</p>
                                <p className="text-xl font-bold">24</p>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/50">
                                <p className="text-xs text-muted-foreground">Rating</p>
                                <p className="text-xl font-bold">4.9</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:w-2/3 space-y-6">
                    <div className="card-surface p-8">
                        <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                            <User size={20} className="text-primary" /> Personal & Professional Profile
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {[
                                { label: "Email Address", value: employee.email, icon: Mail },
                                { label: "Phone Number", value: "+91 98765 43210", icon: Phone },
                                { label: "Department", value: employee.department || "General", icon: Briefcase },
                                { label: "Location", value: "HQ", icon: MapPin },
                                { label: "Employee ID", value: employee.id, icon: Clock },
                                { label: "Date of Joining", value: new Date(employee.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }), icon: Calendar },
                                { label: "Designation", value: roleStr, icon: Award },
                                { label: "Reporting To", value: "Administrator", icon: User },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 text-primary/50"><item.icon size={18} /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-1">{item.label}</p>
                                        <p className="text-sm font-semibold">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card-surface p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">Recent Documents</h3>
                                <button className="text-xs text-primary font-bold">View All</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { name: "Employment_Contract.pdf", size: "2.4 MB" },
                                    { name: "Q4_Performance_Review.pdf", size: "1.1 MB" },
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                                        <FileText size={18} className="text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{doc.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card-surface p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold">Performance Track</h3>
                                <span className="text-xs text-success font-bold">+12% growth</span>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: '85%' }} />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Priya has consistently exceeded design delivery targets and led the transition to the new Resonira Design System v2.0.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetails;
