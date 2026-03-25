import { User, Mail, Phone, MapPin, Briefcase, Calendar, ShieldCheck, X, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

const Profile = () => {
    const { user, role, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || "");
    const [editEmail, setEditEmail] = useState(user?.email || "");

    const handleSave = () => {
        if (!editName || !editEmail) return;
        updateProfile({ name: editName, email: editEmail });
        setIsEditing(false);
        toast.success("Profile updated successfully");
    };

    // Generate initials from name
    const initials = user?.name 
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
        : "U";

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-heading font-bold">My Profile</h1>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold hover:scale-105 transition-transform"
                >
                    Edit Profile
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-surface p-6 text-center border-t-4 border-primary">
                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-heading font-black mx-auto mb-4 border-4 border-background shadow-xl">
                            {initials}
                        </div>
                        <h2 className="text-xl font-bold">{user?.name}</h2>
                        <p className="text-muted-foreground text-sm font-medium capitalize">{role} Portal</p>
                        <div className="mt-4 flex justify-center gap-2">
                            <span className="badge-pill bg-success/15 text-success font-bold uppercase tracking-tight">Active</span>
                            <span className="badge-pill bg-primary/15 text-primary font-bold uppercase tracking-tight">{role === 'administrator' ? 'Management' : (user as any)?.department || 'Engineering'}</span>
                        </div>
                    </div>

                    <div className="card-surface p-6 space-y-4">
                        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary rounded-full"></span>
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm group cursor-pointer">
                                <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                                    <Mail size={16} className="text-primary" />
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm group cursor-pointer">
                                <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                                    <Phone size={16} className="text-primary" />
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">+91 99999 00000</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm group cursor-pointer">
                                <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                                    <MapPin size={16} className="text-primary" />
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">HQ - Enterprise Towers</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* Placeholder for future detailed modules, currently removed as requested */}
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden animate-scale-up">
                  <div className="p-6 border-b border-border flex items-center justify-between gradient-primary text-white">
                    <h3 className="text-lg font-bold">Edit Your Profile</h3>
                    <button onClick={() => setIsEditing(false)}><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex justify-center mb-6">
                       <div className="relative group cursor-pointer hover:opacity-80 transition-opacity">
                         <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-black border-4 border-background shadow-lg">
                           {initials}
                         </div>
                         <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full border-4 border-background">
                            <Camera size={12} />
                         </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:border-primary transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:border-primary transition-colors outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-secondary/30 border-t border-border flex gap-3">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Save Changes</button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default Profile;
