import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type SystemRole = "Admin" | "Manager" | "HR" | "Employee";

export interface UserRecord {
  id: string;
  userId: number;        // users table PK — use this for chat receiver_id
  name: string;
  email: string;
  password?: string;
  role: SystemRole;
  department?: string;
  employeeId: string;
  employeeRole?: string; // e.g. Developer, Designer
  mobileNumber?: string;
  joiningDate?: string;
  status: "Active" | "Inactive";
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  // Fetch reference data for creation dropdowns
  // Fetch reference data for creation dropdowns
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const response = await api.get("/employees/departments");
        console.log("[useUserManagement] Departments fetched:", response.data.data);
        return response.data.data || [];
      } catch (err) {
        console.error("[useUserManagement] Departments fetch failed:", err);
        return []; // Return empty array instead of crashing or using fake data
      }
    }
  });

  const { data: designations = [] } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => {
      try {
        const response = await api.get("/employees/designations");
        console.log("[useUserManagement] Designations fetched:", response.data.data);
        return response.data.data || [];
      } catch (err) {
        console.error("[useUserManagement] Designations fetch failed:", err);
        return [];
      }
    }
  });

  const isAdmin = role === "administrator";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", role],
    queryFn: async () => {
      try {
        const response = await api.get("/employees");
        const rawData = response.data.data?.employees || response.data.data || [];

        return rawData.map((item: any) => ({
          id: String(item.id), // employee table PK — used for employee CRUD routes
          userId: Number(item.user_id || item.user?.id || 0), // users table PK — used for chat
          first_name: item.first_name || "",
          last_name: item.last_name || "",
          phone: item.phone || item.mobileNumber || "",
          date_of_joining: item.date_of_joining || item.joiningDate || "",
          employee_code: item.employee_code || item.employeeId || "",
          name: `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.name || "Unknown",
          email: item.user?.email || item.email || "",
          role: item.user?.role === "super_admin" || item.user?.role === "admin" ? "Admin" : 
                item.user?.role === "manager" ? "Manager" : 
                item.user?.role === "hr" ? "HR" : "Employee",
          department: item.department?.name || item.department || "",
          employeeRole: item.designation?.name || item.designation || item.employeeRole || "",
          status: item.status === "active" || item.is_active ? "Active" : "Inactive",
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
      } catch (err: any) {
        if (err.response?.status === 403) {
          console.error("[useUserManagement] ACCESS DENIED (403): Your account does not have permission to view the employee list. Name resolution in attendance will fall back to basic records.", err);
        } else {
          console.error("[useUserManagement] Fetch failed:", err);
        }
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Auto-resolve IDs from names if IDs aren't provided
      const dept = departments.find((d: any) => d.name === data.department);
      const desig = designations.find((d: any) => d.title === data.employeeRole);

      let hireDate = data.joiningDate;
      if (hireDate && /^\d{2}-\d{2}-\d{4}$/.test(hireDate)) {
        const [d, m, y] = hireDate.split('-').map(Number);
        hireDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      } else if (!hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) {
        hireDate = new Date().toISOString().split('T')[0];
      }

      const payload = {
        first_name: data.firstName || "User",
        last_name: data.lastName || data.firstName || "User", // Fallback to firstName if lastName empty
        email: data.email,
        password: data.password,
        role: data.role?.toLowerCase() || "employee",
        department_id: dept?.id || data.departmentId || 1,
        designation_id: desig?.id || data.designationId || 1,
        hire_date: hireDate,
        phone: data.mobileNumber || "0000000000",
        create_account: true,
        employee_code: data.employeeId || undefined,
      };
      
      console.log("[useUserManagement] Creating with payload:", payload);
      const response = await api.post("/employees", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      console.error("[useUserManagement] Create Error:", error.response?.data);
      const serverMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null);
                            
      toast.error(serverMessage || "Creation failed. Ensure email/phone is unique and fields meet minimum lengths.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await api.put(`/employees/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await api.put(`/employees/${id}`, { is_active, status: is_active ? 'active' : 'inactive' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User permanently deleted from system");
    },
    onError: (error: any) => {
      console.error("[useUserManagement] Delete Error:", error.response?.data);
      const serverMessage = error.response?.data?.message || error.message || "Failed to delete user";
      toast.error(serverMessage);
    }
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await api.post("/departments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    }
  });

  const createUser = async (data: any) => {
    return await createMutation.mutateAsync(data);
  };

  const updateUser = async (id: string, updates: any) => {
    return await updateMutation.mutateAsync({ id, updates });
  };

  const deleteUser = async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  };

  const toggleUserStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === "Inactive"; // If currently Inactive, we want to activate (is_active: true)
    return await statusMutation.mutateAsync({ id: id, is_active: newStatus });
  };

  const createDepartment = async (data: { name: string; description?: string }) => {
    return await createDeptMutation.mutateAsync(data);
  };

  return {
    users,
    isLoading,
    departments,
    designations,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    createDepartment,
  };
};
