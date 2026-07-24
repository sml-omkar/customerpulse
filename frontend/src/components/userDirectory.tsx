import { useEffect, useRef, useState } from "react";
import { User as UserType, Department, RequestorDirectoryEntry, UserRole } from "../types";
import { EditUserModal } from "./EditUserModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { MessageSquare, ShieldCheck, ShieldX, Ban, CheckCircle2, Trash2, Upload, FileDown, FileUp } from "lucide-react";
import * as XLSX from "xlsx";
import API_BASE from "../lib/api";

type BulkInviteResult = {
  totalRows: number;
  createdCount: number;
  skippedCount: number;
  created: string[];
  skipped: { name: string; email: string; reason: string }[];
};

// NOTE(merged): this used to be two separate pages - a "Staff Directory"
// (GLOBAL_ADMIN/CXO/HOD/AGENT, backed by /users) and a "Users Directory"
// (self-registered REQUESTERs, backed by /admin/requestors). They're now
// combined into one directory so every account - staff or requester - shows
// up in a single list. The two source shapes are different, so rows are
// rendered from two arrays (staff + requestors) and the Status/Tickets/
// Actions cells branch by role.
const ROLE_FILTERS: { label: string; value: "ALL" | UserRole }[] = [
  { label: "All Roles", value: "ALL" },
  { label: "Global Admin", value: "GLOBAL_ADMIN" as UserRole },
  { label: "CXO", value: "CXO" as UserRole },
  { label: "HOD", value: "HOD" as UserRole },
  { label: "Agent", value: "AGENT" as UserRole },
  { label: "Requester", value: "REQUESTER" as UserRole },
];

