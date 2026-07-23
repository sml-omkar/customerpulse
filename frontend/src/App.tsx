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
  Download
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


// ====================== AUTH SHELL (dark full-page layout) ======================
const SchematicSVG = () => (
  <div className="hidden lg:block fixed top-0 right-0 h-screen w-[62vw] max-w-[980px] z-0 pointer-events-none opacity-90">
    <svg viewBox="0 0 980 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="edgeGradRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff3b4a" />
          <stop offset="100%" stopColor="#8f0f1a" />
        </linearGradient>
        <radialGradient id="padGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11c2b" stopOpacity="0.30" />
          <stop offset="65%" stopColor="#e11c2b" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#e11c2b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="surfaceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9dce2" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#d9dce2" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <ellipse cx="698" cy="800" rx="150" ry="16" fill="url(#padGlow)" />
      <g stroke="#d9dce2" strokeWidth="1.3" opacity="0.85" strokeLinejoin="round" strokeLinecap="round" fill="none" className="login-holo-line">
        <path d="M683 800 L695 178" />
        <path d="M713 800 L701 178" />
        <path d="M655 800 L741 800 L724 762 L672 762 Z" fill="url(#surfaceFill)" />
        <path d="M691 778 L691 800 L705 800 L705 778" />
        <path d="M698 160 L748 160 L748 178 L698 178 Z" fill="url(#surfaceFill)" />
        <path d="M748 165 L760 168 L748 173" />
      </g>
      <circle cx="698" cy="168" r="6" stroke="#e11c2b" strokeWidth="1.2" opacity="0.9" fill="none" className="login-holo-glow" />
      <g className="login-turbine-blades" stroke="#e2e4e9" strokeWidth="1.1" opacity="0.85" strokeLinejoin="round" fill="none">
        <path d="M692 168 L695 66 Q698 58 701 66 L704 168 Z" />
        <path d="M692 168 L695 66 Q698 58 701 66 L704 168 Z" transform="rotate(120 698 168)" />
        <path d="M692 168 L695 66 Q698 58 701 66 L704 168 Z" transform="rotate(240 698 168)" />
      </g>
      <circle className="login-node login-node-d2" cx="698" cy="168" r="3" fill="#e11c2b" />
      <circle cx="698" cy="168" r="60" stroke="#e11c2b" strokeWidth="0.7" opacity="0.22" className="login-holo-glow" />
      <circle cx="698" cy="168" r="95" stroke="#e11c2b" strokeWidth="0.6" opacity="0.12" />
      <circle cx="300" cy="655" r="50" stroke="#e11c2b" strokeWidth="0.7" opacity="0.18" className="login-holo-glow" />
    </svg>
  </div>
);

