export interface Contact {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
  lastMsg: string;
  unread: number;
  time: string;
  group?: boolean;
  role?: string;
  dept?: string;
  lastSeen?: string;
  lastTs?: number;
  email?: string;
  authUserId?: number;
}

export interface ChatMessage {
  id: number;
  from: string;
  senderId?: number;
  me: boolean;
  text: string;
  time: string;
  read?: boolean;
  type?: "text" | "file" | "image";
  fileName?: string;
  fileSize?: string;
  imageUrl?: string;
  created_at?: string;
}

export const employeeContacts: Contact[] = [
  { id: 1, name: "Priya Patel", avatar: "PP", online: true, lastMsg: "I'll update the mockups by EOD", unread: 2, time: "2m", role: "Designer", dept: "Design" },
  { id: 2, name: "Vikram Reddy", avatar: "VR", online: true, lastMsg: "API docs are ready for review", unread: 0, time: "15m", role: "Developer", dept: "Engineering" },
  { id: 3, name: "Karthik Nair", avatar: "KN", online: false, lastMsg: "Deployed to staging ✅", unread: 0, time: "1h", role: "DevOps", dept: "Engineering" },
  { id: 4, name: "Engineering Team", avatar: "🔧", online: true, lastMsg: "Arjun: Let's sync at 4", unread: 4, time: "5m", group: true },
  { id: 5, name: "Ananya Iyer", avatar: "AI", online: false, lastMsg: "Content draft shared", unread: 0, time: "3h", role: "Marketing", dept: "Marketing" },
  { id: 6, name: "Sneha Kulkarni", avatar: "SK", online: true, lastMsg: "Invoice processed", unread: 1, time: "30m", role: "Finance", dept: "Finance" },
];

export const hrContacts: Contact[] = [
  { id: 101, name: "HR Announcements", avatar: "📢", online: true, lastMsg: "New policy update published", unread: 0, time: "1h", group: true },
  { id: 102, name: "Arjun Sharma", avatar: "AS", online: true, lastMsg: "Thanks for approving my leave!", unread: 1, time: "3m", role: "Sr. Developer", dept: "Engineering" },
  { id: 103, name: "Priya Patel", avatar: "PP", online: true, lastMsg: "Sent the updated offer letter", unread: 0, time: "10m", role: "UI/UX Lead", dept: "Design" },
  { id: 104, name: "Recruitment Team", avatar: "🎯", online: true, lastMsg: "3 new shortlisted candidates", unread: 3, time: "5m", group: true },
  { id: 105, name: "Vikram Reddy", avatar: "VR", online: false, lastMsg: "Can you share the promotion timeline?", unread: 1, time: "25m", role: "Developer", dept: "Engineering" },
  { id: 106, name: "Sneha Kulkarni", avatar: "SK", online: true, lastMsg: "Payroll reports are ready", unread: 2, time: "15m", role: "Accountant", dept: "Finance" },
  { id: 107, name: "Rahul Menon", avatar: "RM", online: false, lastMsg: "Exit interview scheduled for Friday", unread: 0, time: "2h", role: "HR Manager", dept: "HR" },
  { id: 108, name: "Divya Joshi", avatar: "DJ", online: true, lastMsg: "Onboarding docs submitted ✅", unread: 0, time: "45m", role: "Ops Lead", dept: "Operations" },
  { id: 109, name: "Management", avatar: "👔", online: true, lastMsg: "Q1 workforce plan review tomorrow", unread: 1, time: "1h", group: true },
  { id: 110, name: "Karthik Nair", avatar: "KN", online: true, lastMsg: "Need WFH policy clarification", unread: 0, time: "3h", role: "DevOps", dept: "Engineering" },
];

export const managerContacts: Contact[] = [
  { id: 201, name: "Sprint Planning", avatar: "🚀", online: true, lastMsg: "Sprint 12 backlog finalized", unread: 2, time: "5m", group: true },
  { id: 202, name: "Arjun Sharma", avatar: "AS", online: true, lastMsg: "PR is ready for review", unread: 1, time: "3m", role: "Sr. Developer", dept: "Engineering" },
  { id: 203, name: "Priya Patel", avatar: "PP", online: true, lastMsg: "Design system docs updated", unread: 0, time: "12m", role: "UI/UX Lead", dept: "Design" },
  { id: 204, name: "Daily Standup", avatar: "📋", online: true, lastMsg: "Karthik: Blocker on CI pipeline", unread: 3, time: "8m", group: true },
  { id: 205, name: "Vikram Reddy", avatar: "VR", online: false, lastMsg: "Need your input on the architecture", unread: 1, time: "30m", role: "Backend Dev", dept: "Engineering" },
  { id: 206, name: "Karthik Nair", avatar: "KN", online: true, lastMsg: "CI pipeline fixed ✅", unread: 0, time: "45m", role: "DevOps", dept: "Engineering" },
  { id: 207, name: "Leadership Sync", avatar: "👔", online: true, lastMsg: "CEO: Great progress this quarter", unread: 1, time: "1h", group: true },
  { id: 208, name: "Ananya Iyer", avatar: "AI", online: false, lastMsg: "Campaign metrics report attached", unread: 0, time: "2h", role: "Marketing", dept: "Marketing" },
  { id: 209, name: "Sneha Kulkarni", avatar: "SK", online: true, lastMsg: "Budget approved for new tools", unread: 0, time: "3h", role: "Accountant", dept: "Finance" },
];