export const UserDirectory = (
    {token,setError,setSuccess,fetchUsers,users,departments} : {
        user:UserType,
        setUser: React.Dispatch<React.SetStateAction<UserType | null>>
        token: string,
        setSuccess:  React.Dispatch<React.SetStateAction<string>>,
        fetchUsers : () => Promise<void>,
        users : UserType[],
        departments: Department[],
        setError : React.Dispatch<React.SetStateAction<string>>
    }
) => {
    // NOTE(added): a single consolidated "Edit user" modal - a GLOBAL_ADMIN
    // can change absolutely anything PATCH /users/:id accepts (role, the
    // department they head as HOD/CXO, agent department transfer, category
    // routing, Wind Category, Zone, support tier, active status, assignment
    // availability, and max active ticket capacity) for any staff member,
    // from one place. See EditUserModal.tsx.
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");

    // --- Requestor-side state (previously RequestorDirectory.tsx) ---
    const [requestors, setRequestors] = useState<RequestorDirectoryEntry[]>([]);
    const [requestorsLoading, setRequestorsLoading] = useState(true);
    const [messagingId, setMessagingId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState<BulkInviteResult | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<UserType | null>(null);
    const [requestorToDelete, setRequestorToDelete] = useState<RequestorDirectoryEntry | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fetchRequestors = async () => {
      setRequestorsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/requestors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setRequestors(data);
      } catch {
        setError("Failed to load requestor directory");
      } finally {
        setRequestorsLoading(false);
      }
    };

    useEffect(() => {
      fetchRequestors();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaved = async (message: string) => {
        setSuccess(message);
        // A save from either "side" of the directory can move someone
        // between the two lists (e.g. promoting a REQUESTER to AGENT, or
        // demoting an AGENT back to REQUESTER via the same Edit user modal),
        // so refresh both the staff list and the requestor list every time.
        await Promise.all([fetchUsers(), fetchRequestors()]);
    };

    // NOTE(added): the Edit user modal (EditUserModal.tsx) was built around
    // the staff `UserType` shape. Requesters are fetched separately (a
    // lighter-weight `RequestorDirectoryEntry`), so this adapts one into a
    // `UserType`-shaped object with sensible REQUESTER defaults for the
    // fields it doesn't carry (isAvailableForAssignment, maxActiveTickets,
    // etc. - all AGENT-only routing inputs anyway). Editing still goes
    // through the same PATCH /users/:id the staff flow uses, which already
    // works for a REQUESTER-role account.
    const openEditForRequestor = (r: RequestorDirectoryEntry) => {
      setEditingUser({
        id: r.id,
        companyId: "",
        email: r.email,
        fullName: r.fullName,
        employeeId: r.employeeId,
        departments: [],
        departmentId: undefined,
        role: "REQUESTER" as UserRole,
        supportLevel: undefined,
        isActive: r.isActive,
        isAvailableForAssignment: true,
        maxActiveTickets: 0,
        state: null,
        windCategory: null,
        _count: { ticketsAssigned: 0 },
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      });
    };

    // NOTE(added): staff rows only ever had "Edit user" - requester rows
    // already had Block/Unblock. So that Actions are consistent for
    // everyone in the directory, staff now get the same Block/Unblock
    // toggle too (via PATCH /users/:id, the same endpoint the Edit modal's
    // "Active" checkbox already uses - see user.controller.ts).
    const toggleStaffActive = async (u: UserType) => {
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/users/${u.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !u.isActive }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");
        setSuccess(u.isActive ? "User blocked." : "User unblocked.");
        await fetchUsers();
      } catch (err: any) {
        setError(err.message);
      }
    };

    const handleDeleteStaff = async (u: UserType) => {
      setStaffToDelete(null);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/users/${u.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete user");

        const summary = data.ticketReassignmentSummary as
          | { reassigned: { ticketNumber: string }[]; unassigned: { ticketNumber: string }[] }
          | null;
        if (summary && (summary.reassigned.length > 0 || summary.unassigned.length > 0)) {
          setSuccess(
            `${u.fullName} deleted. ${summary.reassigned.length} ticket(s) redistributed to other agents` +
              (summary.unassigned.length > 0 ? `, ${summary.unassigned.length} left unassigned (no other agents in department).` : ".")
          );
        } else {
          setSuccess(`${u.fullName} deleted.`);
        }
        await fetchUsers();
      } catch (err: any) {
        setError(err.message);
      }
    };

    const runAction = async (id: string, action: "approve" | "reject" | "block" | "unblock", successMsg: string) => {
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/admin/requestors/${id}/${action}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to ${action} requestor`);
        setSuccess(successMsg);
        fetchRequestors();
      } catch (err: any) {
        setError(err.message);
      }
    };

    const handleDelete = async (id: string) => {
      setRequestorToDelete(null);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/admin/requestors/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete requestor");
        setSuccess("Requestor deleted.");
        fetchRequestors();
      } catch (err: any) {
        setError(err.message);
      }
    };

    const handleSendMessage = async (id: string) => {
      if (!messageText.trim()) return;
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/admin/requestors/${id}/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: messageText.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send message");
        setSuccess("Message sent to requestor.");
        setMessagingId(null);
        setMessageText("");
      } catch (err: any) {
        setError(err.message);
      }
    };

    // Downloads a blank Excel template the admin fills in with requestor
    // names + emails, then re-uploads via "Bulk Upload".
    const handleDownloadTemplate = () => {
      setShowUploadMenu(false);
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["Name", "Email"],
        ["Jane Doe", "jane.doe@example.com"],
      ]);
      worksheet["!cols"] = [{ wch: 28 }, { wch: 32 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Requestors");
      XLSX.writeFile(workbook, "requestor_bulk_invite_template.xlsx");
    };

    const handleUploadClick = () => {
      setShowUploadMenu(false);
      fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file later
      if (!file) return;

      setError("");
      setSuccess("");
      setBulkResult(null);

      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Accept "Name"/"name" and "Email"/"email" header variants.
        const requestorsPayload = rows
          .map((row) => {
            const keyMap = Object.keys(row).reduce((acc, k) => {
              acc[k.trim().toLowerCase()] = row[k];
              return acc;
            }, {} as Record<string, any>);
            return {
              name: String(keyMap["name"] ?? "").trim(),
              email: String(keyMap["email"] ?? "").trim(),
            };
          })
          .filter((r) => r.name || r.email);

        if (requestorsPayload.length === 0) {
          setError("No rows found in the uploaded file. Use the template and fill in Name + Email.");
          return;
        }

        setUploading(true);
        const res = await fetch(`${API_BASE}/admin/requestors/bulk-invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ requestors: requestorsPayload })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Bulk invite failed");

        setBulkResult(data);
        setSuccess(`Bulk invite complete: ${data.createdCount} invited, ${data.skippedCount} skipped.`);
        fetchRequestors();
      } catch (err: any) {
        setError(err.message || "Failed to process the uploaded file");
      } finally {
        setUploading(false);
      }
    };

    const pendingCount = requestors.filter(r => r.approvalStatus === "PENDING").length;

    const showStaff = roleFilter === "ALL" || roleFilter !== ("REQUESTER" as UserRole);
    const showRequesters = roleFilter === "ALL" || roleFilter === ("REQUESTER" as UserRole);

    const filteredStaff = showStaff
      ? (roleFilter === "ALL" ? users : users.filter(u => u.role === roleFilter))
      : [];
    const filteredRequestors = showRequesters ? requestors : [];

    const loading = requestorsLoading;

    return (
        <div className="space-y-6 font-sans">
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Directory</h1>
                  <p className="text-sm text-slate-500 mt-1">Every account in the system - staff and requesters - in one place.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {pendingCount > 0 && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                      {pendingCount} pending approval
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowUploadMenu((v) => !v)}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Upload size={14} />
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                    {showUploadMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUploadMenu(false)} />
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                          <button
                            onClick={handleDownloadTemplate}
                            className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                          >
                            <FileDown size={16} className="text-slate-500 mt-0.5" />
                            <span>
                              <span className="block text-xs font-semibold text-slate-900">Download template</span>
                              <span className="block text-[11px] text-slate-500">Excel file with Name + Email columns</span>
                            </span>
                          </button>
                          <button
                            onClick={handleUploadClick}
                            className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
                          >
                            <FileUp size={16} className="text-slate-500 mt-0.5" />
                            <span>
                              <span className="block text-xs font-semibold text-slate-900">Bulk upload &amp; invite</span>
                              <span className="block text-[11px] text-slate-500">Upload the filled template to send invites</span>
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileSelected}
                    />
                  </div>
                </div>
              </div>

              {/* Role filter tabs */}
              <div className="flex flex-wrap gap-2">
                {ROLE_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setRoleFilter(f.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      roleFilter === f.value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {bulkResult && (
                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Bulk invite results</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bulkResult.createdCount} invited &middot; {bulkResult.skippedCount} skipped of {bulkResult.totalRows} rows
                      </p>
                    </div>
                    <button
                      onClick={() => setBulkResult(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  {bulkResult.skipped.length > 0 && (
                    <div className="border border-slate-100 rounded-lg overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Reason skipped</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {bulkResult.skipped.map((s, i) => (
                            <tr key={`${s.email}-${i}`}>
                              <td className="px-4 py-2">{s.name || "—"}</td>
                              <td className="px-4 py-2 font-mono">{s.email || "—"}</td>
                              <td className="px-4 py-2">{s.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[820px] w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">User</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Email Address</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Role</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Tickets</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loading ? (
                        <tr><td colSpan={5} className="px-6 py-6 text-center text-slate-400">Loading...</td></tr>
                      ) : (filteredStaff.length === 0 && filteredRequestors.length === 0) ? (
                        <tr><td colSpan={5} className="px-6 py-6 text-center text-slate-400 italic">No users match this filter.</td></tr>
                      ) : (
                        <>
                          {/* Staff rows: GLOBAL_ADMIN / CXO / HOD / AGENT */}
                          {filteredStaff.map(u => (
                            <tr key={`staff-${u.id}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap max-w-[200px] truncate">{u.fullName}</td>
                              <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap max-w-[220px] truncate">{u.email}</td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">{u.role}</td>
                              <td className="px-6 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                                {u._count.ticketsAssigned || 0} / {u.maxActiveTickets || 0}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-start gap-1.5 flex-wrap min-w-[160px] items-center">
                                  <button
                                    onClick={() => setEditingUser(u)}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    Edit user
                                  </button>
                                  {u.isActive ? (
                                    <button
                                      onClick={() => toggleStaffActive(u)}
                                      title="Block"
                                      className="p-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                                    >
                                      <Ban size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => toggleStaffActive(u)}
                                      title="Unblock"
                                      className="p-1.5 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
                                    >
                                      <CheckCircle2 size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setStaffToDelete(u)}
                                    title="Delete"
                                    className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {/* Requester rows: self-registered users */}
                          {filteredRequestors.map(r => (
                            <tr key={`requester-${r.id}`} className="hover:bg-slate-50/50 transition-colors align-top">
                              <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap max-w-[200px] truncate">{r.fullName}</td>
                              <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap max-w-[220px] truncate">{r.email}</td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">REQUESTER</td>
                              <td className="px-6 py-4 font-mono font-semibold whitespace-nowrap">{r._count.ticketsRequested}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-start gap-1.5 flex-wrap min-w-[140px] items-center">
                                  <button
                                    onClick={() => openEditForRequestor(r)}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                                  >
                                    Edit user
                                  </button>
                                  {r.approvalStatus === "PENDING" && (
                                    <>
                                      <button
                                        onClick={() => runAction(r.id, "approve", "Requestor approved.")}
                                        title="Approve"
                                        className="p-1.5 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
                                      >
                                        <ShieldCheck size={14} />
                                      </button>
                                      <button
                                        onClick={() => runAction(r.id, "reject", "Requestor rejected.")}
                                        title="Reject"
                                        className="p-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                                      >
                                        <ShieldX size={14} />
                                      </button>
                                    </>
                                  )}
                                  {r.approvalStatus !== "PENDING" && (
                                    r.isActive ? (
                                      <button
                                        onClick={() => runAction(r.id, "block", "Requestor blocked.")}
                                        title="Block"
                                        className="p-1.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
                                      >
                                        <Ban size={14} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => runAction(r.id, "unblock", "Requestor unblocked.")}
                                        title="Unblock"
                                        className="p-1.5 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 cursor-pointer"
                                      >
                                        <CheckCircle2 size={14} />
                                      </button>
                                    )
                                  )}
                                  <button
                                    onClick={() => setRequestorToDelete(r)}
                                    title="Delete"
                                    className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingUser && (
                <EditUserModal
                  targetUser={editingUser}
                  departments={departments}
                  token={token}
                  onClose={() => setEditingUser(null)}
                  onSaved={handleSaved}
                  setError={setError}
                />
              )}

              {/* Message modal (requesters) */}
              {messagingId && (
                <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50">
                  <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                      Message User
                    </h2>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      placeholder="Type a message for this user..."
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                      <button
                        onClick={() => setMessagingId(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendMessage(messagingId)}
                        disabled={!messageText.trim()}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmDialog
                open={!!staffToDelete}
                title="Delete user"
                message={
                  staffToDelete
                    ? staffToDelete.role === "AGENT"
                      ? `Delete ${staffToDelete.fullName}? This can't be undone. Any tickets currently assigned to them will be automatically redistributed to other agents in their department.`
                      : `Delete ${staffToDelete.fullName}? This can't be undone.`
                    : ""
                }
                onConfirm={() => staffToDelete && handleDeleteStaff(staffToDelete)}
                onCancel={() => setStaffToDelete(null)}
              />

              <ConfirmDialog
                open={!!requestorToDelete}
                title="Delete requestor"
                message={
                  requestorToDelete
                    ? `Delete ${requestorToDelete.fullName}? This account will be permanently removed and this can't be undone.`
                    : ""
                }
                onConfirm={() => requestorToDelete && handleDelete(requestorToDelete.id)}
                onCancel={() => setRequestorToDelete(null)}
              />
            </div>
    )
}

