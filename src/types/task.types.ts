export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled";

// Protocol Task Type (Task 10)
export type Task = {
  id?: number;
  _id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;
  due_date?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  } | string;
  assigned_to?: string | number;
  assigned_to_name?: string;
  project?: string;
  comments?: number;
  attachments?: string[];
  createdBy?: {
    _id: string;
    name: string;
  } | string;
  assigned_by_name?: string;
  category?: string;
  createdAt?: string;
};

// Maintaining TaskRecord alias for compatibility
export interface TaskRecord extends Task {}

export interface UserTaskInfo {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}
