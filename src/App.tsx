import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Leave from "./pages/Leave";
import Documents from "./pages/Documents";
import Meetings from "./pages/Meetings";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { AttendanceProvider } from "./hooks/useAttendance";
import { LeaveProvider } from "./hooks/useLeave";
import { TaskProvider } from "./hooks/useTask";
import { DocumentProvider } from "./hooks/useDocument";
import { MeetingProvider } from "./hooks/useMeeting";
import SuperHome from "./pages/SuperHome";
import Profile from "./pages/Profile";
import AttendanceReports from "./pages/AttendanceReports";
import LeaveApprovals from "./pages/LeaveApprovals";
import Departments from "./pages/Departments";
import CreateTask from "./pages/CreateTask";
import EmployeeDetails from "./pages/EmployeeDetails";
import HRLeaveManagement from "./pages/HRLeaveManagement";
import UserManagement from "./pages/UserManagement";
import CalendarPage from "./pages/CalendarPage";
import { NotificationProvider } from "./hooks/useNotification";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Stop retrying aggressively if the backend fails
      refetchOnWindowFocus: false, // Don't refetch every time the browser is clicked
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <AuthProvider>
        <AttendanceProvider>
          <LeaveProvider>
            <TaskProvider>
              <DocumentProvider>
                <Toaster />
                <Sonner />
                <NotificationProvider>
                  <MeetingProvider>
                  <BrowserRouter>
                    <Routes>
                    <Route path="/" element={<SuperHome />} />
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/employee-details/:id" element={<EmployeeDetails />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/attendance-reports" element={<AttendanceReports />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/create-task" element={<CreateTask />} />
                      <Route path="/leave" element={<Leave />} />
                      <Route path="/leave-approvals" element={<LeaveApprovals />} />
                      <Route path="/hr-leave-management" element={<HRLeaveManagement />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/departments" element={<Departments />} />
                      <Route path="/meetings" element={<Meetings />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/user-management" element={<UserManagement />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                </MeetingProvider>
                </NotificationProvider>
              </DocumentProvider>
            </TaskProvider>
          </LeaveProvider>
        </AttendanceProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
);

export default App;