export const employeeMessages: ChatMessage[] = [
  { id: 1, from: "Priya Patel", me: false, text: "Hey Arjun, I've finished the dashboard wireframes. Want to take a look?", time: "10:30 AM", read: true },
  { id: 2, from: "me", me: true, text: "That's great! Yes, please share them. I'll review during lunch.", time: "10:32 AM", read: true },
  { id: 3, from: "Priya Patel", me: false, text: "Shared on Figma. The analytics section needs your input on the chart types.", time: "10:34 AM", read: true },
  { id: 4, from: "me", me: true, text: "Perfect. I was thinking bar charts for productivity and line charts for trends.", time: "10:36 AM", read: true },
  { id: 5, from: "Priya Patel", me: false, text: "Sounds good. I'll update the mockups by EOD 👍", time: "10:38 AM" },
];

export const hrMessageSets: Record<number, ChatMessage[]> = {
  101: [
    { id: 1, from: "System", me: false, text: "📋 New Remote Work Policy has been published. All employees must acknowledge by March 20th.", time: "9:00 AM", read: true },
    { id: 2, from: "Rahul Menon", me: false, text: "I've updated the policy document with the latest compliance requirements.", time: "9:15 AM", read: true },
    { id: 3, from: "me", me: true, text: "Great. I'll send the acknowledgment form to all department heads today.", time: "9:30 AM", read: true },
  ],
  102: [
    { id: 1, from: "Arjun Sharma", me: false, text: "Hi, I wanted to check on my leave request for next week.", time: "11:00 AM", read: true },
    { id: 2, from: "me", me: true, text: "Hi Arjun! I've just approved your leave for March 20-22. You're all set.", time: "11:05 AM", read: true },
    { id: 3, from: "Arjun Sharma", me: false, text: "Thanks for approving my leave! I'll make sure to hand over my tasks before.", time: "11:06 AM" },
  ],
  103: [
    { id: 1, from: "me", me: true, text: "Hi Priya, could you send me the updated offer letter?", time: "10:00 AM", read: true },
    { id: 2, from: "Priya Patel", me: false, text: "Sure! I've updated the compensation as discussed.", time: "10:15 AM", read: true },
    { id: 3, from: "Priya Patel", me: false, text: "📎 Offer_Letter_Designer_2026.pdf", time: "10:16 AM", read: true, type: "file" },
  ],
  104: [
    { id: 1, from: "Recruiter Bot", me: false, text: "🎯 3 new candidates shortlisted for Frontend Developer role", time: "9:30 AM", read: true },
    { id: 2, from: "Divya Joshi", me: false, text: "I've scheduled first-round interviews for Wednesday and Thursday.", time: "9:45 AM", read: true },
  ],
  105: [{ id: 1, from: "Vikram Reddy", me: false, text: "Can you share the promotion timeline?", time: "2:00 PM", read: true }],
  106: [{ id: 1, from: "Sneha Kulkarni", me: false, text: "Payroll reports are ready for review.", time: "11:30 AM", read: true }],
  107: [{ id: 1, from: "Rahul Menon", me: false, text: "Exit interview scheduled for Friday at 2 PM.", time: "3:30 PM", read: true }],
  108: [{ id: 1, from: "Divya Joshi", me: false, text: "Onboarding docs submitted ✅", time: "1:00 PM", read: true }],
  109: [{ id: 1, from: "CEO", me: false, text: "Q1 workforce plan review tomorrow at 10 AM.", time: "4:00 PM", read: true }],
  110: [{ id: 1, from: "Karthik Nair", me: false, text: "Need WFH policy clarification for the new DevOps hires.", time: "9:00 AM", read: true }],
};

