import React, { useState, useEffect } from "react";
import API_BASE from "./lib/api";
import {
  Activity,
  Users,
  CheckCircle,
  Clock,
  Lock,
  Plus,
  Edit,
  Trash2,
  Layers,
  ShieldAlert,
  Search,
  Building,
  Briefcase,
  Filter,
  Database,
  Inbox,
  TrendingUp,
  LogOut,
  Key,
  FileText,
  Mail,
  User,
  Tag,
  AlertTriangle,
  Settings,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Trash,
  Ticket,
  Upload,
  Download,
  Megaphone
} from "lucide-react";

import {
  User as UserType,
  UserRole,
  Ticket as TicketType,
  Department,
  TicketCategory,
  SubDepartment,
  Keyword,
  KeywordSuggestion,
  Invitation,
  AuditLog,
  Client,
  TicketStatus,
  TicketPriority,
  SupportLevel,
  DepartmentSuggestions,
  DepartmentBulkUploadResult,
  PAGES,
  metric
} from "./types";

import ClientManagement from "./components/ClientManagement";
import TicketDetail from "./components/TicketDetail";
import { TicketForm } from "./components/TicketForm";
import { Profile } from "./components/profile";
import { UserDirectory } from "./components/userDirectory";
import { InvitationComponent } from "./components/Invitation";
import { Dashboard } from "./components/Dashboard";
import { AdminRequests } from "./components/AdminRequests";
import TicketsTable from "./components/TicketsTable"
import ManagerDashboard from "./components/ManagerDashboard"
import GlobalAdminTicketSearch from "./components/GlobalAdminTicketSearch"
import AgentTicketSearch from "./components/AgentTicketSearch"
import HODTicketSearch from "./components/HODTicketSearch"
import CXOTicketSearch from "./components/CXOTicketSearch"
import AgentDashboard from "./components/AgentDashboardmock";
import DepartmentDashboard from "./components/HODDashboardmock";
import CXODashboardMock from "./components/CXODashboardmock";
import { CXODashboard } from "./components/CxoDashboard";
import { ConfirmDialog } from "./components/ConfirmDialog";
import logo from "../assets/logo.jpg"

export const SanghviLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="88" height="88" rx="20" stroke="#E21D24" strokeWidth="12" fill="none" />
    <path 
      d="M50 20 C64 32, 57 44, 50 48 C43 52, 36 64, 50 80 C36 68, 43 56, 50 52 C57 48, 64 36, 50 20 Z" 
      fill="#E21D24" 
    />
  </svg>
);


