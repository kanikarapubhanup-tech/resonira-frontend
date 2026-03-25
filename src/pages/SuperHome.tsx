import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCircle, FolderLock, ArrowRight, Zap, Globe, Lock, Mail, User, Settings, Key } from "lucide-react";
import { useAuth, Role } from "@/hooks/useAuth";
import { toast } from "sonner";
import api from "@/lib/api";

const SuperHome = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<{ id: Role; title: string } | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [name, setName] = useState(""); // For dummy first-time login or registration display

  const portals = [
    {
      id: "hr" as Role,
      title: "HR Portal",
      description: "Comprehensive workforce management, payroll automation, and strategic recruitment pipeline.",
      icon: <ShieldCheck className="w-12 h-12 text-primary" />,
      color: "from-blue-600/20 to-indigo-600/20 shadow-blue-500/10",
      path: "/dashboard",
      tag: "Admin Access",
      features: ["Employee Lifecycle", "Payroll Analytics", "Compliance"],
    },
    {
      id: "employee" as Role,
      title: "Employee Portal",
      description: "Self-service dashboard for task tracking, attendance logs, leave requests, and performance.",
      icon: <UserCircle className="w-12 h-12 text-accent" />,
      color: "from-purple-600/20 to-pink-600/20 shadow-purple-500/10",
      path: "/dashboard",
      tag: "Personal Workspace",
      features: ["Task Board", "Leave Management", "Team Chat"],
    },
    {
      id: "manager" as Role,
      title: "Manager Portal",
      description: "Strategic team oversight, task delegation, and performance monitoring dashboards.",
      icon: <FolderLock className="w-12 h-12 text-emerald-500" />,
      color: "from-emerald-600/20 to-teal-600/20 shadow-emerald-500/10",
      path: "/dashboard",
      tag: "Team Management",
      features: ["Team Oversight", "Task Delegation", "Performance Hub"],
    },
    {
      id: "administrator" as Role,
      title: "System Admin",
      description: "Global system configuration, security protocols, user root access, and infrastructure logs.",
      icon: <Settings className="w-12 h-12 text-orange-500" />,
      color: "from-orange-600/20 to-red-600/20 shadow-orange-500/10",
      path: "/dashboard",
      tag: "Root Access",
      features: ["System Config", "Security Audit", "Billing & Usage"],
    },
  ];

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handlePortalSelect = (portal: { id: Role; title: string; path: string }) => {
    setSelectedPortal({ id: portal.id, title: portal.title });
    setFormData({ email: "", password: "" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortal) return;

    try {
      // Make real API call to your backend
      // Note: Adjust the endpoint (/auth/login) if your backend uses a different route!
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const token = response.data?.data?.token || response.data?.token;
      const user = response.data?.data?.user || response.data?.user;

      if (!token || !user) {
        toast.error("Invalid response from server.");
        return;
      }

      // Check if role matches the portal selected
      const roleMap: Record<string, string> = {
        "super_admin": "administrator",
        "admin": "administrator",
        "Admin": "administrator",
        "Manager": "manager",
        "manager": "manager",
        "HR": "hr",
        "hr": "hr",
        "Employee": "employee",
        "employee": "employee"
      };

      const userRole = user.role || "employee";
      const normalizedRole = roleMap[userRole] || "employee";
      
      // Authorization Logic:
      // 1. If user is an Admin/Super Admin, they can access ANY portal.
      // 2. Otherwise, the normalized role must match the selected portal ID.
      const isAdmin = normalizedRole === "administrator";
      const isAuthorized = isAdmin || normalizedRole === selectedPortal.id;

      if (!isAuthorized) {
        toast.error(`Unauthorized access. Your account role is "${userRole}", but you are trying to access the "${selectedPortal.title}".`);
        return;
      }

      // Store auth token for future requests
      localStorage.setItem('authToken', token);

      login(selectedPortal.id, {
        _id: String(user._id || user.id || ""),
        name: user.name || user.fullName || user.full_name || user.username || "Guest",
        email: user.email,
        department: user.department || "General",
        role: selectedPortal.id,
        employeeId: user.employee_id || user.employeeId || (user.employee?.employee_id) || ""
      });
      navigate(portals.find(p => p.id === selectedPortal.id)?.path || "/dashboard");
      toast.success(`Welcome back, ${user.name}!`);

    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid email or password. Please try again.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred while connecting to the server.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center py-20 px-6 font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="z-10 w-full max-w-7xl">
        <header className="text-center mb-24 space-y-6 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border/50 shadow-sm text-primary text-sm font-medium mb-4 backdrop-blur-md">
            <Zap size={14} className="fill-primary" />
            <span>Resonira Connect v2.5 Enterprise</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent leading-none">
            Unified Enterprise <br /> <span className="text-primary italic">Workspace</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Experience the future of work with Resonira. Select your specialized portal below to access your professional tools and collaborate across the organization.
          </p>
        </header>

        {!selectedPortal ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {portals.map((portal, index) => (
              <div
                key={portal.id}
                onClick={() => handlePortalSelect(portal)}
                className={`group relative flex flex-col card-surface hover:bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 cursor-pointer hover:border-primary/50 transition-all duration-700 hover:translate-y-[-12px] shadow-xl hover:shadow-2xl animate-fade-up-${index + 1}`}
              >
                {/* Highlight Overlay */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${portal.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10`} />

                <div className="flex justify-between items-start mb-10">
                  <div className="p-5 rounded-2xl bg-secondary/80 border border-border shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {portal.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground group-hover:text-primary transition-colors">
                    {portal.tag}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-3xl font-bold group-hover:text-primary transition-colors tracking-tight">
                    {portal.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed group-hover:text-foreground transition-colors">
                    {portal.description}
                  </p>

                  <div className="pt-6 space-y-3">
                    {portal.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                  <div className="flex items-center text-base font-bold text-foreground opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                    Access Portal <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors duration-500">
                    <Lock size={18} className="text-muted-foreground group-hover:text-primary-foreground" />
                  </div>
                </div>

                {/* Glowing cursor effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 bg-primary blur-[40px] transition-opacity duration-700 pointer-events-none -z-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto animate-fade-up">
            <div className="card-surface p-8 bg-card backdrop-blur-2xl border-border relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 gradient-primary shadow-[0_0_20px_hsl(217_91%_60%)]" />

              <button
                onClick={() => setSelectedPortal(null)}
                className="mb-8 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <ArrowRight className="rotate-180 w-4 h-4" /> Back to Selection
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-4">
                  {portals.find(p => p.id === selectedPortal.id)?.icon}
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{selectedPortal.title} Login</h2>
                <p className="text-muted-foreground text-sm mt-2">Enter credentials to authenticate access.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-background border border-border text-foreground rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="password"
                      placeholder="Security Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background border border-border text-foreground rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>



                <button
                  type="submit"
                  className="w-full gradient-primary py-4 rounded-2xl font-bold text-white shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  Authenticate & Enter
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-32 flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-border border-dashed">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">4.8k+</span>
              <span className="text-sm text-muted-foreground">Managed Identities</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">99.9%</span>
              <span className="text-sm text-muted-foreground">System Uptime</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">End-to-End</span>
              <span className="text-sm text-muted-foreground">AES-256 Security</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Globe size={18} />
            <span className="text-sm">Global Enterprise Network</span>
          </div>
        </div>

        <footer className="mt-20 text-center">
          <p className="text-muted-foreground/70 text-sm font-medium">&copy; 2026 Resonira Technologies. Enterprise Work Platform</p>
        </footer>
      </div>
    </div>
  );
};

export default SuperHome;
