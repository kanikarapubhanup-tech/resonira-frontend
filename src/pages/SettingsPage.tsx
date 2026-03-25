import { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserManagement } from "@/hooks/useUserManagement";

export default function SettingsPage() {
  const { role, user } = useAuth();
  const { users, updateUser } = useUserManagement();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleUpdatePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match");
      return;
    }

    const targetEmail = user?.email?.trim().toLowerCase() || "";
    const sysUser = users.find(u => u.email?.trim().toLowerCase() === targetEmail);
    if (!sysUser) {
      console.error("Lookup mismatch!", {
        searchingFor: targetEmail,
        availableEmployees: users.map(u => u.email)
      });
      toast.error("User record not found. Please ensure your account exists in User Management.");
      return;
    }

    const currentHash = await hashPassword(currentPass);
    if (currentHash !== sysUser.passwordHash) {
      toast.error("Current password is incorrect");
      return;
    }

    try {
      await updateUser(sysUser.id, { password: newPass });
      toast.success("Password updated successfully!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (e) {
      toast.error("Failed to update password");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* Profile */}
      <div className="card-surface p-5">
        <h3 className="font-heading font-bold mb-4">Profile</h3>
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-xl">{user?.name ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : "AS"}</div>
            {role !== "hr" && <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center"><Camera size={12} className="text-primary-foreground" /></button>}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <input defaultValue={user?.name || "User"} readOnly={role === "hr"} className={`bg-secondary border border-border rounded-xl px-3 py-2 text-sm ${role === "hr" ? "opacity-90 outline-none cursor-default" : ""}`} />
            <input defaultValue={user?.email || "user@resonira.com"} readOnly={role === "hr"} className={`bg-secondary border border-border rounded-xl px-3 py-2 text-sm ${role === "hr" ? "opacity-90 outline-none cursor-default" : ""}`} />
            {role !== "hr" && (
              <>
                <input defaultValue="+91 98765 43210" className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm col-span-2" />
              </>
            )}
          </div>
        </div>
        {role !== "hr" && role !== "employee" && (
          <button onClick={() => toast.success("Profile updated")} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold mt-4">Save Changes</button>
        )}
      </div>

      {/* Password */}
      {role !== "hr" && role !== "employee" && (
        <div className="card-surface p-5">
          <h3 className="font-heading font-bold mb-4">Change Password</h3>
          <div className="space-y-3 max-w-sm">
            <input 
              type="password" 
              placeholder="Current Password" 
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm" 
            />
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm" 
            />
            <div className="h-1.5 rounded-full bg-secondary">
              <div className={`h-full rounded-full ${newPass.length > 8 ? "bg-success" : "bg-warning"} w-1/2`} />
            </div>
            <p className="text-[11px] text-muted-foreground">{newPass.length > 8 ? "Strong password" : "Medium strength"}</p>
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm" 
            />
          </div>
          <button onClick={handleUpdatePassword} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold mt-4">Update Password</button>
        </div>
      )}

      {/* Language */}
      <div className="card-surface p-5">
        <h3 className="font-heading font-bold mb-3">Language</h3>
        <select className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm max-w-sm">
          <option>English</option><option>Hindi</option><option>Telugu</option>
        </select>
      </div>
    </div>
  );
}