// ====================== AUTH SHELL (public / unauthenticated frame) ======================
// Shared "front door" layout for login, signup, forgot-password and invite-accept.
// Left panel sells the product to whoever lands here — requester, agent, HOD or CXO.
// Right panel hosts the actual form for whichever step the visitor is on.
const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full flex bg-white font-sans">
    <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative flex-col justify-between bg-[#111214] text-white px-12 py-11 overflow-hidden">
      {/* faint grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(225,53,42,0.25) 0%, rgba(225,53,42,0) 70%)" }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <img src={logo} className="w-8 h-8" />
        <span className="text-[11px] font-mono font-semibold tracking-[0.28em] text-slate-400 uppercase">
          Sanghvi Group
        </span>
      </div>

      <div className="relative z-10">
        
        <h1 className="font-display text-[2.65rem] leading-[1.08] font-semibold text-white mb-5">
          Every ticket
          <br />
          has a <span className="text-red-500">pulse.</span>
        </h1>
        

        <svg viewBox="0 0 380 56" className="w-full max-w-sm h-12 mb-9" fill="none" aria-hidden="true">
          <path
            d="M0 30 H108 L128 8 L150 52 L172 16 L188 30 H380"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={420}
            style={{ strokeDasharray: 420, animation: "pulse-draw 2.4s ease-out forwards" }}
          />
          <circle cx="150" cy="52" r="3.5" fill="#ef4444" style={{ animation: "pulse-dot 1.8s ease-in-out infinite 1.2s" }} />
        </svg>

        
      </div>

      <div className="relative z-10 flex items-center gap-2 text-[11px] font-mono text-slate-500">
      </div>
    </div>

    <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 bg-white">
      <div className="w-full max-w-sm">
        <div className="lg:hidden flex items-center gap-2.5 mb-9">
          <img src={logo} alt="logo" className="w-12 h-12" />
          <span className="text-xs font-mono font-semibold tracking-[0.22em] text-slate-500 uppercase">
            Customer Pulse
          </span>
        </div>
        {children}
      </div>
    </div>
  </div>
);

// ====================== AUTH SHELL — DARK / SCHEMATIC (login + forgot-password) ======================
// Industrial, dark "engineering schematic" front door used specifically for the
// sign-in and forgot-password screens. `children` renders inside the glass card
// on the right; the copy column, backdrop and request-lifecycle rail are fixed.
const AuthShellDark = ({ children }: { children: React.ReactNode }) => (
  <div className="cp-auth-dark">
    <style>{`
      .cp-auth-dark{
        --black:#08090a;
        --grey-1:#101113;
        --grey-2:#1a1c1f;
        --silver:#b9bcc3;
        --silver-dim:#6f7178;
        --white:#f2f3f5;
        --red:#e11c2b;
        --red-2:#9c0e1a;
        --red-glow:rgba(225,28,43,0.55);
        position:relative;
        min-height:100vh;
        width:100%;
        overflow-x:hidden;
        background:var(--black);
        color:var(--white);
        font-family:'Inter',sans-serif;
      }
      .cp-auth-dark *{ box-sizing:border-box; }
      .cp-auth-dark .backdrop{
        position:fixed; inset:0; z-index:0;
        background:
          radial-gradient(1200px 700px at 78% 15%, rgba(225,28,43,0.10), transparent 60%),
          radial-gradient(900px 600px at 10% 90%, rgba(255,255,255,0.03), transparent 60%),
          linear-gradient(160deg, var(--grey-2) 0%, var(--black) 65%);
      }
      .cp-auth-dark .grid-overlay{
        position:fixed; inset:0; z-index:0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size:56px 56px;
        mask-image:radial-gradient(ellipse 90% 70% at 60% 40%, black 30%, transparent 78%);
      }
      .cp-auth-dark .scanline{
        position:fixed; left:0; right:0; height:180px; z-index:1;
        background:linear-gradient(rgba(255,255,255,0.045), transparent);
        animation:cp-scan 9s linear infinite;
        pointer-events:none;
      }
      @keyframes cp-scan{ 0%{ top:-180px; } 100%{ top:110vh; } }
      .cp-auth-dark .schematic{
        position:fixed; top:0; right:0; height:100vh; width:62vw; max-width:980px;
        z-index:0; opacity:0.9; pointer-events:none;
      }
      .cp-auth-dark .schematic svg{ width:100%; height:100%; }
      .cp-auth-dark .node{ animation:cp-pulse 3.2s ease-in-out infinite; }
      @keyframes cp-pulse{ 0%,100%{ opacity:0.35; } 50%{ opacity:1; } }
      .cp-auth-dark .turbine-blades{ transform-origin:698px 168px; animation:cp-spin 14s linear infinite; }
      @keyframes cp-spin{ to{ transform:rotate(360deg); } }
      @media (prefers-reduced-motion:reduce){
        .cp-auth-dark .scanline, .cp-auth-dark .node, .cp-auth-dark .turbine-blades{ animation:none; }
      }

      .cp-auth-dark .shell{ position:relative; z-index:2; min-height:100vh; display:flex; flex-direction:column; padding:40px 6vw 48px; }
      .cp-auth-dark .topbar{ display:flex; align-items:center; justify-content:space-between; }
      .cp-auth-dark .brand{ display:flex; align-items:center; gap:13px; }
      .cp-auth-dark .mark{
        width:36px; height:36px; border:1.5px solid var(--red);
        display:flex; align-items:center; justify-content:center;
        font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:17px;
        color:var(--red); position:relative;
      }
      .cp-auth-dark .mark::after{ content:""; position:absolute; inset:-5px; border:1px solid rgba(225,28,43,0.25); }
      .cp-auth-dark .brand-name{ font-family:'Space Grotesk',sans-serif; font-size:14.5px; font-weight:600; letter-spacing:0.06em; color:var(--white); }
      .cp-auth-dark .brand-sub{ font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.18em; color:var(--silver-dim); text-transform:uppercase; }
      .cp-auth-dark .pulse-brand{ text-align:right; }
      .cp-auth-dark .pulse-brand .name{ font-family:'Space Grotesk',sans-serif; font-size:14.5px; font-weight:600; letter-spacing:0.04em; }
      .cp-auth-dark .pulse-brand .name em{ color:var(--red); font-style:normal; }
      .cp-auth-dark .pulse-brand .tag{ font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.14em; color:var(--silver-dim); }

      .cp-auth-dark .main{ flex:1; display:flex; align-items:center; margin-top:2vh; gap:40px; flex-wrap:wrap; }
      .cp-auth-dark .copy-col{ flex:1; max-width:520px; padding-right:40px; min-width:280px; }
      .cp-auth-dark .eyebrow{
        font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.22em;
        color:var(--red); text-transform:uppercase; display:flex; align-items:center; gap:10px; margin-bottom:22px;
      }
      .cp-auth-dark .eyebrow::before{ content:""; width:26px; height:1px; background:var(--red); }
      .cp-auth-dark .headline{
        font-family:'Space Grotesk',sans-serif; font-size:clamp(28px, 3.2vw, 42px); font-weight:500;
        line-height:1.12; letter-spacing:-0.01em; color:var(--white); margin:0 0 20px;
      }
      .cp-auth-dark .headline span{ color:var(--red); }
      .cp-auth-dark .subcopy{ font-size:14.5px; line-height:1.65; color:var(--silver); max-width:420px; margin-bottom:0; }
      .cp-auth-dark .pulse-line{ width:220px; height:auto; display:block; margin:2px 0 22px; overflow:visible; }
      .cp-auth-dark .pulse-line path{
        stroke-dasharray:44 380; stroke-dashoffset:0;
        animation:cp-pulse-travel 2.6s linear infinite;
        filter:drop-shadow(0 0 4px rgba(225,28,43,0.65));
      }
      @keyframes cp-pulse-travel{ 0%{ stroke-dashoffset:424; } 100%{ stroke-dashoffset:0; } }

      .cp-auth-dark .card-col{ flex:none; width:400px; max-width:100%; }
      .cp-auth-dark .card{
        position:relative; background:rgba(20,21,24,0.65);
        backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px);
        border:1px solid rgba(255,255,255,0.09);
        padding:34px 32px 28px;
        box-shadow:0 40px 80px -30px rgba(0,0,0,0.75);
      }
      .cp-auth-dark .card::before{
        content:""; position:absolute; inset:0; padding:1px;
        background:linear-gradient(135deg, rgba(225,28,43,0.55), rgba(255,255,255,0.05) 40%, transparent 70%);
        -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite:xor; mask-composite:exclude;
        pointer-events:none;
      }
      .cp-auth-dark .corner{ position:absolute; width:14px; height:14px; border:1.5px solid rgba(225,28,43,0.7); }
      .cp-auth-dark .corner.tl{ top:-1px; left:-1px; border-right:none; border-bottom:none; }
      .cp-auth-dark .corner.br{ bottom:-1px; right:-1px; border-left:none; border-top:none; }
      .cp-auth-dark .card-eyebrow{
        font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.16em;
        color:var(--silver-dim); text-transform:uppercase; margin-bottom:8px;
      }
      .cp-auth-dark .card h1{ font-family:'Space Grotesk',sans-serif; font-size:21px; font-weight:600; margin:0 0 10px; color:var(--white); }
      .cp-auth-dark .card .card-sub{ font-size:12.5px; color:var(--silver); line-height:1.55; margin:0 0 22px; }

      .cp-auth-dark .field{ margin-bottom:18px; }
      .cp-auth-dark .field label{
        display:block; font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.12em;
        text-transform:uppercase; color:var(--silver-dim); margin-bottom:8px;
      }
      .cp-auth-dark .field input{
        width:100%; background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.12);
        padding:12px 13px; font-family:'Inter',sans-serif; font-size:14px; color:var(--white);
        outline:none; transition:border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .cp-auth-dark .field input::placeholder{ color:#5b5d63; }
      .cp-auth-dark .field input:focus{ border-color:var(--red); box-shadow:0 0 0 3px rgba(225,28,43,0.15); }
      .cp-auth-dark .field .hint{ font-size:11px; color:var(--silver-dim); margin-top:6px; }

      .cp-auth-dark .row-between{
        display:flex; justify-content:flex-end; align-items:center; margin:-6px 0 20px;
        font-family:'JetBrains Mono',monospace; font-size:10px;
      }
      .cp-auth-dark .row-between button.link-btn{
        background:none; border:none; cursor:pointer; padding:0; font-family:inherit; font-size:inherit;
        color:var(--silver); border-bottom:1px solid rgba(255,255,255,0.2);
      }
      .cp-auth-dark .row-between button.link-btn:hover{ color:var(--red); border-color:var(--red); }

      .cp-auth-dark .login-btn{
        width:100%; padding:14px; background:linear-gradient(120deg, var(--red), var(--red-2));
        color:#fff; border:none; font-family:'Space Grotesk',sans-serif; font-size:13.5px; font-weight:600;
        letter-spacing:0.1em; text-transform:uppercase; cursor:pointer;
        box-shadow:0 10px 30px -8px var(--red-glow);
        transition:filter 0.15s ease, transform 0.05s ease;
      }
      .cp-auth-dark .login-btn:hover{ filter:brightness(1.12); }
      .cp-auth-dark .login-btn:active{ transform:translateY(1px); }
      .cp-auth-dark .login-btn:disabled{ opacity:0.55; cursor:not-allowed; }

      .cp-auth-dark .status-row{
        display:flex; justify-content:space-between; align-items:center;
        margin-top:22px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.08);
        font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--silver-dim);
      }
      .cp-auth-dark .status-dot{
        display:inline-block; width:6px; height:6px; border-radius:50%;
        background:#3ecf6b; margin-right:6px; box-shadow:0 0 6px #3ecf6b;
      }

      .cp-auth-dark .alert-error{
        margin-bottom:16px; padding:10px 12px; background:rgba(225,28,43,0.1);
        border:1px solid rgba(225,28,43,0.35); color:#ffb4ba; font-size:12px;
        display:flex; align-items:center; gap:8px;
      }
      .cp-auth-dark .alert-success{
        margin-bottom:16px; padding:10px 12px; background:rgba(62,207,107,0.1);
        border:1px solid rgba(62,207,107,0.35); color:#8ff0af; font-size:12px;
      }

      .cp-auth-dark .back-link{ margin-top:18px; text-align:center; }
      .cp-auth-dark .back-link button{
        background:none; border:none; cursor:pointer;
        font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase;
        color:var(--silver); border-bottom:1px solid rgba(255,255,255,0.2); padding:0 0 2px;
      }
      .cp-auth-dark .back-link button:hover{ color:var(--red); border-color:var(--red); }
      .cp-auth-dark .back-link button:disabled{ opacity:0.5; cursor:not-allowed; }

      .cp-auth-dark .rail-wrap{ max-width:1180px; margin:56px auto 0; width:100%; }
      .cp-auth-dark .rail-label{
        font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase;
        color:var(--silver-dim); margin-bottom:18px;
      }
      .cp-auth-dark .rail{ position:relative; display:flex; justify-content:space-between; }
      .cp-auth-dark .rail::before{
        content:""; position:absolute; left:18px; right:18px; top:11px; height:1px;
        background:linear-gradient(90deg, var(--red), rgba(255,255,255,0.15));
      }
      .cp-auth-dark .rstep{ position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:10px; flex:1; }
      .cp-auth-dark .rstep .dot{
        width:22px; height:22px; border-radius:50%; background:var(--grey-1);
        border:1.5px solid var(--red); display:flex; align-items:center; justify-content:center;
      }
      .cp-auth-dark .rstep .dot svg{ width:11px; height:11px; }
      .cp-auth-dark .rstep .lbl{
        font-family:'JetBrains Mono',monospace; font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase;
        color:var(--silver-dim); text-align:center;
      }

      @media (max-width:980px){
        .cp-auth-dark .schematic{ opacity:0.35; width:100vw; }
        .cp-auth-dark .main{ flex-direction:column; align-items:stretch; gap:36px; }
        .cp-auth-dark .copy-col{ max-width:none; padding-right:0; }
        .cp-auth-dark .card-col{ width:100%; max-width:420px; margin:0 auto; }
      }
      @media (max-width:620px){
        .cp-auth-dark .topbar{ flex-direction:column; align-items:flex-start; gap:14px; }
        .cp-auth-dark .pulse-brand{ text-align:left; }
        .cp-auth-dark .rail{ flex-wrap:wrap; row-gap:22px; }
        .cp-auth-dark .rail::before{ display:none; }
        .cp-auth-dark .rstep{ flex:1 1 33%; }
      }
    `}</style>

    <div className="backdrop"></div>
    <div className="grid-overlay"></div>
    <div className="scanline"></div>

    

    <div className="shell">
      <div className="topbar">
        <div className="brand">
         
        <img src={logo} className="w-12 h-12" alt="logo" />
          <div>
            <div className="brand-name">SANGHVI MOVERS</div>
            <div className="brand-sub">Heavy Lift &amp; Logistics · Est. Engineering</div>
          </div>
        </div>
        <div className="pulse-brand">
          <div className="name">Customer <em>Pulse</em></div>
          <div className="tag">WE LISTEN. WE ACT.</div>
        </div>
      </div>

      <div className="main">
        <div className="copy-col">
          <div className="eyebrow">Service Portal</div>
          <h1 className="headline">Every ticket <span>has a pulse.</span></h1>

          <svg className="pulse-line" viewBox="0 0 420 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 23 H150 L165 23 L175 6 L188 40 L198 12 L208 30 L218 23 H420"
              stroke="#e11c2b" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
            />
          </svg>

          
        </div>

        <div className="card-col">{children}</div>
      </div>

      <div className="rail-wrap">
        <div className="rail-label">Request Lifecycle</div>
        <div className="rail">
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><path d="M4 21V5a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /></svg></div>
            <div className="lbl">Log</div>
          </div>
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></div>
            <div className="lbl">Track</div>
          </div>
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /></svg></div>
            <div className="lbl">Updates</div>
          </div>
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><path d="M4 4h16v12H8l-4 4Z" /></svg></div>
            <div className="lbl">Communicate</div>
          </div>
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><path d="M7 11v9H4v-9Z" /><path d="M7 11l3-8a2 2 0 0 1 4 1v5h4a2 2 0 0 1 2 2l-1.5 6a2 2 0 0 1-2 1.5H7" /></svg></div>
            <div className="lbl">Feedback</div>
          </div>
          <div className="rstep">
            <div className="dot"><svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8Z" /></svg></div>
            <div className="lbl">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Single sidebar navigation entry. Shows icon + label expanded, icon only
// (centered, with a hover tooltip via `title`) when the sidebar is
// collapsed.
const NavItem = ({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full text-left py-2.5 flex items-center cursor-pointer ${
      collapsed ? "px-0 justify-center" : "px-5 gap-3"
    } ${
      active
        ? "bg-slate-100 text-slate-900 border-l-4 border-slate-900 font-semibold"
        : "hover:bg-slate-50 hover:text-slate-900 text-slate-500 transition-colors"
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);

export default function App() {
  // Session State
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string>("");

  // Reusable confirmation dialog state (replaces native window.confirm popups
  // for destructive actions like deleting departments, sub-departments,
  // categories and keywords)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const openConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };
  const [company, setCompany] = useState<any>(null);

  // Auth Forms State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmployeeId, setSignupEmployeeId] = useState("");
  const [signupMode, setSignupMode] = useState(false);

  // Forgot Password State
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);

  // Accept Invite State
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteFullName, setInviteFullName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState("");

  const [inviteCategoryIds, setInviteCategoryIds] = useState<string[]>([]);
  const [inviteDeptCategories, setInviteDeptCategories] = useState<any[]>([]);

  // Navigation State
  const [currentView, setCurrentView] = useState<string>(PAGES.DASHBOARD);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });
  // NOTE(added): off-canvas nav drawer toggle for tablet/mobile widths
  // (< md). Desktop keeps using sidebarCollapsed (icon-only vs full width);
  // this is separate so opening the mobile drawer never touches the
  // persisted desktop preference.
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  // NOTE(added): the mobile drawer is always rendered full-width, so while
  // it's open, NavItems should always show their labels regardless of the
  // separate desktop-only icon-collapse preference.
  const navCollapsed = mobileNavOpen ? false : sidebarCollapsed;

  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
    } catch {
      // localStorage unavailable (e.g. private browsing) - collapse state
      // just won't persist across reloads, which is fine.
    }
  }, [sidebarCollapsed]);

  // NOTE(added): close the mobile drawer whenever the active view changes,
  // so tapping a nav item on a phone navigates AND dismisses the overlay.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentView]);

  // Data Lists State
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [allTicketsForMetrics, setAllTicketsForMetrics] = useState<TicketType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // suggestions data 
  const [deparmentSuggestions,setDepartmentSuggestion] = useState<DepartmentSuggestions[]>([])

  // Filtering / Search States for Queues
  const [ticketSearch, setTicketSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterSlaBreachedOnly, setFilterSlaBreachedOnly] = useState(false);

  // Add Department Dialog state
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDescription, setNewDeptDescription] = useState("");

  // Bulk Upload Departments Dialog state
  const [showBulkUploadDeptDialog, setShowBulkUploadDeptDialog] = useState(false);
  const [bulkDeptFile, setBulkDeptFile] = useState<File | null>(null);
  const [bulkDeptUploading, setBulkDeptUploading] = useState(false);
  const [bulkDeptResult, setBulkDeptResult] = useState<DepartmentBulkUploadResult | null>(null);

  // Department Config state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [deptCategoriesList, setDeptCategoriesList] = useState<TicketCategory[]>([]);
  const [deptKeywordsList, setDeptKeywordsList] = useState<Keyword[]>([]);
  const [deptSuggestionsList, setDeptSuggestionsList] = useState<KeywordSuggestion[]>([]);

  // Sub-Department Config state (optional grouping within a department)
  const [deptSubDepartmentsList, setDeptSubDepartmentsList] = useState<SubDepartment[]>([]);
  const [newSubDeptName, setNewSubDeptName] = useState("");
  const [newSubDeptDescription, setNewSubDeptDescription] = useState("");

  // Category and Keyword Creator states
  const [newCatName, setNewCatName] = useState("");
  const [newCatSla, setNewCatSla] = useState("1440");
  // Optional - leave "" to make the category department-wide
  const [newCatSubDepartmentId, setNewCatSubDepartmentId] = useState("");
  // Admin-only flags: never shown/known outside GLOBAL_ADMIN / HOD
  const [newCatIsWorkStopping, setNewCatIsWorkStopping] = useState(false);
  const [newCatIsSafetyViolation, setNewCatIsSafetyViolation] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSla, setEditCatSla] = useState("1440");
  const [editCatSubDepartmentId, setEditCatSubDepartmentId] = useState("");
  const [editCatIsWorkStopping, setEditCatIsWorkStopping] = useState(false);
  const [editCatIsSafetyViolation, setEditCatIsSafetyViolation] = useState(false);
  const [newCatLevel, setNewCatLevel] = useState<SupportLevel>(SupportLevel.L1);

  const [newKwName, setNewKwName] = useState("");
  const [newKwSynonyms, setNewKwSynonyms] = useState("");

  // Invite Form State
  
  const [inviteDeptId, setInviteDeptId] = useState("");

  // General Notification state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Developer Tool stats
  const [devLogs, setDevLogs] = useState("");
  const [metric,setMetric] = useState<metric | null>(null)

  // Mytickets
  const [mytickets,setMytickets] = useState<TicketType[]>([])
  const [assigned,setAssigned] = useState<TicketType[]>([])
  const [breached,setBreached] = useState<TicketType[]>([])
  const [resovled,setResolved] = useState<TicketType[]>([])
  const [onhold,setOnhold] = useState<TicketType[]>([])

  // Status filter shared by the My Tickets / Personal Workload / SLA Breached pages
  const [personalStatusFilter, setPersonalStatusFilter] = useState("");

  // Role based check short hands
  const isAdmin = user ? ["GLOBAL_ADMIN"].includes(user.role) : false;
  const isGlobalAdmin = user ? user.role === "GLOBAL_ADMIN" : false;
  const isManager = user ? ["HOD"].includes(user.role) : false;
  const isCxo = user ? ["CXO"].includes(user.role) : false
  const isAgent = user ? ["AGENT"].includes(user.role) : false

  // Initialize and check token
  useEffect(() => {
    // Check if invitation token in URL query
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token");
    if (tok) {
      setInviteToken(tok);
    }

    const savedToken = localStorage.getItem("service_now_token");
    const savedUser = localStorage.getItem("service_now_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Load screen data based on view
  useEffect(() => {
    if (!token) return;
    if (currentView === PAGES.DASHBOARD) {
      fetchMetrics()
    } else if (currentView === PAGES.USER_DIRECTORY) {
      fetchUsers();
      fetchDepartments();
    } else if (currentView === PAGES.PENDING_INVITES) {
      fetchInvitations();
      fetchDepartments();
    } else if (currentView === PAGES.DEPARTMENTS) {
      fetchDepartments();
    } else if (currentView === PAGES.CLIENTS) {
      fetchClients()
    } else if (currentView === PAGES.AUDIT_LOGS){
      fetchAuditLogs();
    } else if (currentView === PAGES.NEW_TICKET) {
      fetchDepartments();
      fetchClients();
    } else if (currentView == PAGES.MY_TICKETS){
      fetchMytickets()
    } else if (currentView == PAGES.ASSINGED_TICKETS){
      fetchAssignedTickets()
    } else if (currentView == PAGES.BREACHED_TICKETS){
      fetchbreachedTickets()
    }else if(currentView == PAGES.RESOLVED_TICKETS){
      fetchResolvedTickets()
    }else if(currentView == PAGES.ON_HOLD){
      fetchOnholdTickets()
    }

  }, [currentView, filterDept, filterStatus, filterPriority, filterAssignee, filterSlaBreachedOnly, token]);

  // Load department categories for invitations
  useEffect(() => {
    if (!token || !inviteDeptId) {
      setInviteDeptCategories([]);
      setInviteCategoryIds([]);
      return;
    }
    fetch(`${API_BASE}/departments/${inviteDeptId}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setInviteDeptCategories(data);
        setInviteCategoryIds([]);
      })
      .catch(() => {
        setInviteDeptCategories([]);
        setInviteCategoryIds([]);
      });
  }, [inviteDeptId, token]);


  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {}

  };

  const fetchMytickets = async () => {
     try {
      const res = await fetch(`${API_BASE}/tickets/mytickets/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMytickets(data)
      }
    } catch (err) {}

  }

  const fetchAssignedTickets = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/tickets/assigned/${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setAssigned(data);
      }
    } catch (err) {}
  };
  const fetchOnholdTickets = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/tickets/onhold/${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setOnhold(data);
      }
    } catch (err) {}
  };
  const fetchResolvedTickets = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/tickets/resolved/${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setResolved(data);
      }
    } catch (err) {}
  };

  const fetchbreachedTickets = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/tickets/breached/${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setBreached(data);
      }
    } catch (err) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {}
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`${API_BASE}/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {}
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.data);
      }
    } catch (err) {}
  };

      const fetchMetrics = async () => {
        try {
          const res = await fetch(
            `${API_BASE}/users/metric/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setMetric(data.data);
          }
        } catch (err) {}
      };


  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("service_now_token", data.token);
      localStorage.setItem("service_now_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCurrentView(PAGES.DASHBOARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          fullName: signupFullName,
          employeeId: signupEmployeeId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      setSuccess(data.message || "Registration submitted. An admin will review your account before you can sign in.");
      setSignupMode(false);
      setSignupEmail("");
      setSignupPassword("");
      setSignupFullName("");
      setSignupEmployeeId("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 1: request an OTP by email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send verification code");

      setSuccess(data.message || "If an account exists for this email, a verification code has been sent.");
      setForgotStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 2: verify the OTP the user received by email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired code");

      setForgotOtpVerified(true);
      setSuccess("Code verified. Choose a new password.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 3: set the new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, password: forgotNewPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password");

      setSuccess(data.message || "Password reset successfully. You can now log in.");
      // Reset all forgot-password state and drop back to the login form
      // pre-filled with the email so the user can sign straight in.
      setLoginEmail(forgotEmail);
      setLoginPassword("");
      setForgotMode(false);
      setForgotStep("request");
      setForgotOtpVerified(false);
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exitForgotPasswordFlow = () => {
    setForgotMode(false);
    setForgotStep("request");
    setForgotOtpVerified(false);
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setError("");
    setSuccess("");
  };

  // Accept Invite Handler
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (invitePassword !== invitePasswordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          fullName: inviteFullName,
          password: invitePassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invitation");

      localStorage.setItem("service_now_token", data.token);
      localStorage.setItem("service_now_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setInviteToken(null);
      // Strip the ?token=... invite link from the address bar now that it's
      // been consumed, so it isn't left sitting in history/refresh/bookmarks.
      window.history.replaceState({}, "", window.location.pathname);
      setCurrentView(PAGES.DASHBOARD);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("service_now_token");
    localStorage.removeItem("service_now_user");
    setUser(null);
    setToken("");
    setCompany(null);
    setCurrentView(PAGES.DASHBOARD);
  };

  // Global session-expiry guard: wraps window.fetch so every API call in the
  // app (this component's own calls, plus every child that falls back to
  // window.fetch via its optional `apiFetch` prop) is watched for an
  // expired/invalid session, or an account that just got blocked while the
  // person was still logged in. requireAuth (backend/src/middleware/auth.ts)
  // tags an expired/invalid token with `code: "SESSION_EXPIRED"`, and a
  // now-blocked account with `code: "ACCOUNT_BLOCKED"` - both mean the
  // current session is no longer valid, so both force an immediate logout
  // (the blocked user is kicked back to the login screen and can't log back
  // in until an admin unblocks them - see auth.service.ts's login()). Other
  // 401s (bad login credentials, no token sent) use different codes and are
  // left alone so they can show their own inline error instead of logging
  // anyone out.
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        try {
          const body = await response.clone().json();
          if (body?.code === "SESSION_EXPIRED") {
            handleLogout();
          } else if (body?.code === "ACCOUNT_BLOCKED") {
            handleLogout();
            setError("Your account has been blocked by an administrator. Please contact your admin for access.");
          }
        } catch {
          // Non-JSON 401 body - nothing to key off, leave it to the caller.
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  

  // Action: Fetch Department specifics (Categories & Keywords)
  const handleSelectDeptConfig = async (deptId: string) => {
    setSelectedDeptId(deptId);
    try {
      // 1. Fetch categories
      const catRes = await fetch(`${API_BASE}/departments/${deptId}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setDeptCategoriesList(catData);
      }

      // 1b. Fetch sub-departments (optional grouping within the department)
      const subDeptRes = await fetch(`${API_BASE}/departments/${deptId}/subdepartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (subDeptRes.ok) {
        setDeptSubDepartmentsList(await subDeptRes.json());
      }

      // 2. Fetch keywords
      const kwRes = await fetch(`${API_BASE}/keywords?departmentId=${deptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (kwRes.ok) {
        const kwData = await kwRes.json();
        setDeptKeywordsList(kwData);
      }

      // 3. Fetch aggregated keyword suggestions
      const sugRes = await fetch(`${API_BASE}/keywords/departments/${deptId}/suggestions?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sugRes.ok) {
        const sugData = await sugRes.json();
        setDeptSuggestionsList(sugData);
      }
    } catch (err) {}
  };

  // Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDeptName,
          description: newDeptDescription || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create department");

      setNewDeptName("");
      setNewDeptDescription("");
      setShowAddDeptDialog(false);
      fetchDepartments();
      setSuccess("Department created.");
    } catch (err: any) {
      setError(err.message || "Failed to create department");
    }
  };

  // Download the .xlsx template admins fill in for bulk department upload
  const handleDownloadDeptTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments/bulk-upload/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "department_bulk_upload_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to download template");
    }
  };

  // Bulk Upload Departments - sends the selected .xlsx/.xls to the backend
  // and shows a per-row created/skipped/error summary.
  const handleBulkUploadDepartments = async () => {
    if (!bulkDeptFile) return;
    setBulkDeptUploading(true);
    setBulkDeptResult(null);
    try {
      const formData = new FormData();
      formData.append("file", bulkDeptFile);
      const res = await fetch(`${API_BASE}/departments/bulk-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload departments");

      setBulkDeptResult(data);
      fetchDepartments();
      setSuccess(`Bulk upload complete: ${data.createdCount} department(s) created.`);
    } catch (err: any) {
      setError(err.message || "Failed to upload departments");
    } finally {
      setBulkDeptUploading(false);
    }
  };

  // Create Sub-Department (optional grouping within the selected department)
  const handleCreateSubDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubDeptName || !selectedDeptId) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${selectedDeptId}/subdepartments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSubDeptName,
          description: newSubDeptDescription || undefined
        })
      });
      if (res.ok) {
        setNewSubDeptName("");
        setNewSubDeptDescription("");
        handleSelectDeptConfig(selectedDeptId);
        setSuccess("Sub-department added to Department.");
      }
    } catch (err) {}
  };

  // Delete Sub-Department - categories mapped to it fall back to being
  // department-wide rather than being deleted (handled by the backend).
  const handleDeleteSubDepartment = async (subDeptId: string) => {
    openConfirmDialog(
      "Delete Sub-Department",
      "Delete this sub-department? Categories mapped to it will fall back to being department-wide. This cannot be undone.",
      async () => {
        closeConfirmDialog();
        try {
          const res = await fetch(`${API_BASE}/subdepartments/${subDeptId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            handleSelectDeptConfig(selectedDeptId);
            setSuccess("Sub-department deleted.");
          }
        } catch (err) {}
      }
    );
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${selectedDeptId}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCatName,
          defaultSlaMinutes: Number(newCatSla),
          minSupportLevel: newCatLevel,
          subDepartmentId: newCatSubDepartmentId || undefined,
          isWorkStopping: newCatIsWorkStopping,
          isSafetyViolation: newCatIsSafetyViolation
        })
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatSubDepartmentId("");
        setNewCatIsWorkStopping(false);
        setNewCatIsSafetyViolation(false);
        handleSelectDeptConfig(selectedDeptId);
        setSuccess("Category added to Department.");
      }
    } catch (err) {}
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    openConfirmDialog(
      "Delete Category",
      "Delete this category? This cannot be undone.",
      async () => {
        closeConfirmDialog();
        try {
          const res = await fetch(`${API_BASE}/categories/${catId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            handleSelectDeptConfig(selectedDeptId);
            setSuccess("Category deleted.");
          }
        } catch (err) {}
      }
    );
  };

  // Start editing a category
  const handleStartEditCategory = (c: TicketCategory) => {
    setEditingCategoryId(c.id);
    setEditCatName(c.name);
    setEditCatSla(String(c.defaultSlaMinutes));
    setEditCatSubDepartmentId(c.subDepartmentId || "");
    setEditCatIsWorkStopping(!!c.isWorkStopping);
    setEditCatIsSafetyViolation(!!c.isSafetyViolation);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
  };

  // Update Category (name, SLA deadline)
  const handleUpdateCategory = async (catId: string) => {
    if (!editCatName) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editCatName,
          defaultSlaMinutes: Number(editCatSla),
          subDepartmentId: editCatSubDepartmentId || null,
          isWorkStopping: editCatIsWorkStopping,
          isSafetyViolation: editCatIsSafetyViolation,
        })
      });
      if (res.ok) {
        setEditingCategoryId(null);
        handleSelectDeptConfig(selectedDeptId);
        setSuccess("Category updated.");
      }
    } catch (err) {}
  };

  

  // Create Keyword
  const handleCreateKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
 
    try {

      let synonyms = newKwSynonyms.split(",")
      const res = await fetch(`${API_BASE}/keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: selectedDeptId,
          name: newKwName,
          synonyms: synonyms 
        })
      });
      if (res.ok) {
        setNewKwName("");
        setNewKwSynonyms("");
        handleSelectDeptConfig(selectedDeptId);
        setSuccess("Knowledge Base Keyword defined.");
      }
    } catch (err) {}
  };

  // Delete Keyword
  const handleDeleteKeyword = async (kwId: string) => {
    openConfirmDialog(
      "Remove Keyword",
      "Remove this keyword? This cannot be undone.",
      async () => {
        closeConfirmDialog();
        try {
          const res = await fetch(`${API_BASE}/keywords/${kwId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            handleSelectDeptConfig(selectedDeptId);
            setSuccess("Keyword removed.");
          }
        } catch (err) {}
      }
    );
  };

  const handleDeleteDepartment= async (kwId: string) => {
    openConfirmDialog(
      "Delete Department",
      "Delete this department? This will also remove its sub-departments, categories, and keywords. This cannot be undone.",
      async () => {
        closeConfirmDialog();
        try {
          const res = await fetch(`${API_BASE}/departments/${kwId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setDepartments(departments.filter(department => department.id != kwId))
            handleSelectDeptConfig("");
            setSuccess("department removed.");
          }
        } catch (err) {}
      }
    );
  };



  // Promote Suggestion
  const handlePromoteSuggestion = async (sugId: string, term: string) => {
    const synonymsInput = prompt(`Promote suggestion '${term}' to Real Keyword. Add synonyms separated by commas if any:`, "");
    if (synonymsInput === null) return; // cancelled
    try {
      const res = await fetch(`${API_BASE}/keywords/suggestions/${sugId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: term, synonyms: synonymsInput.split(",") })
      });
      if (res.ok) {
        handleSelectDeptConfig(selectedDeptId);
        setSuccess(`Keyword suggested '${term}' promoted to active index.`);
      }
    } catch (err) {}
  };

  // Reject Suggestion
  const handleRejectSuggestion = async (sugId: string) => {
    try {
      const res = await fetch(`${API_BASE}/keywords/suggestions/${sugId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        handleSelectDeptConfig(selectedDeptId);
        setSuccess("Suggestion dismissed.");
      }
    } catch (err) {}
  };

  // ====================== PUBLIC UNAUTHENTICATED SCENE ======================

  if (!token) {
    // 1. Accept Invitation Form
    if (inviteToken) {
      return (
        <AuthShell>
          <span className="inline-flex p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl mb-4">
            <Mail size={20} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">Accept invitation</h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-7">Set up your profile to join Customer Pulse.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 rounded-lg">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
           

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E1352A] hover:bg-[#c62a20] text-white font-medium text-sm py-2.5 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              {loading ? "Activating profile…" : "Activate account & sign in"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setInviteToken(null)}
              className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </AuthShell>
      );
    }

    // 2. Forgot Password (OTP request -> verify + reset)
    if (forgotMode) {
      return (
        <AuthShellDark>
          <div className="card">
            <div className="corner tl"></div>
            <div className="corner br"></div>
            <div className="card-eyebrow">Account Recovery</div>
            <h1>Reset password</h1>
            <p className="card-sub">
              {forgotStep === "request"
                ? "Enter your account email and we'll send you a verification code."
                : forgotOtpVerified
                ? "Choose a new password for your account."
                : "Enter the 6-digit code we emailed you."}
            </p>

            {error && (
              <div className="alert-error">
                <ShieldAlert size={14} />
                {error}
              </div>
            )}

            {success && <div className="alert-success">{success}</div>}

            {forgotStep === "request" && (
              <form onSubmit={handleRequestOtp}>
                <div className="field">
                  <label htmlFor="cp-forgot-email">Corporate email</label>
                  <input
                    id="cp-forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? "Sending code…" : "Send verification code"}
                </button>
              </form>
            )}

            {forgotStep === "verify" && !forgotOtpVerified && (
              <form onSubmit={handleVerifyOtp}>
                <div className="field">
                  <label htmlFor="cp-forgot-otp">Verification code</label>
                  <input
                    id="cp-forgot-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    style={{ letterSpacing: "0.3em", textAlign: "center", fontWeight: 600 }}
                    required
                  />
                  <p className="hint">Sent to {forgotEmail}. Expires in 10 minutes.</p>
                </div>
                <button type="submit" disabled={loading || forgotOtp.length !== 6} className="login-btn">
                  {loading ? "Verifying…" : "Verify code"}
                </button>
                <div className="back-link">
                  <button type="button" onClick={handleRequestOtp} disabled={loading}>
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {forgotStep === "verify" && forgotOtpVerified && (
              <form onSubmit={handleResetPassword}>
                <div className="field">
                  <label htmlFor="cp-forgot-newpass">New password</label>
                  <input
                    id="cp-forgot-newpass"
                    type="password"
                    placeholder="Choose a new password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-forgot-confirmpass">Confirm new password</label>
                  <input
                    id="cp-forgot-confirmpass"
                    type="password"
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? "Resetting…" : "Reset password"}
                </button>
              </form>
            )}

            <div className="back-link">
              <button onClick={exitForgotPasswordFlow}>Back to sign in</button>
            </div>
          </div>
        </AuthShellDark>
      );
    }

    // 3. Main Login / Public Requester Signup
      return (
      <AuthShellDark>
        <div className="card">
          <div className="corner tl"></div>
          <div className="corner br"></div>
          <div className="card-eyebrow">Authenticated Access</div>
          <h1>{signupMode ? "Create your account" : "Sign in to your account"}</h1>
          <p className="card-sub">
            {signupMode
              ? "Self-register as a requester to raise, view, and track tickets."
              : "For requesters, agents, and leadership alike."}
          </p>

          {error && (
            <div className="alert-error">
              <ShieldAlert size={14} />
              {error}
            </div>
          )}

          {success && <div className="alert-success">{success}</div>}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="cp-login-email">Username or email</label>
              <input
                id="cp-login-email"
                type="email"
                placeholder="you@company.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="cp-login-password">Password</label>
              <input
                id="cp-login-password"
                type="password"
                placeholder="••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <div className="row-between">
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setForgotMode(true);
                  setForgotEmail(loginEmail);
                  setError("");
                  setSuccess("");
                }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>

          <div className="status-row">
            <span>
              <span className="status-dot"></span>Secure connection
            </span>
            <span>v3.2</span>
          </div>
        </div>
      </AuthShellDark>
    );
  }

  // ====================== AUTHENTICATED SYSTEM SHELL ======================

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-slate-200 selection:text-slate-900">
      {/* Top Navigation Banner */}
      <header className="bg-white text-slate-900 h-14 flex items-center justify-between px-3 sm:px-6 shrink-0 border-b border-slate-200 shadow-xs select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile-only nav drawer toggle */}
          <button
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          >
            <Menu size={18} />
          </button>
          <img src={logo} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
          <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 truncate">
            Customer Pulse
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="hidden sm:block text-right min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate max-w-[160px]">
              {user?.fullName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center justify-end gap-1.5 uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {user?.role}
            </div>
          </div>

          <span className="hidden sm:inline text-slate-300">|</span>

          {/* Profile link - icon only on mobile, icon+label from sm up */}
          <button
            onClick={() => setCurrentView(PAGES.PROFILE)}
            className="p-1.5 sm:p-0 rounded-lg text-slate-500 sm:text-slate-600 hover:text-slate-900 hover:bg-slate-100 sm:hover:bg-transparent cursor-pointer transition-colors flex items-center gap-1.5"
            title="My Profile"
          >
            <User size={16} className="sm:hidden" />
            <span className="hidden sm:inline text-xs font-semibold">My Profile</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-all shrink-0"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body: Sidebar + Content panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile-only backdrop, shown behind the drawer when open */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Side Corporate Sidebar navigation.
            - Below md: fixed off-canvas drawer, slid in/out with mobileNavOpen.
            - md and up: normal in-flow sidebar, width driven by sidebarCollapsed
              exactly as before. */}
        <nav
          onClick={() => setMobileNavOpen(false)}
          className={`fixed inset-y-0 left-0 z-40 w-64 top-14 md:top-0 transform transition-transform duration-200 ease-in-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:static md:z-auto ${
            sidebarCollapsed ? "md:w-16" : "md:w-64"
          } bg-white text-slate-600 flex flex-col border-r border-slate-200 select-none shrink-0 font-sans text-xs md:transition-[width] duration-200 ease-in-out`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-200">
            <span className={`uppercase text-[10px] font-semibold text-slate-400 tracking-wider ${sidebarCollapsed ? "md:hidden" : ""}`}>
              Navigation
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarCollapsed((prev) => !prev);
              }}
              className={`hidden md:inline-flex p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-all ${sidebarCollapsed ? "mx-auto" : ""}`}
              title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <div className="flex-1 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
            <NavItem
              icon={<Activity size={15} />}
              label="Home"
              active={currentView === PAGES.DASHBOARD}
              collapsed={navCollapsed}
              onClick={() => setCurrentView(PAGES.DASHBOARD)}
            />

            {isManager && (
              <NavItem
                icon={<Users size={15} />}
                label="Manager Dashboard"
                active={currentView === PAGES.HOD_DASHBOARD}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.HOD_DASHBOARD)}
              />
            )}

            {isManager && (
              <NavItem
                icon={<Layers size={15} />}
                label="Department Analytics"
                active={currentView === PAGES.HOD_ANALYTICS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.HOD_ANALYTICS)}
              />
            )}

            {isCxo && (
              <NavItem
                icon={<Layers size={15} />}
                label="Executive Dashboard"
                active={currentView === PAGES.CXO_DASHBOARD}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.CXO_DASHBOARD)}
              />
            )}

            {isCxo && (
              <NavItem
                icon={<Layers size={15} />}
                label="Executive Analytics"
                active={currentView === PAGES.CXO_ANALYTICS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.CXO_ANALYTICS)}
              />
            )}

            {/* User Directory - single directory listing every account (staff + requesters) */}
            {isGlobalAdmin && (
              <NavItem
                icon={<Users size={15} />}
                label="User Directory"
                active={currentView === PAGES.USER_DIRECTORY}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.USER_DIRECTORY)}
              />
            )}

            {/* Admin invitations list */}
            {isAdmin && (
              <NavItem
                icon={<Mail size={15} />}
                label="Invitations"
                active={currentView === PAGES.PENDING_INVITES}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.PENDING_INVITES)}
              />
            )}

            {/* Department SLA / Priority config */}
            {isAdmin && (
              <NavItem
                icon={<Layers size={15} />}
                label="Departments"
                active={currentView === PAGES.DEPARTMENTS}
                collapsed={navCollapsed}
                onClick={() => {
                  setCurrentView(PAGES.DEPARTMENTS);
                  setSelectedDeptId("");
                }}
              />
            )}

            {isAgent && (
              <NavItem
                icon={<Layers size={15} />}
                label="Analytics"
                active={currentView === PAGES.AGENT_ANALYTICS}
                collapsed={navCollapsed}
                onClick={() => {
                  setCurrentView(PAGES.AGENT_ANALYTICS);
                  setSelectedDeptId("");
                }}
              />
            )}

            {/* Raise a request directly to the admin - HOD, CXO, Agent only */}
            {(isManager || isCxo || isAgent) && (
              <NavItem
                icon={<Megaphone size={15} />}
                label="Raise Ticket to Admin"
                active={currentView === PAGES.ADMIN_REQUESTS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.ADMIN_REQUESTS)}
              />
            )}

            {/* Review requests staff have raised - Global Admin only */}
            {isGlobalAdmin && (
              <NavItem
                icon={<Megaphone size={15} />}
                label="Requests From Staff"
                active={currentView === PAGES.ADMIN_REQUESTS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.ADMIN_REQUESTS)}
              />
            )}

            {/* Clients Management (Global Admin only) */}
            {isGlobalAdmin && (
              <NavItem
                icon={<Settings size={15} />}
                label="Clients Database"
                active={currentView === PAGES.CLIENTS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.CLIENTS)}
              />
            )}

            {/* System Audit logs */}
            {isAdmin && (
              <NavItem
                icon={<Database size={15} />}
                label="System Audit Logs"
                active={currentView === PAGES.AUDIT_LOGS}
                collapsed={navCollapsed}
                onClick={() => setCurrentView(PAGES.AUDIT_LOGS)}
              />
            )}
          </div>
        </nav>

        {/* Central Operations Viewport container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0">
          {error && currentView !== PAGES.TICKET_DETAILS && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {success && currentView !== PAGES.TICKET_DETAILS && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}


          {/* AGENT ANAYLTICS*/}
          {
            currentView == PAGES.CXO_ANALYTICS && (
              <CXODashboardMock token={token}/>
            )
          }
          {
            currentView == PAGES.HOD_ANALYTICS && (
              <CXODashboardMock token={token}/>
            )
          }
          {
            currentView == PAGES.CXO_DASHBOARD&& (
              <CXODashboard setCurrentView={setCurrentView} setSelectedTicketId={setSelectedTicketId} token={token} currentUser={user!}/>
            )
          }
          {
            currentView == PAGES.AGENT_ANALYTICS && (
              <AgentDashboard token={token}/>
            )
          }

          {/* VIEW: DASHBOARD */}
          {currentView === PAGES.DASHBOARD && (
            
            <Dashboard
              token={token}
              setCurrentView={setCurrentView}
              user={user!}
              setSelectedTicketId={setSelectedTicketId}
              metric={metric!}
            />
          )}

          {/* VIEW: AGENT - own/assigned ticket search */}
          {currentView === PAGES.AGENT_TICKET_SEARCH && isAgent && (
            <AgentTicketSearch
              token={token}
              currentUser={user!}
              setSelectedTicketId={setSelectedTicketId}
              setCurrentView={setCurrentView}
            />
          )}

          

          {/* VIEW: MANAGER DASHBOARD */}
          {currentView === PAGES.HOD_DASHBOARD && (
            <ManagerDashboard
              token={token}
              currentUser={user!}
              setSelectedTicketId={setSelectedTicketId}
              setCurrentView={setCurrentView}
              departments={departments}
            />
          )}

          {/* VIEW: ADMIN REQUESTS - raise (HOD/CXO/Agent) or review (Global Admin) */}
          {currentView === PAGES.ADMIN_REQUESTS && (
            <AdminRequests
              token={token}
              currentUser={user!}
              setError={setError}
              setSuccess={setSuccess}
            />
          )}

          {/* VIEW: CREATE TICKET (FORM) */}
          {currentView === PAGES.NEW_TICKET && (
            <TicketForm
              setSelectedTicketId={setSelectedTicketId}
              setCurrentView={setCurrentView}
              setError={setError}
              setSuccess={setSuccess}
              token={token}
              clients={clients}
              departments={departments}
            />
          )}

          {/* VIEW: TICKET DETAIL (COMPLEX TABS) */}
          {currentView === PAGES.TICKET_DETAILS && (
            <TicketDetail
              ticketId={selectedTicketId}
              token={token}
              currentUser={user!}
              metric={metric!}
              setCurrentView={setCurrentView}
              onBack={() => setCurrentView(PAGES.DASHBOARD)}
              departments={departments}
              clients={clients}
            />
          )}

          {/* VIEW: PROFILE */}
          {currentView === PAGES.PROFILE && (
            <Profile
              token={token}
              setSuccess={setSuccess}
              setUser={setUser}
              user={user!}
            />
          )}

          {/* VIEW: USERS DIRECTORY */}
          {currentView === PAGES.USER_DIRECTORY && isGlobalAdmin && (
            <UserDirectory
              setError={setError}
              setSuccess={setSuccess}
              setUser={setUser}
              user={user!}
              users={users}
              departments={departments}
              fetchUsers={fetchUsers}
              token={token}
            />
          )}

          {/* VIEW: INVITATIONS */}
          {currentView === PAGES.PENDING_INVITES && (
            <InvitationComponent
              setError={setError}
              setInviteDeptId={setInviteDeptId}
              setInviteCategoryIds={setInviteCategoryIds}
              setInviteDeptCategories={setInviteDeptCategories}
              inviteCategoryIds={inviteCategoryIds}
              inviteDeptCategories={inviteDeptCategories}
              setSuccess={setSuccess}
              invitations={invitations}
              departments={departments}
              inviteDeptId={inviteDeptId}
              token={token}
              fetchInvitations={fetchInvitations}
            />
          )}

          {currentView === PAGES.MY_TICKETS && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setPersonalStatusFilter("");
                    setCurrentView(PAGES.DASHBOARD);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <select
                  value={personalStatusFilter}
                  onChange={(e) => setPersonalStatusFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="text-sm">
                <TicketsTable
                  tickets={
                    personalStatusFilter
                      ? mytickets.filter(
                          (t) => t.status === personalStatusFilter,
                        )
                      : mytickets
                  }
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              </div>
            </div>
          )}

          {currentView === PAGES.ASSINGED_TICKETS && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setPersonalStatusFilter("");
                    setCurrentView(PAGES.DASHBOARD);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <select
                  value={personalStatusFilter}
                  onChange={(e) => setPersonalStatusFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="text-sm">
                <TicketsTable
                  tickets={
                    personalStatusFilter
                      ? assigned.filter(
                          (t) => t.status === personalStatusFilter,
                        )
                      : assigned
                  }
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              </div>
            </div>
          )}


          {currentView === PAGES.RESOLVED_TICKETS && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setPersonalStatusFilter("");
                    setCurrentView(PAGES.DASHBOARD);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <select
                  value={personalStatusFilter}
                  onChange={(e) => setPersonalStatusFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="text-sm">
                <TicketsTable
                  tickets={
                    personalStatusFilter
                      ? assigned.filter(
                          (t) => t.status === personalStatusFilter,
                        )
                      : resovled 
                  }
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              </div>
            </div>
          )}

          {currentView === PAGES.ON_HOLD    && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setPersonalStatusFilter("");
                    setCurrentView(PAGES.DASHBOARD);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <select
                  value={personalStatusFilter}
                  onChange={(e) => setPersonalStatusFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="text-sm">
                <TicketsTable
                  tickets={
                    personalStatusFilter
                      ? assigned.filter(
                          (t) => t.status === personalStatusFilter,
                        )
                      : onhold 
                  }
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              </div>
            </div>
          )}



          {currentView === PAGES.BREACHED_TICKETS && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setPersonalStatusFilter("");
                    setCurrentView(PAGES.DASHBOARD);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <select
                  value={personalStatusFilter}
                  onChange={(e) => setPersonalStatusFilter(e.target.value)}
                  className="text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div className="text-sm">
                <TicketsTable
                  tickets={
                    personalStatusFilter
                      ? breached.filter(
                          (t) => t.status === personalStatusFilter,
                        )
                      : breached
                  }
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              </div>
            </div>
          )}

          {/* VIEW: DEPARTMENTS & SLA POLICY */}
                    {currentView === PAGES.DEPARTMENTS && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-zinc-200 p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-zinc-900">
                    Departments SLA & Knowledge Index
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Configure service parameters, categories, and tags.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:w-auto">
                  <button
                    onClick={() => {
                      setBulkDeptFile(null);
                      setBulkDeptResult(null);
                      setShowBulkUploadDeptDialog(true);
                    }}
                    className="bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 sm:px-4 py-2.5 cursor-pointer flex items-center justify-center gap-2 rounded-lg transition-all whitespace-nowrap"
                  >
                    <Upload size={16} /> <span>Bulk Upload</span>
                  </button>
                  <button
                    onClick={() => setShowAddDeptDialog(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-3 sm:px-4 py-2.5 cursor-pointer flex items-center justify-center gap-2 rounded-lg transition-all whitespace-nowrap"
                  >
                    <Plus size={16} /> <span>Add Department</span>
                  </button>
                </div>
              </div>

              {/* Bulk Upload Departments Dialog */}
              {showBulkUploadDeptDialog && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-zinc-900">
                        Bulk Upload Departments
                      </h2>
                      <button
                        onClick={() => setShowBulkUploadDeptDialog(false)}
                        className="text-zinc-400 hover:text-zinc-700 text-xl leading-none cursor-pointer"
                      >
                        ×
                      </button>
                    </div>

                    <p className="text-xs text-zinc-500 mb-4">
                      Upload an .xlsx or .xls file with one row per
                      department / sub-department / category combination.
                      Repeat the department name on every row it owns;
                      sub-department and category are optional per row.
                      Download the template below for the exact columns
                      and a worked example.
                    </p>

                    <button
                      type="button"
                      onClick={handleDownloadDeptTemplate}
                      className="w-full mb-4 text-xs font-semibold text-zinc-700 border border-dashed border-zinc-300 hover:bg-zinc-50 rounded-lg px-4 py-2.5 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Download Template
                    </button>

                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Select File
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setBulkDeptFile(e.target.files?.[0] || null)}
                        className="w-full text-sm p-2 border border-zinc-200 rounded-lg bg-white"
                      />
                    </div>

                    {bulkDeptResult && (
                      <div className="mb-4 text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
                        <div className="flex gap-4 font-mono">
                          <span className="text-emerald-600 font-bold">
                            Created: {bulkDeptResult.createdCount}
                          </span>
                          <span className="text-amber-600 font-bold">
                            Skipped: {bulkDeptResult.skippedCount}
                          </span>
                          <span className="text-red-600 font-bold">
                            Errors: {bulkDeptResult.errorCount}
                          </span>
                        </div>
                        
                        {bulkDeptResult.skipped.length > 0 && (
                          <div>
                            <p className="font-semibold text-zinc-600">Skipped rows:</p>
                            {bulkDeptResult.skipped.map((s, i) => (
                              <p key={i} className="text-zinc-500">
                                Row {s.row} ({s.name}): {s.reason}
                              </p>
                            ))}
                          </div>
                        )}
                        {bulkDeptResult.errors.length > 0 && (
                          <div>
                            <p className="font-semibold text-zinc-600">Row errors:</p>
                            {bulkDeptResult.errors.map((e, i) => (
                              <p key={i} className="text-red-500">
                                Row {e.row}: {e.reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkUploadDeptDialog(false)}
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-4 py-2.5 cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={!bulkDeptFile || bulkDeptUploading}
                        onClick={handleBulkUploadDepartments}
                        className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                      >
                        {bulkDeptUploading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Department Dialog */}
              {showAddDeptDialog && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-zinc-900">
                        Add Department
                      </h2>
                      <button
                        onClick={() => setShowAddDeptDialog(false)}
                        className="text-zinc-400 hover:text-zinc-700 text-xl leading-none cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                    <form
                      onSubmit={handleCreateDepartment}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Department Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. IT Support"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full text-sm p-2.5 border border-zinc-200 rounded-lg bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Description
                        </label>
                        <textarea
                          placeholder="Optional description"
                          value={newDeptDescription}
                          onChange={(e) =>
                            setNewDeptDescription(e.target.value)
                          }
                          className="w-full text-sm p-2.5 border border-zinc-200 rounded-lg bg-white"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddDeptDialog(false)}
                          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-4 py-2.5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                        >
                          Save Department
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Department selectors card grid */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-mono font-bold text-zinc-500 tracking-wider">
                    Select Department
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelectDeptConfig(d.id)}
                        className={`p-4 border cursor-pointer select-none ${
                          selectedDeptId === d.id
                            ? "bg-white border-[#30b380] shadow-xs"
                            : "bg-white border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold truncate">
                          Scope ID: {d.id}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-950 mt-1 break-words">
                          {d.name}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 break-words">
                          {d.description}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-100 text-[10px] font-mono text-zinc-400">
                          <div className="flex flex-wrap gap-3 sm:gap-4 w-fit">
                            <span>Staff: {d._count.agents || 0}</span>
                            <span>Tickets logged: {d._count.tickets || 0}</span>
                          </div>
                          <div className="flex shrink-0">
                            <Trash className="w-4 h-4 text-red-400" onClick={(e)=>{
                              e.stopPropagation()
                              handleDeleteDepartment(d.id)
                            }
                            }/>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Config panel detail for categories/keywords */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 p-4 sm:p-6 h-fit">
                  {selectedDeptId ? (
                    <div className="space-y-8">
                      {/* Sub-Section: Sub-Departments (optional grouping) */}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b pb-2 mb-4 flex justify-between items-center">
                          <span>Sub-Departments (optional)</span>
                        </h3>

                        {/* inline sub-department creator */}
                        <form
                          onSubmit={handleCreateSubDepartment}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3 border border-zinc-200 mb-4"
                        >
                          <input
                            type="text"
                            placeholder="Sub-Department Name"
                            value={newSubDeptName}
                            onChange={(e) => setNewSubDeptName(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newSubDeptDescription}
                            onChange={(e) => setNewSubDeptDescription(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white"
                          />
                          <button
                            type="submit"
                            className="bg-zinc-800 text-white text-xs py-1 cursor-pointer font-bold hover:bg-zinc-700"
                          >
                            Add Sub-Department
                          </button>
                        </form>

                        {deptSubDepartmentsList.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">
                            No sub-departments added yet - categories in this department are department-wide by default.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {deptSubDepartmentsList.map((sd) => (
                              <span
                                key={sd.id}
                                className="inline-flex items-center gap-2 text-xs bg-zinc-100 border border-zinc-200 px-2.5 py-1.5"
                              >
                                {sd.name}
                                <Trash
                                  className="w-3 h-3 text-red-400 cursor-pointer"
                                  onClick={() => handleDeleteSubDepartment(sd.id)}
                                />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sub-Section: Categories */}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b pb-2 mb-4 flex justify-between items-center">
                          <span>
                            Department Categories & SLA Configurations
                          </span>
                        </h3>

                        {/* inline category creator */}
                        <form
                          onSubmit={handleCreateCategory}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 p-3 border border-zinc-200 mb-4"
                        >
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white w-full"
                            required
                          />
                          <input
                            type="number"
                            placeholder="SLA Minutes (e.g. 1440)"
                            value={newCatSla}
                            onChange={(e) => setNewCatSla(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white w-full"
                            min={1}
                            required
                          />
                          <select
                            value={newCatSubDepartmentId}
                            onChange={(e) => setNewCatSubDepartmentId(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white w-full"
                          >
                            <option value="">-- Department-wide (no sub-dept) --</option>
                            {deptSubDepartmentsList.map((sd) => (
                              <option key={sd.id} value={sd.id}>{sd.name}</option>
                            ))}
                          </select>

                          {/* Admin-only classification - never surfaced to requesters/agents */}
                          <label className="text-xs flex items-center gap-1.5 bg-white border border-zinc-300 p-2 cursor-pointer w-full">
                            <input
                              type="checkbox"
                              checked={newCatIsWorkStopping}
                              onChange={(e) => setNewCatIsWorkStopping(e.target.checked)}
                            />
                            Work Stopping
                          </label>
                          <label className="text-xs flex items-center gap-1.5 bg-white border border-zinc-300 p-2 cursor-pointer w-full">
                            <input
                              type="checkbox"
                              checked={newCatIsSafetyViolation}
                              onChange={(e) => setNewCatIsSafetyViolation(e.target.checked)}
                            />
                            Safety Violation
                          </label>

                          <button
                            type="submit"
                            className="sm:col-span-2 lg:col-span-4 bg-zinc-800 text-white text-xs py-2 cursor-pointer font-bold hover:bg-zinc-700 w-full"
                          >
                            Add Category
                          </button>
                        </form>

                        {/* List categories */}
                        {deptCategoriesList.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">
                            No categories mapped to this department yet.
                          </p>
                        ) : (
                          <>
                            {/* Mobile: stacked cards */}
                            <div className="sm:hidden space-y-3">
                              {deptCategoriesList.map((c) =>
                                editingCategoryId === c.id ? (
                                  <div
                                    key={c.id}
                                    className="border border-zinc-200 bg-zinc-50 p-3 space-y-2 text-xs"
                                  >
                                    <div>
                                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">
                                        Category Name
                                      </label>
                                      <input
                                        type="text"
                                        value={editCatName}
                                        onChange={(e) => setEditCatName(e.target.value)}
                                        className="text-xs p-1.5 border border-zinc-300 bg-white w-full"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">
                                        Sub-Department
                                      </label>
                                      <select
                                        value={editCatSubDepartmentId}
                                        onChange={(e) => setEditCatSubDepartmentId(e.target.value)}
                                        className="text-xs p-1.5 border border-zinc-300 bg-white w-full"
                                      >
                                        <option value="">-- Department-wide --</option>
                                        {deptSubDepartmentsList.map((sd) => (
                                          <option key={sd.id} value={sd.id}>{sd.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">
                                        SLA Minutes
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={editCatSla}
                                        onChange={(e) => setEditCatSla(e.target.value)}
                                        className="text-xs p-1.5 border border-zinc-300 bg-white w-full"
                                      />
                                    </div>
                                    <div className="space-y-1 pt-1">
                                      <label className="flex items-center gap-1.5">
                                        <input
                                          type="checkbox"
                                          checked={editCatIsWorkStopping}
                                          onChange={(e) => setEditCatIsWorkStopping(e.target.checked)}
                                        />
                                        Work Stopping
                                      </label>
                                      <label className="flex items-center gap-1.5">
                                        <input
                                          type="checkbox"
                                          checked={editCatIsSafetyViolation}
                                          onChange={(e) => setEditCatIsSafetyViolation(e.target.checked)}
                                        />
                                        Safety Violation
                                      </label>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-1">
                                      <button
                                        onClick={() => handleUpdateCategory(c.id)}
                                        className="text-teal-700 hover:text-teal-900 font-bold"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEditCategory}
                                        className="text-zinc-500 hover:text-zinc-700 font-bold"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={c.id}
                                    className="border border-zinc-200 bg-white p-3 text-xs space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-semibold text-zinc-900 break-words">
                                        {c.name}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500">
                                      <span>
                                        {deptSubDepartmentsList.find((sd) => sd.id === c.subDepartmentId)?.name || (
                                          <span className="italic text-zinc-400">Department-wide</span>
                                        )}
                                      </span>
                                      <span className="font-mono">{c.defaultSlaMinutes} minutes</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {c.isWorkStopping && (
                                        <span className="inline-block bg-red-100 text-red-700 font-bold px-1.5 py-0.5">
                                          Work Stopping
                                        </span>
                                      )}
                                      {c.isSafetyViolation && (
                                        <span className="inline-block bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5">
                                          Safety Violation
                                        </span>
                                      )}
                                      {!c.isWorkStopping && !c.isSafetyViolation && (
                                        <span className="text-zinc-400 italic">No flags</span>
                                      )}
                                    </div>
                                    <div className="flex justify-end gap-3 pt-1 border-t border-zinc-100">
                                      <button
                                        onClick={() => handleStartEditCategory(c)}
                                        className="text-zinc-600 hover:text-zinc-900 font-bold"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteCategory(c.id)
                                        }
                                        className="text-red-500 hover:text-red-700 font-bold"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Tablet/Desktop: table */}
                            <div className="hidden sm:block overflow-x-auto border border-zinc-200">
                              <table className="min-w-full divide-y divide-zinc-200 text-xs">
                                <thead className="bg-zinc-50 text-zinc-600">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left">
                                      Category Name
                                    </th>
                                    <th className="px-4 py-2.5 text-left">
                                      Sub-Department
                                    </th>
                                    <th className="px-4 py-2.5 text-left">
                                      SLA SLA Deadline
                                    </th>
                                    <th className="px-4 py-2.5 text-left">
                                      Flags (admin-only)
                                    </th>
                                    <th className="px-4 py-2.5 text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                  {deptCategoriesList.map((c) =>
                                    editingCategoryId === c.id ? (
                                      <tr key={c.id} className="bg-zinc-50">
                                        <td className="px-4 py-2.5">
                                          <input
                                            type="text"
                                            value={editCatName}
                                            onChange={(e) => setEditCatName(e.target.value)}
                                            className="text-xs p-1.5 border border-zinc-300 bg-white w-full"
                                          />
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <select
                                            value={editCatSubDepartmentId}
                                            onChange={(e) => setEditCatSubDepartmentId(e.target.value)}
                                            className="text-xs p-1.5 border border-zinc-300 bg-white"
                                          >
                                            <option value="">-- Department-wide --</option>
                                            {deptSubDepartmentsList.map((sd) => (
                                              <option key={sd.id} value={sd.id}>{sd.name}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <input
                                            type="number"
                                            min={1}
                                            value={editCatSla}
                                            onChange={(e) => setEditCatSla(e.target.value)}
                                            className="text-xs p-1.5 border border-zinc-300 bg-white w-24"
                                          />
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <label className="flex items-center gap-1 mb-1">
                                            <input
                                              type="checkbox"
                                              checked={editCatIsWorkStopping}
                                              onChange={(e) => setEditCatIsWorkStopping(e.target.checked)}
                                            />
                                            Work Stopping
                                          </label>
                                          <label className="flex items-center gap-1">
                                            <input
                                              type="checkbox"
                                              checked={editCatIsSafetyViolation}
                                              onChange={(e) => setEditCatIsSafetyViolation(e.target.checked)}
                                            />
                                            Safety Violation
                                          </label>
                                        </td>
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                          <button
                                            onClick={() => handleUpdateCategory(c.id)}
                                            className="text-teal-700 hover:text-teal-900 font-bold mr-3"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={handleCancelEditCategory}
                                            className="text-zinc-500 hover:text-zinc-700 font-bold"
                                          >
                                            Cancel
                                          </button>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr key={c.id}>
                                        <td className="px-4 py-2.5 font-medium">
                                          {c.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-zinc-500">
                                          {deptSubDepartmentsList.find((sd) => sd.id === c.subDepartmentId)?.name || (
                                            <span className="italic text-zinc-400">Department-wide</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono">
                                          {c.defaultSlaMinutes} minutes
                                        </td>
                                        <td className="px-4 py-2.5 space-x-1">
                                          {c.isWorkStopping && (
                                            <span className="inline-block bg-red-100 text-red-700 font-bold px-1.5 py-0.5">
                                              Work Stopping
                                            </span>
                                          )}
                                          {c.isSafetyViolation && (
                                            <span className="inline-block bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5">
                                              Safety Violation
                                            </span>
                                          )}
                                          {!c.isWorkStopping && !c.isSafetyViolation && (
                                            <span className="text-zinc-400 italic">—</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                          <button
                                            onClick={() => handleStartEditCategory(c)}
                                            className="text-zinc-600 hover:text-zinc-900 font-bold mr-3"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteCategory(c.id)
                                            }
                                            className="text-red-500 hover:text-red-700 font-bold"
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Sub-Section: Keywords routing keys */}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b pb-2 mb-4">
                          Defined Knowledge Keywords Routing Keys
                        </h3>

                        {/* inline keyword definitions creator */}
                        <form
                          onSubmit={handleCreateKeyword}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-3 border border-zinc-200 mb-4"
                        >
                          <input
                            type="text"
                            placeholder="Keyword (e.g. SSO)"
                            value={newKwName}
                            onChange={(e) => setNewKwName(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Synonyms (comma separated)"
                            value={newKwSynonyms}
                            onChange={(e) => setNewKwSynonyms(e.target.value)}
                            className="text-xs p-2 border border-zinc-300 bg-white"
                          />
                          <button
                            type="submit"
                            className="bg-zinc-800 text-white text-xs py-1 cursor-pointer font-bold hover:bg-zinc-700"
                          >
                            Save Keyword
                          </button>
                        </form>

                        {/* List defined tags */}
                        {deptKeywordsList.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">
                            No routing tags declared yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {deptKeywordsList.map((k) => (
                              <span
                                key={k.id}
                                className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-800 text-xs px-2.5 py-1 border border-zinc-200"
                              >
                                <strong className="text-[#032d26]">
                                  {k.name}
                                </strong>
                                {k.synonyms.length > 0 && (
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    ({k.synonyms.join(", ")})
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteKeyword(k.id)}
                                  className="text-red-500 hover:text-red-700 font-bold ml-1.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mined aggregate keyword suggestions */}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 border-b pb-2 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span>Mined Unmatched Keyword Suggestions</span>
                          <span className="text-[10px] font-mono text-zinc-400 font-normal bg-zinc-50 px-2 py-0.5 border normal-case tracking-normal self-start sm:self-auto">
                            Auto-mined over time from unmatched tickets
                            narrative text.
                          </span>
                        </h3>

                        {deptSuggestionsList.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic text-center py-4 bg-zinc-50 border border-dashed">
                            No keyword suggestions accumulated. Matchers are
                            optimized.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-zinc-200">
                            <table className="min-w-full divide-y divide-zinc-200 text-xs">
                              <thead className="bg-zinc-50 text-zinc-600 font-semibold uppercase">
                                <tr>
                                  <th className="px-4 py-3 text-left">
                                    Suggested Term
                                  </th>
                                  <th className="px-4 py-3 text-left">
                                    Occurrences Count
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                {deptSuggestionsList.map((s) => (
                                  <tr key={s.id}>
                                    <td className="px-4 py-3 font-mono font-bold text-[#032d26]">
                                      {s.term}
                                    </td>
                                    <td className="px-4 py-3 font-mono">
                                      {s.occurrenceCount} matches
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                      <button
                                        onClick={() =>
                                          handlePromoteSuggestion(s.id, s.term)
                                        }
                                        className="text-emerald-700 hover:underline font-bold"
                                      >
                                        Promote to Keyword
                                      </button>
                                      <span className="text-zinc-300">|</span>
                                      <button
                                        onClick={() =>
                                          handleRejectSuggestion(s.id)
                                        }
                                        className="text-red-500 hover:underline font-bold"
                                      >
                                        Dismiss
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400 italic py-16">
                      Select a department from the left listing to configure
                      Service Level Agreements, categories, and routing tags.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CLIENTS MANAGEMENT (GLOBAL ADMIN ONLY) */}
          {currentView === PAGES.CLIENTS && <ClientManagement token={token} />}

          {/* VIEW: SYSTEM AUDIT LOGS */}
          {currentView === PAGES.AUDIT_LOGS && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white border border-zinc-200 p-4 sm:p-6 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-zinc-900 font-sans">
                    System Audit Logs
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    Read-only logging of user profiles, ticket updates,
                    overrides, and assignments.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 overflow-hidden">
                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 italic text-sm">
                    No audit logs written.
                  </div>
                ) : (
                  <>
                    {/* Mobile: stacked cards */}
                    <div className="sm:hidden divide-y divide-zinc-200">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-4 text-xs space-y-1.5 overflow-hidden">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-zinc-900 break-words min-w-0">
                              {log.action}
                            </span>
                            <span className="font-mono text-zinc-400 break-words">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold block break-words">
                              {log.userFullName}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block break-all">
                              {log.userEmail}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-zinc-500 pt-1">
                            <span className="break-all min-w-0">
                              Entity: <span className="text-zinc-500">{log.entityType}</span>
                            </span>
                            <span className="break-all min-w-0">
                              Record: <span className="text-zinc-400">{log.entityId || "system"}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tablet/Desktop: table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200 text-xs">
                        <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase">
                          <tr>
                            <th className="px-6 py-3.5 text-left">
                              Action Performed
                            </th>
                            <th className="px-6 py-3.5 text-left">
                              User Involved
                            </th>
                            <th className="px-6 py-3.5 text-left">
                              Entity Category
                            </th>
                            <th className="px-6 py-3.5 text-left">
                              Target Record ID
                            </th>
                            <th className="px-6 py-3.5 text-left">
                              Timestamp (UTC)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-zinc-700">
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 font-medium text-zinc-900">
                                {log.action}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-semibold block">
                                  {log.userFullName}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono block">
                                  {log.userEmail}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono font-medium text-zinc-500">
                                {log.entityType}
                              </td>
                              <td className="px-6 py-4 font-mono font-medium text-zinc-400">
                                {log.entityId || "system"}
                              </td>
                              <td className="px-6 py-4 font-mono text-zinc-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}