export const managerMessageSets: Record<number, ChatMessage[]> = {
  201: [
    { id: 1, from: "Arjun Sharma", me: false, text: "Sprint 12 backlog has been groomed. 23 story points committed.", time: "9:00 AM", read: true },
    { id: 2, from: "me", me: true, text: "Good. Let's ensure the auth module gets priority. It's blocking the release.", time: "9:10 AM", read: true },
    { id: 3, from: "Priya Patel", me: false, text: "Design handoff for the dashboard redesign is done. All specs are in Figma.", time: "9:20 AM", read: true },
    { id: 4, from: "Vikram Reddy", me: false, text: "Sprint 12 backlog finalized. I'll start on the API gateway today.", time: "9:30 AM" },
  ],
  202: [
    { id: 1, from: "Arjun Sharma", me: false, text: "The pull request for the notification service is ready for review.", time: "10:00 AM", read: true },
    { id: 2, from: "me", me: true, text: "I'll review it after lunch. Any breaking changes?", time: "10:05 AM", read: true },
    { id: 3, from: "Arjun Sharma", me: false, text: "No breaking changes. Just added WebSocket support.", time: "10:08 AM", read: true },
    { id: 4, from: "Arjun Sharma", me: false, text: "PR is ready for review — I've added unit tests too 🧪", time: "10:10 AM" },
  ],
  203: [
    { id: 1, from: "me", me: true, text: "Priya, how's the progress on the new dashboard components?", time: "11:00 AM", read: true },
    { id: 2, from: "Priya Patel", me: false, text: "80% done! Charts and data tables are ready. Working on responsive views.", time: "11:15 AM", read: true },
  ],
  204: [
    { id: 1, from: "Arjun Sharma", me: false, text: "Yesterday: Completed notification service. Today: Starting payment integration.", time: "9:30 AM", read: true },
    { id: 2, from: "Priya Patel", me: false, text: "Yesterday: Dashboard wireframes done. Today: Building responsive layouts.", time: "9:32 AM", read: true },
    { id: 3, from: "Karthik Nair", me: false, text: "🚨 Blocker: CI pipeline failing on the staging branch.", time: "9:35 AM", read: true },
    { id: 4, from: "me", me: true, text: "@Karthik — Priority fix please. @Arjun hold the payment PR until CI is green.", time: "9:40 AM", read: true },
  ],
  205: [
    { id: 1, from: "Vikram Reddy", me: false, text: "I've been evaluating two approaches for the microservices architecture.", time: "2:00 PM", read: true },
    { id: 2, from: "me", me: true, text: "Let's discuss in our 1-on-1. Can you prepare a comparison doc?", time: "2:10 PM", read: true },
  ],
  206: [{ id: 1, from: "Karthik Nair", me: false, text: "CI pipeline fixed ✅ All green now.", time: "11:00 AM", read: true }],
  207: [
    { id: 1, from: "CEO", me: false, text: "Q1 results are looking strong. Engineering velocity is up 30%.", time: "3:00 PM", read: true },
    { id: 2, from: "me", me: true, text: "Thanks! The team has been crushing it.", time: "3:15 PM", read: true },
  ],
  208: [{ id: 1, from: "Ananya Iyer", me: false, text: "Campaign metrics report attached — 25% improvement MoM 📈", time: "1:00 PM", read: true }],
  209: [{ id: 1, from: "Sneha Kulkarni", me: false, text: "Budget approved for new tools — ₹5L allocated for Q2.", time: "11:00 AM", read: true }],
};

export const adminContacts: Contact[] = [
  { id: 301, name: "Engineering Manager", avatar: "EM", online: true, lastMsg: "Server scaling is complete for Q3.", unread: 1, time: "15m", role: "Manager", dept: "Engineering" },
  { id: 302, name: "HR Department", avatar: "HR", online: true, lastMsg: "All compliance docs are updated.", unread: 2, time: "10m", role: "HR", dept: "Human Resources" },
  { id: 303, name: "Employee Representatives", avatar: "EMP", online: false, lastMsg: "Quarterly feedback collected.", unread: 0, time: "1h", role: "Employee Data", dept: "General" }
];

export const adminMessageSets: Record<number, ChatMessage[]> = {
  301: [
    { id: 1, from: "Engineering Manager", me: false, text: "Server scaling is complete for Q3.", time: "11:00 AM", read: true },
    { id: 2, from: "me", me: true, text: "Great job. Are we on track for the project release?", time: "11:05 AM", read: true },
    { id: 3, from: "Engineering Manager", me: false, text: "Yes, 100% on track. No blockers so far.", time: "11:15 AM", read: false }
  ],
  302: [
    { id: 1, from: "HR Department", me: false, text: "The new workplace policies have been drafted.", time: "10:00 AM", read: true },
    { id: 2, from: "me", me: true, text: "Excellent, please send them over for final review.", time: "10:05 AM", read: true },
    { id: 3, from: "HR Department", me: false, text: "All compliance docs are updated. I'll share the link shortly.", time: "10:10 AM", read: false },
    { id: 4, from: "HR Department", me: false, text: "📎 Policy_Updates_2026.pdf", time: "10:11 AM", read: false, type: "file", fileName: "Policy_Updates_2026.pdf", fileSize: "1.2 MB" }
  ],
  303: [
    { id: 1, from: "Employee Representatives", me: false, text: "We have gathered all the feedback from the quarterly survey.", time: "2:00 PM", read: true },
    { id: 2, from: "me", me: true, text: "Thanks! What's the general sentiment?", time: "2:10 PM", read: true },
    { id: 3, from: "Employee Representatives", me: false, text: "Overall very positive. Quarterly feedback collected.", time: "2:15 PM", read: true }
  ]
};