const RequestLifecycleRail = () => {
  const steps = [
    { label: "Log", icon: <path d="M4 21V5a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /> },
    { label: "Track", icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></> },
    { label: "Updates", icon: <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /> },
    { label: "Communicate", icon: <path d="M4 4h16v12H8l-4 4Z" /> },
    { label: "Feedback", icon: <><path d="M7 11v9H4v-9Z" /><path d="M7 11l3-8a2 2 0 0 1 4 1v5h4a2 2 0 0 1 2 2l-1.5 6a2 2 0 0 1-2 1.5H7" /></> },
    { label: "Resolved", icon: <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8Z" /> },
  ];
  return (
    <div className="max-w-[1180px] mx-auto mt-14 w-full px-4">
      <div className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#6f7178] mb-4">Request Lifecycle</div>
      <div className="relative flex justify-between">
        <div className="absolute left-[18px] right-[18px] top-[11px] h-px" style={{ background: "linear-gradient(90deg, #e11c2b, rgba(255,255,255,0.15))" }} />
        {steps.map((s, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2.5 flex-1">
            <div className="w-[22px] h-[22px] rounded-full bg-[#101113] border-[1.5px] border-[#e11c2b] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#e11c2b" strokeWidth="2" className="w-[11px] h-[11px]">{s.icon}</svg>
            </div>
            <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[#6f7178] text-center">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen w-full overflow-hidden" style={{ background: "#08090a" }}>
    <div className="login-backdrop" />
    <div className="login-grid-overlay" />
    <div className="login-scanline" />
    <SchematicSVG />
    <div className="relative z-10 min-h-screen flex flex-col px-[6vw] py-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 border-[1.5px] border-[#e11c2b] flex items-center justify-center font-display font-semibold text-[17px] text-[#e11c2b] relative">
            S
            <div className="absolute inset-[-5px] border border-[rgba(225,28,43,0.25)]" />
          </div>
          <div>
            <div className="font-display text-[14.5px] font-semibold tracking-[0.06em] text-[#f2f3f5]">SANGHVI MOVERS</div>
            <div className="font-mono text-[9px] tracking-[0.18em] text-[#6f7178] uppercase">Heavy Lift &amp; Logistics</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[14.5px] font-semibold tracking-[0.04em] text-[#f2f3f5]">Customer <span className="text-[#e11c2b]">Pulse</span></div>
          <div className="font-mono text-[9px] tracking-[0.14em] text-[#6f7178]">WE LISTEN. WE ACT.</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center mt-[2vh]">
        {/* Left: Copy column */}
        <div className="hidden lg:flex flex-1 max-w-[520px] pr-10 flex-col">
          <div className="font-mono text-[10.5px] tracking-[0.22em] text-[#e11c2b] uppercase flex items-center gap-2.5 mb-5">
            <span className="w-[26px] h-px bg-[#e11c2b]" />
            Service Portal
          </div>
          <h1 className="font-display font-medium text-[clamp(30px,3.6vw,46px)] leading-[1.12] tracking-[-0.01em] text-[#f2f3f5] mb-5">
            Every ticket <span className="text-[#e11c2b]">has a pulse.</span>
          </h1>
          <svg viewBox="0 0 420 46" className="w-[220px] h-auto mb-5 overflow-visible login-pulse-line" fill="none">
            <path d="M0 23 H150 L165 23 L175 6 L188 40 L198 12 L208 30 L218 23 H420" stroke="#e11c2b" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <p className="text-[14.5px] leading-[1.65] text-[#b9bcc3] max-w-[420px] mb-9">
            One sign-in for requesters raising issues, agents resolving them, and leaders watching it all move. Customer Pulse keeps everyone on the same beat.
          </p>
        </div>

        {/* Right: Form card slot */}
        <div className="flex-none w-full max-w-[400px] lg:ml-auto">
          {children}
        </div>
      </div>

      {/* Request Lifecycle Rail */}
      <RequestLifecycleRail />
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
          <div className="login-card p-[34px_32px_28px]">
            <div className="login-corner login-corner-tl" />
            <div className="login-corner login-corner-br" />
            <div className="font-mono text-[9.5px] tracking-[0.16em] text-[#6f7178] uppercase mb-2">Authenticated Access</div>
            <h1 className="font-display text-[21px] font-semibold text-[#f2f3f5] mb-6">Accept invitation</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleAcceptInvite} className="space-y-[18px]">
              <div className="login-field">
                <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Full Name</label>
                <input type="text" placeholder="Your full name" value={inviteFullName} onChange={e => setInviteFullName(e.target.value)} required />
              </div>
              <div className="login-field">
                <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Password</label>
                <input type="password" placeholder="••••••••••" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} required minLength={8} />
              </div>
              <div className="login-field">
                <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Confirm Password</label>
                <input type="password" placeholder="••••••••••" value={invitePasswordConfirm} onChange={e => setInvitePasswordConfirm(e.target.value)} required minLength={8} />
              </div>
              <button type="submit" disabled={loading} className="login-btn-gradient">
                {loading ? "Activating profile…" : "Activate account & sign in"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={() => setInviteToken(null)} className="font-mono text-[10px] text-[#b9bcc3] hover:text-[#e11c2b] transition-colors">
                Back to sign in
              </button>
            </div>
          </div>
        </AuthShell>
      );
    }

    // 2. Forgot Password (OTP request -> verify + reset)
    if (forgotMode) {
      return (
        <AuthShell>
          <div className="login-card p-[34px_32px_28px]">
            <div className="login-corner login-corner-tl" />
            <div className="login-corner login-corner-br" />
            <div className="font-mono text-[9.5px] tracking-[0.16em] text-[#6f7178] uppercase mb-2">Password Recovery</div>
            <h1 className="font-display text-[21px] font-semibold text-[#f2f3f5] mb-6">Reset password</h1>

            <p className="font-mono text-[9.5px] text-[#6f7178] mb-6">
              {forgotStep === "request"
                ? "Enter your account email and we'll send you a verification code."
                : forgotOtpVerified
                ? "Choose a new password for your account."
                : "Enter the 6-digit code we emailed you."}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
                {success}
              </div>
            )}

            {forgotStep === "request" && (
              <form onSubmit={handleRequestOtp} className="space-y-[18px]">
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Corporate email</label>
                  <input type="email" placeholder="you@company.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="login-btn-gradient">
                  {loading ? "Sending code…" : "Send verification code"}
                </button>
              </form>
            )}

            {forgotStep === "verify" && !forgotOtpVerified && (
              <form onSubmit={handleVerifyOtp} className="space-y-[18px]">
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="!tracking-[0.3em] !text-center !font-semibold"
                    required
                  />
                  <p className="font-mono text-[9px] text-[#6f7178] mt-1.5">Sent to {forgotEmail}. Expires in 10 minutes.</p>
                </div>
                <button type="submit" disabled={loading || forgotOtp.length !== 6} className="login-btn-gradient">
                  {loading ? "Verifying…" : "Verify code"}
                </button>
                <button type="button" onClick={handleRequestOtp} disabled={loading} className="w-full font-mono text-[10px] text-[#b9bcc3] hover:text-[#e11c2b] transition-colors">
                  Resend code
                </button>
              </form>
            )}

            {forgotStep === "verify" && forgotOtpVerified && (
              <form onSubmit={handleResetPassword} className="space-y-[18px]">
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">New password</label>
                  <input type="password" placeholder="Choose a new password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} required minLength={8} />
                </div>
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Confirm new password</label>
                  <input type="password" placeholder="Re-enter new password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} required minLength={8} />
                </div>
                <button type="submit" disabled={loading} className="login-btn-gradient">
                  {loading ? "Resetting…" : "Reset password"}
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <button onClick={exitForgotPasswordFlow} className="font-mono text-[10px] text-[#b9bcc3] hover:text-[#e11c2b] transition-colors">
                Back to sign in
              </button>
            </div>
          </div>
        </AuthShell>
      );
    }

    // 3. Main Login / Public Requester Signup
    return (
      <AuthShell>
        <div className="login-card p-[34px_32px_28px]">
          <div className="login-corner login-corner-tl" />
          <div className="login-corner login-corner-br" />
          <div className="font-mono text-[9.5px] tracking-[0.16em] text-[#6f7178] uppercase mb-2">Authenticated Access</div>
          <h1 className="font-display text-[21px] font-semibold text-[#f2f3f5] mb-6">
            {signupMode ? "Create your account" : "Sign in to your account"}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
              {success}
            </div>
          )}

          <form onSubmit={signupMode ? handleSignup : handleLogin} className="space-y-[18px]">
            {signupMode && (
              <>
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Full Name</label>
                  <input type="text" placeholder="John Doe" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} required />
                </div>
                <div className="login-field">
                  <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Employee ID</label>
                  <input type="text" placeholder="EMP001" value={signupEmployeeId} onChange={(e) => setSignupEmployeeId(e.target.value)} required />
                </div>
              </>
            )}

            <div className="login-field">
              <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">
                {signupMode ? "Email" : "Username or email"}
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={signupMode ? signupEmail : loginEmail}
                onChange={(e) => signupMode ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label className="block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6f7178] mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••••"
                value={signupMode ? signupPassword : loginPassword}
                onChange={(e) => signupMode ? setSignupPassword(e.target.value) : setLoginPassword(e.target.value)}
                required
              />
            </div>

            {!signupMode && (
              <div className="flex justify-between items-center -mt-1 mb-1">
                <label className="flex items-center gap-[7px] font-mono text-[10px] text-[#6f7178] cursor-pointer">
                  <input type="checkbox" className="accent-[#e11c2b]" />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setForgotEmail(loginEmail);
                    setError("");
                    setSuccess("");
                  }}
                  className="font-mono text-[10px] text-[#b9bcc3] border-b border-[rgba(255,255,255,0.2)] hover:text-[#e11c2b] hover:border-[#e11c2b] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="login-btn-gradient">
              {loading ? (signupMode ? "Creating account…" : "Signing in…") : (signupMode ? "Create account" : "Log in")}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center font-mono text-[9.5px] text-[#6f7178]">
            <span className="flex items-center">
              <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#3ecf6b] mr-1.5" style={{ boxShadow: "0 0 6px #3ecf6b" }} />
              Secure connection
            </span>
            {!signupMode && (
              <span className="cursor-pointer hover:text-[#e11c2b] transition-colors" onClick={() => { setSignupMode(true); setError(""); setSuccess(""); }}>
                Create account
              </span>
            )}
            {signupMode && (
              <span className="cursor-pointer hover:text-[#e11c2b] transition-colors" onClick={() => { setSignupMode(false); setError(""); setSuccess(""); }}>
                Sign in instead
              </span>
            )}
          </div>
        </div>
      </AuthShell>
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
