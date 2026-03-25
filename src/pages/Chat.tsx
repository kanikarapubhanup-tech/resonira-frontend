import { useState, useRef, useEffect, useCallback } from "react";
import { Phone, Video, Monitor, Pin, Smile, Paperclip, Send, Search, Hash, Star, MoreVertical, Check, CheckCheck, Image as ImageIcon, FileText, Download, X, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Tooltip, EmojiPicker, ImagePreviewModal, UploadPreview, VoiceCallModal, VideoCallModal, MoreMenu } from "@/components/chat/ChatModals";
import type { Contact, ChatMessage } from "@/components/chat/chatData";
import api from "@/lib/api";
import { socket, connectSocket } from "@/lib/socket";
import type { AxiosError } from "axios";

// ─── Helpers ────────────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV;
const log = (...args: unknown[]) => { if (IS_DEV) console.log("[Chat]", ...args); };

interface ApiErrorData {
  success: boolean;
  message?: string;
  requestId?: string;
}

/** Consistent error toast following the backend contract */
function showApiError(err: AxiosError<ApiErrorData>, fallback: string): void {
  const status = err.response?.status;
  const data = err.response?.data;

  if (status === 400) {
    toast.error(data?.message || "Invalid request.");
  } else if (status === 500) {
    const rid = data?.requestId ? ` (ref: ${data.requestId})` : "";
    toast.error(`Something went wrong. Please try again.${rid}`);
  } else {
    toast.error(data?.message || fallback);
  }
}

/** Build a deterministic room key from two IDs */
function roomKey(a: number, b: number): string {
  return [a, b].sort((x, y) => x - y).join("-");
}

