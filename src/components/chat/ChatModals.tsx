import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, X, Download, User, BellOff, Archive, Trash2, Ban, Eye } from "lucide-react";

/* ───── Tooltip ───── */
export function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-foreground text-background px-2 py-1 rounded-md opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </div>
  );
}

/* ───── Emoji Picker ───── */
const emojiCategories: Record<string, string[]> = {
  "Recent": ["👍", "❤️", "😂", "🔥", "✅", "🎉", "💯", "🙏"],
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒"],
  "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏"],
  "Objects": ["💻", "📱", "📂", "📎", "📋", "📊", "📈", "📉", "📅", "🗓️", "📌", "📍", "✂️", "🔗", "💡", "🔔", "🔒", "🔑", "🛠️", "⚙️", "🧪", "🎯", "🚀", "⏰", "☕", "🍕"],
  "Symbols": ["✅", "❌", "⚠️", "❓", "❗", "💯", "🔥", "⭐", "💫", "✨", "🎉", "🎊", "💪", "🏆", "🥇", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "♻️"],
};

export function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState("Recent");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-14 left-0 w-[320px] bg-card border border-border rounded-2xl shadow-2xl z-50 animate-fade-up overflow-hidden">
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {Object.keys(emojiCategories).map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${cat === c ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[200px] overflow-y-auto">
        {(emojiCategories[cat] || []).map((e, i) => (
          <button key={i} onClick={() => onSelect(e)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-secondary rounded-lg transition-colors hover:scale-125">{e}</button>
        ))}
      </div>
    </div>
  );
}

/* ───── Image Preview Modal ───── */
export function ImagePreviewModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] animate-fade-up" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"><X size={16} /></button>
        <img src={src} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
      </div>
    </div>
  );
}

/* ───── Upload Preview ───── */
export function UploadPreview({ file, onSend, onCancel }: { file: File; onSend: () => void; onCancel: () => void }) {
  const isImage = file.type.startsWith("image/");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (isImage) { const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }
  }, [file, isImage]);
  const sizeStr = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="absolute bottom-20 left-4 right-4 bg-card border border-border rounded-2xl p-4 shadow-2xl z-30 animate-fade-up">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-muted-foreground font-medium">Upload Preview</span>
        <button onClick={onCancel} className="p-1 hover:bg-secondary rounded-lg"><X size={14} className="text-muted-foreground" /></button>
      </div>
      {isImage && preview ? (
        <img src={preview} alt="Preview" className="max-h-40 rounded-xl mb-3 object-contain" />
      ) : (
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Download size={18} className="text-primary" /></div>
          <div><div className="text-sm font-medium truncate max-w-[200px]">{file.name}</div><div className="text-[10px] text-muted-foreground">{sizeStr}</div></div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Cancel</button>
        <button onClick={onSend} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:scale-[1.02] transition-transform">Send</button>
      </div>
    </div>
  );
}

/* ───── Voice Call Modal ───── */
export function VoiceCallModal({ contact, onEnd }: { contact: { name: string; avatar: string }; onEnd: () => void }) {
  const [status, setStatus] = useState<"calling" | "connected">("calling");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => { streamRef.current = s; }).catch(() => {});
    const t = setTimeout(() => setStatus("connected"), 2500);
    return () => { clearTimeout(t); streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, [status]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
      <div className="relative z-10 w-[380px] rounded-3xl overflow-hidden bg-gradient-to-b from-primary/20 to-card border border-border p-8 text-center animate-fade-up shadow-2xl">
        <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${status === "calling" ? "bg-primary/30 text-primary animate-pulse" : "bg-success/20 text-success"}`}>
          {contact.avatar.length > 2 ? contact.avatar : <span>{contact.avatar}</span>}
        </div>
        <h3 className="font-heading font-bold text-xl mb-1">{contact.name}</h3>
        <p className={`text-sm mb-6 ${status === "calling" ? "text-muted-foreground animate-pulse" : "text-success"}`}>
          {status === "calling" ? "Calling..." : fmt(seconds)}
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setMuted(!muted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${muted ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"}`}>
            {muted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <button onClick={onEnd} className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform">
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Video Call Modal ───── */
export function VideoCallModal({ contact, onEnd }: { contact: { name: string; avatar: string }; onEnd: () => void }) {
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const localRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
      streamRef.current = s;
      if (localRef.current) localRef.current.srcObject = s;
    }).catch(() => {});
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { clearInterval(i); streamRef.current?.getTracks().forEach(t => t.stop()); screenRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = camOff; });
    setCamOff(!camOff);
  };
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };
  const toggleScreen = async () => {
    if (sharing) { screenRef.current?.getTracks().forEach(t => t.stop()); setSharing(false); return; }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current = s;
      if (localRef.current) localRef.current.srcObject = s;
      setSharing(true);
      s.getVideoTracks()[0].onended = () => { setSharing(false); if (localRef.current && streamRef.current) localRef.current.srcObject = streamRef.current; };
    } catch (e) { console.error("Screen sharing failed", e); }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Remote video placeholder */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-card to-background relative">
        <div className="text-center">
          <div className="w-28 h-28 rounded-full mx-auto mb-4 bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">{contact.avatar}</div>
          <h3 className="font-heading font-bold text-2xl">{contact.name}</h3>
          <p className="text-success text-sm mt-1">{fmt(seconds)}</p>
        </div>
        {/* Local preview */}
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-2xl overflow-hidden border-2 border-border shadow-2xl bg-card">
          <video ref={localRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camOff ? "hidden" : ""}`} />
          {camOff && <div className="w-full h-full flex items-center justify-center bg-secondary"><VideoOff size={24} className="text-muted-foreground" /></div>}
        </div>
      </div>
      {/* Controls bar */}
      <div className="flex justify-center gap-3 p-6 bg-card/80 backdrop-blur-xl border-t border-border">
        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${muted ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"}`}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${camOff ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"}`}>
          {camOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        <button onClick={toggleScreen} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${sharing ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
          {sharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button onClick={onEnd} className="w-12 h-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

/* ───── More Options Menu ───── */
export function MoreMenu({ onClose, onAction }: { onClose: () => void; onAction: (a: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const items = [
    { icon: Eye, label: "View Profile", key: "profile" },
    { icon: BellOff, label: "Mute Notifications", key: "mute" },
    { icon: Archive, label: "Archive Chat", key: "archive" },
    { icon: Trash2, label: "Clear Chat", key: "clear" },
    { icon: Ban, label: "Block User", key: "block" },
  ];

  return (
    <div ref={ref} className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-2xl z-50 py-1 animate-fade-up">
      {items.map(it => (
        <button key={it.key} onClick={() => { onAction(it.key); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-secondary ${it.key === "block" ? "text-destructive" : "text-foreground"}`}>
          <it.icon size={15} className={it.key === "block" ? "text-destructive" : "text-muted-foreground"} />
          {it.label}
        </button>
      ))}
    </div>
  );
}