// ─── Component ──────────────────────────────────────────────────────
export default function Chat() {
  const { role, user } = useAuth();
  const isHR = role === "hr";
  const isManager = role === "manager";
  const isAdmin = role === "administrator";

  const { users } = useUserManagement();

  // Strictly normalize current user ID as instructed
  const currentUserId = Number(user?.id || user?._id || 0);

  // ─── State ──────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: number; members?: Array<{ user_id: number, user?: { id: number, email: string } }> }>>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [msgInput, setMsgInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "groups" | "starred">("all");
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const activeRoomRef = useRef<string>("");

  // Feature states
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [voiceCall, setVoiceCall] = useState(false);
  const [videoCall, setVideoCall] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [pinned, setPinned] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState<Set<number>>(new Set());

  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  // Track latest message ID per room to avoid unnecessary state updates
  const latestMsgIdRef = useRef<Record<string, number>>({});

  // ─── Poll Conversations ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await api.get("/communication/conversations");
        if (!mounted) return;
        const rows = res.data?.data?.data || res.data?.data;
        if (Array.isArray(rows)) setConversations(rows);
      } catch {
        /* 401 handled by interceptor */
      }
    };
    fetch();
    const id = setInterval(fetch, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // ─── Poll Messages for Active Conversation ─────────────────────
  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      if (!activeContact?.authUserId || !currentUserId) return;
      
      const rid = roomKey(currentUserId, activeContact.authUserId);
      let conv = conversations.find(c => 
        c.members?.some(m => (m.user?.id || m.user_id) === activeContact.authUserId)
      );

      // ── Resolve Conversation if Missing ─────────
      if (!conv) {
        try {
          const resolveRes = await api.get(`/communication/conversation/resolve?partner_id=${activeContact.authUserId}`);
          conv = resolveRes.data?.data;
          if (conv) {
            setConversations(prev => (prev.some(p => p.id === conv?.id) ? prev : [...prev, conv!]));
          }
        } catch (err) {
          log("Resolution Error:", err);
        }
      }

      setLoadingMessages(true);
      try {
        // Use conversation_id as primary, partner_id as fallback
        const url = conv?.id 
          ? `/communication/messages?conversation_id=${conv.id}&limit=100` 
          : `/communication/messages?partner_id=${activeContact.authUserId}&limit=100`;

        log(`Fetching messages for room ${rid}`, { convId: conv?.id });
        
        const res = await api.get(url);
        if (!mounted) return;

        const rows: any[] = res.data?.data?.rows || res.data?.data || [];
        if (!Array.isArray(rows)) return;

        if (rows.length === 0) {
          setChatMessages(prev => ({ ...prev, [rid]: [] }));
          return;
        }

        // Use the ID of the LAST message for change detection (since data is ASC)
        const latestRow = rows[rows.length - 1];
        if (latestMsgIdRef.current[rid] === latestRow.id) return;
        latestMsgIdRef.current[rid] = latestRow.id;

        const formatted: ChatMessage[] = rows.map((m: any) => {
          const senderUserId = Number(m.sender?.id || m.senderId || m.sender_id);
          const isSender = senderUserId === currentUserId;
          
          return {
            id: m.id,
            from: isSender ? (user?.name || "Me") : (m.sender?.name || m.sender?.email?.split('@')[0] || "Someone"),
            senderId: senderUserId,
            me: isSender,
            text: m.content || "",
            time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            read: m.is_read || false,
            type: m.message_type || m.messageType || (m.file_url ? (/\.(jpg|jpeg|png|gif|webp)$/i.test(m.file_url) ? "image" : "file") : "text"),
            fileName: m.file_name || m.fileName,
            imageUrl: m.file_url || m.fileUrl,
            fileUrl: m.file_url || m.fileUrl,
            created_at: m.created_at || new Date().toISOString(),
          };
        });

        setChatMessages(prev => ({ ...prev, [rid]: formatted }));
      } catch (err) {
        log("Fetch Error:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    const id = setInterval(fetchMessages, 4000); // 4s polling is sufficient with sockets
    return () => { mounted = false; clearInterval(id); };
  }, [activeContact?.id, activeContact?.authUserId, activeContact?.name, conversations, currentUserId, user?.name]);

  // ─── Join Conversation Room ─────────────────────────────────────
  useEffect(() => {
    if (activeContact?.authUserId) {
      // Find the conversation ID for this contact if it exists
      const conv = conversations.find(c => 
        c.members?.some(m => m.user?.id === activeContact.authUserId)
      );
      if (conv) {
        socket.emit('join_conversation', conv.id);
      }
    }
  }, [activeContact, conversations]);

  // ─── Seed Messages for All Conversations ────────────────────────
  // Fetches background data so unread counts & recent sorting work globally on load
  useEffect(() => {
    if (!currentUserId || !conversations.length) return;

    conversations.forEach(async (conv) => {
      // Find the other member's authUserId
      const otherMember = conv.members?.find(m => (m.user?.id || m.user_id) !== currentUserId);
      const authUserId = otherMember?.user?.id || otherMember?.user_id;
      if (!authUserId) return;
      
      const seedRid = roomKey(currentUserId, authUserId);
      // Only fetch if we haven't seeded this room yet
      if (chatMessages[seedRid]) return;

      try {
        const res = await api.get(`/communication/messages?conversation_id=${conv.id}`);
        const rows: unknown[] = res.data?.data?.data || res.data?.data;
        if (!Array.isArray(rows)) return;
        
        if (rows.length === 0) {
          setChatMessages(prev => ({ ...prev, [seedRid]: [] }));
          return;
        }

        const formatted: ChatMessage[] = rows.map((m: any) => {
          const senderId = Number(m.senderId || m.sender_id);
          const isSender = senderId === currentUserId;
          return {
            id: m.id,
            from: isSender ? (user?.name || "Me") : (m.sender?.user?.email?.split('@')[0] || m.sender?.email?.split('@')[0] || "Someone"),
            senderId,
            me: isSender,
            text: m.content || "",
            time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            read: m.is_read || false,
            type: m.message_type || m.messageType || (m.file_url ? "image" : "text"),
            fileName: m.file_name || m.fileName,
            imageUrl: m.file_url || m.fileUrl,
            created_at: m.created_at || new Date().toISOString(),
          };
        });

        setChatMessages(prev => ({ ...prev, [seedRid]: formatted }));
      } catch { }
    });
  }, [conversations, currentUserId, chatMessages, user?.name]);

  // ─── Socket.IO Real-Time Integration ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      connectSocket(token);
    }
    
      const onNewMessage = (msgData: any) => {
      const senderUserId = Number(msgData.sender?.id || msgData.senderId || msgData.sender_id);
      const isSender = senderUserId === currentUserId;
      
      const partnerId = isSender ? (msgData.receiver_id || 0) : senderUserId;
      const room = roomKey(currentUserId, partnerId);

      const newMsg: ChatMessage = {
        id: msgData.id,
        text: msgData.content || "",
        senderId: senderUserId,
        from: isSender ? (user?.name || "Me") : (msgData.sender?.name || "Someone"),
        me: isSender,
        time: new Date(msgData.created_at || new Date()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        type: msgData.message_type || msgData.messageType || (msgData.file_url ? "image" : "text"),
        read: (!isSender && room === activeRoomRef.current) ? true : false,
        fileName: msgData.file_name || msgData.fileName,
        imageUrl: msgData.file_url || msgData.fileUrl,
        created_at: msgData.created_at || new Date().toISOString()
      };
      
      setChatMessages(prev => {
        const existing = prev[room] || [];
        
        // Block true absolute duplicates
        if (existing.some((m: ChatMessage) => m.id === newMsg.id)) return prev;
        
        // If we have an optimistic message (high local timestamp ID) with identical text sent within last 10 seconds, replace it!
        const optimisticIndex = existing.findIndex((m: ChatMessage) => 
          m.id > 1600000000000 && m.me && m.text === newMsg.text
        );
        
        if (optimisticIndex >= 0) {
          const nextArr = [...existing];
          nextArr[optimisticIndex] = newMsg;
          return { ...prev, [room]: nextArr };
        }
        
        return {
          ...prev,
          [room]: [...existing, newMsg].sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
        };
      });

      if (!isSender && room === activeRoomRef.current) {
        // Automatically mark-read in backend if we are physically staring at the message
        api.patch(`/communication/messages/${newMsg.id}/read`).catch(() => {});
      } else if (!isSender) {
        toast.info(`New message from ${newMsg.from}`, { description: newMsg.text?.substring(0, 30) });
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [currentUserId, user]);

  // ─── Build Contacts from Employee Records ───────────────────────
  useEffect(() => {
    if (users.length === 0) return;

    const dynamicContacts: Contact[] = users
      .filter(u => u.email?.toLowerCase().trim() !== user?.email?.toLowerCase().trim())
      .map((u, i) => {
        let contactId = parseInt(u.employeeId.replace(/\D/g, "")) || Date.now() + i;
        // Use users-table PK for chat identity
        const authUserId = u.userId || 0;
        let contactName = u.name;

          if (u.email === "admin@resonira.com") {
            contactId = 999;
            contactName = "System Administrator";
          }

          const room = roomKey(currentUserId, authUserId);
          const msgs = chatMessages[room] || [];
        const lastM = msgs.length > 0 ? msgs[msgs.length - 1] : null;

        return {
          id: contactId,
          authUserId,
          name: contactName,
          email: u.email,
          avatar: contactName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
          online: u.status === "Active",
          lastMsg: lastM ? (lastM.type === "file" ? "📎 File attached" : lastM.type === "image" ? "📸 Image" : lastM.text) : "Available for chat",
          unread: msgs.filter(m => !m.me && !m.read).length,
          time: lastM ? lastM.time : "",
          lastTs: lastM ? new Date(lastM.created_at || 0).getTime() : 0,
          role: u.employeeRole || u.role,
          dept: u.department || "Company",
          lastSeen: u.lastSeen,
        };
      });

    // Ensure admin contact is always present
    if (user?.email?.toLowerCase() !== "admin@resonira.com" && !dynamicContacts.some(c => c.id === 999)) {
      const adminUser = users.find(u => u.email?.toLowerCase() === "admin@resonira.com");
      const adminAuthUserId = adminUser?.userId || 4;
      const adminRoom = roomKey(currentUserId, adminAuthUserId);
      const adminMsgs = chatMessages[adminRoom] || [];
      const lastAdminM = adminMsgs.length > 0 ? adminMsgs[adminMsgs.length - 1] : null;


      dynamicContacts.push({
        id: 999,
        authUserId: adminAuthUserId,
        name: "System Administrator",
        email: "admin@resonira.com",
        avatar: "SA",
        online: true,
        lastMsg: lastAdminM ? (lastAdminM.type === "file" ? "📎 File attached" : lastAdminM.type === "image" ? "📸 Image" : lastAdminM.text) : "Organization HQ",
        unread: adminMsgs.filter(m => !m.me && !m.read).length,
        time: lastAdminM ? lastAdminM.time : "",
        lastTs: lastAdminM ? new Date(lastAdminM.created_at || 0).getTime() : 0,
        role: "Administrator",
        dept: "IT",
      });
    }

    setContacts(dynamicContacts);
    setActiveContact(prev => {
      if (!prev && dynamicContacts.length > 0) return dynamicContacts[0];
      if (prev) {
        const found = dynamicContacts.find(c => c.id === prev.id);
        return found || [...dynamicContacts].sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))[0];
      }
      return prev;
    });
  }, [users, currentUserId, chatMessages, user?.email]);

  // ─── Derived State ──────────────────────────────────────────────
  const rid = activeContact ? roomKey(currentUserId, activeContact.authUserId) : "";
  useEffect(() => { activeRoomRef.current = rid; }, [rid]);
  
  const currentMessages = rid ? (chatMessages[rid] || []).map((m: any) => {
    // 1. Normalize Message Data (again for derived state)
    const senderUserId = Number(m.sender?.id || m.senderId || m.sender_id);
    return { ...m, me: senderUserId === currentUserId };
  }) : [];

  const markRoomAsRead = useCallback((r: string) => {
    if (!r || !chatMessages[r]) return;
    const msgs = chatMessages[r];
    const unreadMsgs = msgs.filter(m => !m.me && !m.read);
    
    if (unreadMsgs.length > 0) {
      setChatMessages(prev => ({
        ...prev,
        [r]: prev[r].map(m => (!m.me ? { ...m, read: true } : m)),
      }));

      // Fire and forget to backend to persist "read" status!
      unreadMsgs.forEach(um => {
        api.patch(`/communication/messages/${um.id}/read`).catch(() => {});
      });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeContact && rid) markRoomAsRead(rid);
  }, [activeContact?.id, rid, markRoomAsRead]);

  const handleContactSelect = useCallback((c: Contact) => {
    setActiveContact(c);
    shouldAutoScroll.current = true; // Auto-scroll when opening a new chat
    markRoomAsRead(roomKey(currentUserId, c.authUserId));
  }, [currentUserId, markRoomAsRead]);

  // Filter + sort contacts
  const filteredContacts = contacts.filter(c => {
    const match = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === "unread") return match && c.unread > 0;
    if (filterType === "groups") return match && c.group;
    if (filterType === "starred") return match && starred.has(c.id);
    return match;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const ap = pinned.has(a.id) ? 1 : 0;
    const bp = pinned.has(b.id) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.lastTs || 0) - (a.lastTs || 0);
  });

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Buffer of 150px to detect bottom pinning cleanly without native synthetic interrupt bugs
    shouldAutoScroll.current = Math.abs(scrollHeight - scrollTop - clientHeight) < 150;
  }, []);

  const scrollToBottom = useCallback((behavior: "smooth" | "instant" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      scrollToBottom("smooth");
    }
  }, [currentMessages.length, scrollToBottom]);

  useEffect(() => {
    // ALWAYS snap scroll strictly when switching contacts
    shouldAutoScroll.current = true;
    scrollToBottom("instant");
  }, [activeContact?.id, scrollToBottom]);

  const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  // ─── Send Text Message (Optimistic + Rollback) ─────────────────
  const handleSend = useCallback(async () => {
    if (!msgInput.trim() || !activeContact?.authUserId || !rid) return;

    const textToSend = msgInput.trim();
    const tempId = Date.now() + Math.random();
    const tempMsg: ChatMessage = {
      id: tempId as any, // Temporary ID, overwritten via index swapping on socket receipt
      from: user?.name || "Me",
      senderId: currentUserId,
      me: true,
      text: textToSend,
      time: now(),
      read: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic add
    shouldAutoScroll.current = true; // Force scroll when I send a message
    setChatMessages(p => ({ ...p, [rid]: [...(p[rid] || []), tempMsg] }));
    setMsgInput("");
    setShowEmoji(false);

    try {
      await api.post("/communication/messages", {
        receiver_id: activeContact.authUserId,
        message: textToSend,
      });
      log("Message sent to", activeContact.name);
    } catch (err) {
      // Rollback: remove optimistic message, restore input
      setChatMessages(p => ({
        ...p,
        [rid]: (p[rid] || []).filter(m => m.id !== tempId),
      }));
      setMsgInput(textToSend);
      showApiError(err as AxiosError<ApiErrorData>, "Failed to send message. Please try again.");
    }
  }, [msgInput, activeContact, rid, currentUserId, user?.name]);

  // ─── File Handling ──────────────────────────────────────────────
  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("File size must be under 10MB"); return; }
    setPendingFile(f);
    e.target.value = "";
  }, []);

  const sendFile = useCallback(() => {
    if (!pendingFile || !activeContact?.authUserId || !rid) return;
    const isImg = pendingFile.type.startsWith("image/");
    const sizeStr = pendingFile.size < 1024 * 1024
      ? `${(pendingFile.size / 1024).toFixed(1)} KB`
      : `${(pendingFile.size / (1024 * 1024)).toFixed(1)} MB`;

    const capturedFile = pendingFile;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64data = reader.result as string;
      const tempFileId = Date.now() + Math.random();
      const msg: ChatMessage = {
        id: tempFileId as any,
        from: user?.name || "Me",
        senderId: currentUserId,
        me: true,
        time: now(),
        read: false,
        text: isImg ? "" : `📎 ${capturedFile.name}`,
        type: isImg ? "image" : "file",
        fileName: capturedFile.name,
        fileSize: sizeStr,
        imageUrl: base64data,
      };

      // Optimistic add
      shouldAutoScroll.current = true;
      setChatMessages(p => ({ ...p, [rid]: [...(p[rid] || []), msg] }));
      setPendingFile(null);

      try {
        const formData = new FormData();
        formData.append("file", capturedFile);
        formData.append("receiver_id", String(activeContact.authUserId));
        formData.append("message", isImg ? "[Image Attachment]" : `[File: ${capturedFile.name}]`);
        formData.append("message_type", isImg ? "image" : "file");
        
        await api.post("/communication/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        log("File sent to", activeContact.name);
      } catch (err) {
        // Rollback: remove optimistic file message
        setChatMessages(p => ({
          ...p,
          [rid]: (p[rid] || []).filter(m => m.id !== tempFileId),
        }));
        showApiError(err as AxiosError<ApiErrorData>, "Failed to send file. Please try again.");
      }
    };
    reader.readAsDataURL(capturedFile);
  }, [pendingFile, activeContact, rid, currentUserId, user?.name]);

  // ─── Star / Pin / More ──────────────────────────────────────────
  const toggleStar = useCallback(() => {
    if (!activeContact) return;
    setStarred(p => { const n = new Set(p); if (n.has(activeContact.id)) n.delete(activeContact.id); else n.add(activeContact.id); return n; });
    toast.success(starred.has(activeContact.id) ? "Conversation unstarred" : "Conversation starred ⭐");
  }, [activeContact, starred]);

  const togglePin = useCallback(() => {
    if (!activeContact) return;
    setPinned(p => { const n = new Set(p); if (n.has(activeContact.id)) n.delete(activeContact.id); else n.add(activeContact.id); return n; });
    toast.success(pinned.has(activeContact.id) ? "Unpinned from top" : "Pinned to top 📌");
  }, [activeContact, pinned]);

  const handleMenuAction = useCallback((action: string) => {
    if (!activeContact) return;
    const labels: Record<string, string> = { profile: "Viewing profile", mute: muted.has(activeContact.id) ? "Unmuted" : "Muted", archive: "Chat archived", clear: "Chat cleared", block: "User blocked" };
    if (action === "mute") setMuted(p => { const n = new Set(p); if (n.has(activeContact.id)) n.delete(activeContact.id); else n.add(activeContact.id); return n; });
    if (action === "clear") setChatMessages(p => ({ ...p, [roomKey(currentUserId, activeContact.authUserId)]: [] }));
    toast.success(labels[action] || action);
  }, [activeContact, muted, currentUserId]);

  // ─── Loading State ──────────────────────────────────────────────
  if (!activeContact) {
    return <div className="animate-pulse p-10 flex text-center justify-center items-center h-[calc(100vh-100px)] text-muted-foreground font-medium">Loading Contacts from User Management...</div>;
  }

  return (
    <div className="animate-fade-up -m-6 flex h-[calc(100vh-0px)]">
      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.txt,.doc,.xls,.csv" onChange={handleFilePick} />
      <input ref={imgRef} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFilePick} />

      {/* ───── Contact Sidebar ───── */}
      <div className="w-[320px] border-r border-border flex flex-col bg-background shrink-0">
        <div className="p-4 space-y-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base">{isHR ? "HR Communications" : isManager ? "Team Chat" : "Messages"}</h2>
            {totalUnread > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{totalUnread} new</span>}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search conversations..." className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-1.5">
            {(["all", "unread", "groups", "starred"] as const).map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${filterType === f ? "gradient-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                {f === "all" ? "All" : f === "unread" ? "Unread" : f === "groups" ? "Groups" : "⭐ Starred"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(isHR || isManager) && <div className="px-4 pt-3 pb-1"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Conversations</span></div>}
          {sortedContacts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No conversations found</div>
          ) : sortedContacts.map(c => (
            <div key={c.id} onClick={() => handleContactSelect(c)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-2 ${activeContact.id === c.id ? "bg-primary/5 border-primary" : "hover:bg-secondary/50 border-transparent"}`}>
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c.group ? "bg-accent/20 text-accent text-base" : "bg-primary/20 text-primary"}`}>{c.avatar}</div>
                {c.online && !c.group && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    {pinned.has(c.id) && <Pin size={10} className="text-primary shrink-0" />}
                    <span className={`text-sm truncate ${c.unread > 0 ? "font-bold text-foreground" : "font-medium"}`}>{c.name}</span>
                  </span>
                  <span className={`text-[10px] shrink-0 ${c.unread > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>{c.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {c.group && <Hash size={10} className="text-muted-foreground shrink-0" />}
                  <p className={`text-[11px] truncate ${c.unread > 0 ? "text-foreground/80" : "text-muted-foreground"}`}>{c.lastMsg}</p>
                </div>
                {c.role && <span className="text-[9px] text-muted-foreground/60">{c.role} · {c.dept}</span>}
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {starred.has(c.id) && <Star size={10} className="text-warning fill-warning" />}
                {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-in zoom-in spin-in-12 duration-300">{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>

        {(isHR || isManager) && (
          <div className="p-3 border-t border-border">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-secondary/50"><div className="text-sm font-bold text-foreground">{contacts.length}</div><div className="text-[9px] text-muted-foreground">Active</div></div>
              <div className="text-center p-2 rounded-lg bg-secondary/50"><div className="text-sm font-bold text-primary">{totalUnread}</div><div className="text-[9px] text-muted-foreground">Unread</div></div>
              <div className="text-center p-2 rounded-lg bg-secondary/50"><div className="text-sm font-bold text-accent">{contacts.filter(c => c.group).length}</div><div className="text-[9px] text-muted-foreground">Groups</div></div>
            </div>
          </div>
        )}
      </div>

      {/* ───── Chat Window ───── */}
      <div className="flex-1 flex flex-col relative">
        {/* Header with action icons */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/80 backdrop-blur-sm relative">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${activeContact.group ? "bg-accent/20 text-accent text-sm" : "bg-primary/20 text-primary"}`}>{activeContact.avatar}</div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                {activeContact.name}
                {activeContact.group && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-bold uppercase">Group</span>}
                {muted.has(activeContact.id) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-bold">Muted</span>}
              </div>
              <div className={`text-[11px] flex items-center gap-1 ${activeContact.online ? "text-success" : "text-muted-foreground"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${activeContact.online ? "bg-success" : "bg-muted-foreground"}`} />
                {activeContact.online ? "Online" : (activeContact.lastSeen ? `Last seen ${new Date(activeContact.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Offline")}
                {activeContact.role && <span className="text-muted-foreground ml-1">· {activeContact.role}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label="Start Voice Call"><button onClick={() => setVoiceCall(true)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"><Phone size={15} className="text-muted-foreground" /></button></Tooltip>
            <Tooltip label="Start Video Call"><button onClick={() => setVideoCall(true)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"><Video size={15} className="text-muted-foreground" /></button></Tooltip>
            {isAdmin && <Tooltip label="View Employee Info"><button className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"><User size={15} className="text-muted-foreground" /></button></Tooltip>}
            <div className="w-px h-4 bg-border mx-1" />
            <Tooltip label="More Options"><button onClick={() => setShowMore(!showMore)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showMore ? "bg-secondary text-foreground" : "hover:bg-secondary text-muted-foreground"}`}><MoreVertical size={15} /></button></Tooltip>
          </div>
          {showMore && <MoreMenu onClose={() => setShowMore(false)} onAction={handleMenuAction} />}
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
          {loadingMessages && currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Syncing messages...</p>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-40">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">💬</div>
              <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" /><span className="text-[10px] text-muted-foreground font-medium px-3 py-1 rounded-full bg-secondary">Today</span><div className="flex-1 h-px bg-border" />
              </div>
              {currentMessages.map((m, idx) => (
            <div key={`${m.id}-${idx}`} className={`flex w-full ${m.me ? "justify-end" : "justify-start"} group mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {!m.me && <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[9px] font-bold mr-2 mt-auto mb-1 shrink-0">{m.from.substring(0, 2).toUpperCase()}</div>}
              <div className={`max-w-[75%] flex flex-col ${m.me ? "items-end" : "items-start"}`}>
                {!m.me && <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 block font-medium">{m.from}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm relative ${m.me ? "gradient-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/10" : "bg-card border border-border rounded-bl-md shadow-sm"}`}>
                  {m.type === "image" ? (
                    <img 
                      src={m.imageUrl || m.fileUrl} 
                      alt="Shared" 
                      className="max-h-48 rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => setPreviewImage(m.imageUrl || m.fileUrl!)} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Fallback to file UI if image fails
                        if (target.nextElementSibling) target.nextElementSibling.classList.remove('hidden');
                      }}
                    />
                  ) : m.type === "file" ? (
                    <div className="flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.me ? "bg-primary-foreground/20" : "bg-primary/20"}`}><FileText size={14} className={m.me ? "text-primary-foreground" : "text-primary"} /></div>
                      <div><span className="text-xs font-medium">{m.fileName || m.text}</span>{m.fileSize && <div className={`text-[9px] opacity-70 ${m.me ? "text-primary-foreground" : "text-muted-foreground"}`}>{m.fileSize}</div>}</div>
                      {(m.imageUrl || m.fileUrl) ? (
                        <a href={m.imageUrl || m.fileUrl} download={m.fileName || "document"} target="_blank" rel="noopener noreferrer" title="Download File" className={m.me ? "text-primary-foreground" : "text-primary"}>
                          <Download size={14} className="ml-2 opacity-80 hover:opacity-100 cursor-pointer" />
                        </a>
                      ) : (
                        <span title="File not available for download">
                          <Download size={14} className={`ml-2 opacity-40 cursor-not-allowed ${m.me ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${m.me ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${m.me ? "text-primary-foreground/70" : "text-muted-foreground/80"}`}>{m.time}</span>
                    {m.me && (m.read ? <CheckCheck size={12} className="text-primary-foreground/70" /> : <Check size={12} className="text-primary-foreground/70" />)}
                  </div>
                </div>
              </div>
            </div>
            ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Upload Preview */}
        {pendingFile && <UploadPreview file={pendingFile} onSend={sendFile} onCancel={() => setPendingFile(null)} />}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/50 relative">
          {(isHR || isManager) && (
            <div className="flex gap-2 mb-2">
              {(isManager ? ["📌 Assign Task", "📋 Standup Note", "🔄 Sprint Update"] : ["📋 Leave Update", "📅 Meeting Invite", "📢 Announcement"]).map((qr, i) => (
                <button key={i} onClick={() => setMsgInput(qr.split(" ").slice(1).join(" ") + ": ")} className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors border border-border/50">{qr}</button>
              ))}
            </div>
          )}
          {showEmoji && <EmojiPicker onSelect={(e: string) => setMsgInput(p => p + e)} onClose={() => setShowEmoji(false)} />}
          <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-2.5 border border-border/30 focus-within:border-primary/30 transition-colors">
            <Tooltip label="Attach File"><button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg hover:bg-muted transition-all hover:scale-110"><Paperclip size={16} className="text-muted-foreground" /></button></Tooltip>
            <Tooltip label="Send Image"><button onClick={() => imgRef.current?.click()} className="p-1.5 rounded-lg hover:bg-muted transition-all hover:scale-110"><ImageIcon size={16} className="text-muted-foreground" /></button></Tooltip>
            <Tooltip label="Emoji"><button onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 rounded-lg hover:bg-muted transition-all hover:scale-110"><Smile size={16} className={showEmoji ? "text-primary" : "text-muted-foreground"} /></button></Tooltip>
            <input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder={isHR ? "Type an HR message..." : isManager ? "Message your team..." : "Type a message..."} className="flex-1 bg-transparent text-sm focus:outline-none" onKeyDown={e => { if (e.key === "Enter") handleSend(); }} />
            <button onClick={handleSend} disabled={!msgInput.trim()} className="p-2 rounded-xl gradient-primary transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"><Send size={16} className="text-primary-foreground" /></button>
          </div>
        </div>
      </div>

      {/* ───── Modals ───── */}
      {voiceCall && <VoiceCallModal contact={activeContact} onEnd={() => setVoiceCall(false)} />}
      {videoCall && <VideoCallModal contact={activeContact} onEnd={() => setVideoCall(false)} />}
      {previewImage && <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
