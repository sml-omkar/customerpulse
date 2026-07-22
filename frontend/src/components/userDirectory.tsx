import { useEffect, useState } from "react";
import { User as UserType, Department, UserRole, TicketCategory, WindCategory } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import API_BASE from "../lib/api";

// NOTE(added): which roles a GLOBAL_ADMIN can move a staff member *to*,
// keyed by their current role. HOD<->CXO and (elsewhere) REQUESTER->HOD/CXO
// are plain access-level swaps. AGENT->HOD/CXO also triggers the ticket
// hand-off logic on the backend (see user.controller.ts /
// roleChangeReassignment.service.ts).
const ROLE_CHANGE_OPTIONS: Partial<Record<UserRole, UserRole[]>> = {
    AGENT: ["HOD", "CXO"] as UserRole[],
    HOD: ["CXO"] as UserRole[],
    CXO: ["HOD"] as UserRole[],
};

// NOTE(added): mirrors backend/src/utils/zoneStateMap.ts - kept here only
// to drive the Zone picker and to reverse-map a stored `state` string back
// to the Zone that produced it. The backend remains the source of truth;
// it re-resolves whichever Zone name is sent rather than trusting a state
// list from the client.
const ZONE_STATE_MAP: Record<string, string[]> = {
    "North": ["Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh", "Madhya Pradesh", "Punjab", "Uttar Pradesh", "Uttarakhand"],
    "West 1": ["Goa", "Maharashtra"],
    "West 2": ["Dadra & Nagar Haveli", "Daman & Diu", "Gujarat", "Rajasthan"],
    "South 1": ["Karnataka", "Kerala"],
    "South 2": ["Andaman & Nicobar Islands", "Andhra Pradesh", "Lakshadweep", "Puducherry", "Tamil Nadu", "Telangana"],
    "East": ["Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Jharkhand", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Sikkim", "Tripura", "West Bengal"],
};
const ZONES = Object.keys(ZONE_STATE_MAP);

// Best-effort reverse lookup: given the comma-separated state list stored
// on the user (`state`), find which Zone it came from so the "Edit
// routing" modal can preselect it.
const zoneFromState = (state?: string | null): string => {
    if (!state) return "";
    const match = Object.entries(ZONE_STATE_MAP).find(([, states]) => states.join(", ") === state);
    return match ? match[0] : "";
};

export const UserDirectory = (
    {token,setError,setSuccess,fetchUsers,users,departments,user} : {
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
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [pendingRole, setPendingRole] = useState<UserRole | "">("");
    const [headDepartmentId, setHeadDepartmentId] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // NOTE(added): a GLOBAL_ADMIN's other agent-routing edits - department
    // transfer, category assignments, Wind Category, and Zone. Kept in a
    // separate modal/state from the role-change flow above since it's an
    // independent action with its own confirmation (department transfers
    // trigger the same open-ticket reassignment role changes do).
    const [routingUser, setRoutingUser] = useState<UserType | null>(null);
    const [routingDepartmentId, setRoutingDepartmentId] = useState("");
    const [routingWindCategory, setRoutingWindCategory] = useState<WindCategory | "">("");
    const [routingZone, setRoutingZone] = useState("");
    const [routingDeptCategories, setRoutingDeptCategories] = useState<TicketCategory[]>([]);
    const [routingCategoryIds, setRoutingCategoryIds] = useState<string[]>([]);
    const [routingOriginalCategoryIds, setRoutingOriginalCategoryIds] = useState<string[]>([]);
    const [routingLoading, setRoutingLoading] = useState(false);
    const [routingSaving, setRoutingSaving] = useState(false);
    const [routingConfirmOpen, setRoutingConfirmOpen] = useState(false);

    const startEdit = (u: UserType) => {
        setEditingUser(u);
        setPendingRole("");
        setHeadDepartmentId("");
    };

    const needsHeadDepartment = pendingRole === "HOD" || pendingRole === "CXO";

    const startRoutingEdit = async (u: UserType) => {
        setRoutingUser(u);
        setRoutingDepartmentId(u.departmentId || "");
        setRoutingWindCategory(u.windCategory || "");
        setRoutingZone(zoneFromState(u.state) || "");
        setRoutingDeptCategories([]);
        setRoutingCategoryIds([]);
        setRoutingOriginalCategoryIds([]);
        setRoutingLoading(true);
        try {
            const [catRes, linksRes] = await Promise.all([
                u.departmentId
                    ? fetch(`${API_BASE}/departments/${u.departmentId}/categories`, { headers: { Authorization: `Bearer ${token}` } })
                    : Promise.resolve(null),
                fetch(`${API_BASE}/users/${u.id}/categories`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (catRes && catRes.ok) setRoutingDeptCategories(await catRes.json());
            if (linksRes.ok) {
                const links: { categoryId: string }[] = await linksRes.json();
                const ids = links.map((l) => l.categoryId);
                setRoutingCategoryIds(ids);
                setRoutingOriginalCategoryIds(ids);
            }
        } catch {
            setError("Failed to load agent's current routing details");
        } finally {
            setRoutingLoading(false);
        }
    };

    // Re-fetch the category list whenever the admin switches which
    // department is selected in the routing modal - the checklist should
    // always reflect the (possibly newly-picked) department's categories.
    useEffect(() => {
        if (!routingUser) return;
        if (!routingDepartmentId) {
            setRoutingDeptCategories([]);
            return;
        }
        fetch(`${API_BASE}/departments/${routingDepartmentId}/categories`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setRoutingDeptCategories(data))
            .catch(() => setRoutingDeptCategories([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routingDepartmentId]);

    const toggleRoutingCategory = (categoryId: string) => {
        setRoutingCategoryIds((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
    };

    const closeRoutingEdit = () => {
        setRoutingUser(null);
        setRoutingDepartmentId("");
        setRoutingWindCategory("");
        setRoutingZone("");
        setRoutingDeptCategories([]);
        setRoutingCategoryIds([]);
        setRoutingOriginalCategoryIds([]);
    };

    const requestRoutingSave = () => {
        if (!routingUser) return;
        if (routingDepartmentId !== (routingUser.departmentId || "")) {
            setRoutingConfirmOpen(true);
        } else {
            saveRouting();
        }
    };

    const saveRouting = async () => {
        if (!routingUser) return;
        setRoutingSaving(true);
        try {
            const res = await fetch(`${API_BASE}/users/${routingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    departmentId: routingDepartmentId || null,
                    windCategory: routingWindCategory || null,
                    zone: routingZone || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update agent routing");
                return;
            }

            // Only categories belonging to the (possibly new) department are
            // ever shown/checked in the checklist, so diffing against what
            // was originally checked is safe even after a department switch.
            const toAdd = routingCategoryIds.filter((id) => !routingOriginalCategoryIds.includes(id));
            const toRemove = routingOriginalCategoryIds.filter((id) => !routingCategoryIds.includes(id));

            for (const categoryId of toAdd) {
                await fetch(`${API_BASE}/categories/${categoryId}/agents`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userId: routingUser.id }),
                });
            }
            for (const categoryId of toRemove) {
                await fetch(`${API_BASE}/categories/${categoryId}/agents/${routingUser.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const summary = data.ticketReassignmentSummary as
                | { reassigned: { ticketNumber: string; newAssigneeName: string }[]; unassigned: { ticketNumber: string }[] }
                | null;
            let message = `${routingUser.fullName}'s routing details were updated.`;
            if (summary) {
                if (summary.reassigned.length > 0) {
                    message += ` ${summary.reassigned.length} ticket(s) auto-assigned to other agents.`;
                }
                if (summary.unassigned.length > 0) {
                    message += ` ${summary.unassigned.length} ticket(s) left unassigned (no agents available in the department).`;
                }
            }
            setSuccess(message);
            await fetchUsers();
            closeRoutingEdit();
        } catch {
            setError("Failed to update agent routing");
        } finally {
            setRoutingSaving(false);
            setRoutingConfirmOpen(false);
        }
    };

    const requestRoleChange = () => {
        if (!pendingRole) return;
        if (needsHeadDepartment && !headDepartmentId) return;
        setConfirmOpen(true);
    };

    const confirmRoleChange = async () => {
        if (!editingUser || !pendingRole) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    role: pendingRole,
                    ...(needsHeadDepartment ? { headDepartmentId } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to update role");
                return;
            }

            const summary = data.ticketReassignmentSummary as
                | { reassigned: { ticketNumber: string; newAssigneeName: string }[]; unassigned: { ticketNumber: string }[] }
                | null;

            const headDeptName = needsHeadDepartment
                ? departments.find((d) => d.id === headDepartmentId)?.name
                : undefined;

            let message = `${editingUser.fullName} is now ${pendingRole}${headDeptName ? ` for ${headDeptName}` : ""}.`;
            if (summary) {
                if (summary.reassigned.length > 0) {
                    message += ` ${summary.reassigned.length} ticket(s) auto-assigned to other agents.`;
                }
                if (summary.unassigned.length > 0) {
                    message += ` ${summary.unassigned.length} ticket(s) left unassigned (no agents available in the department).`;
                }
            }
            setSuccess(message);
            await fetchUsers();
            setEditingUser(null);
            setPendingRole("");
            setHeadDepartmentId("");
        } catch {
            setError("Failed to update role");
        } finally {
            setSaving(false);
            setConfirmOpen(false);
        }
    };

    return (
        <div className="space-y-6 font-sans">
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Directory</h1>
                <p className="text-sm text-slate-500 mt-1">Staff registry - role profiles and routing caps.</p>
              </div>

              <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">User</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Email Address</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Role Profile</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Support Tier</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Active Status</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Assignment State</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Load count</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {users.map(u => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap max-w-[200px] truncate">{u.fullName}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap max-w-[220px] truncate">{u.email}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">{u.role}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">{u.supportLevel || "--"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] border ${
                              u.isActive 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              {u.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                            {u.isAvailableForAssignment ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                                Available
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Not Available</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                            {u._count.ticketsAssigned || 0} / {u.maxActiveTickets || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {ROLE_CHANGE_OPTIONS[u.role] ? (
                                <button
                                  onClick={() => startEdit(u)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                  Edit role
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs">--</span>
                              )}
                              {u.role === "AGENT" && (
                                <button
                                  onClick={() => startRoutingEdit(u)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  Edit routing
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingUser && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4"
                  role="presentation"
                  onClick={() => setEditingUser(null)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
                  >
                    <h2 className="text-sm font-bold text-slate-900">Change role - {editingUser.fullName}</h2>
                    <p className="text-xs text-slate-500 mt-1">Current role: <span className="font-semibold">{editingUser.role}</span></p>

                    {editingUser.role === "AGENT" && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-3">
                        Promoting an agent auto-assigns their open tickets to other agents in the department,
                        or leaves them unassigned if none are available. You'll be notified with the full breakdown.
                      </p>
                    )}

                    <div className="mt-4 space-y-1.5">
                      {(ROLE_CHANGE_OPTIONS[editingUser.role] || []).map((option) => (
                        <label
                          key={option}
                          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-lg border cursor-pointer ${
                            pendingRole === option ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name="targetRole"
                            checked={pendingRole === option}
                            onChange={() => setPendingRole(option)}
                          />
                          Make {option}
                        </label>
                      ))}
                    </div>

                    {needsHeadDepartment && (
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-slate-600">
                          Department they'll head as {pendingRole}
                        </label>
                        <select
                          value={headDepartmentId}
                          onChange={(e) => setHeadDepartmentId(e.target.value)}
                          className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                        >
                          <option value="">Select a department...</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Doesn't have to be {editingUser.fullName}'s current department.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-5">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-4 py-2.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!pendingRole || saving || (needsHeadDepartment && !headDepartmentId)}
                        onClick={requestRoleChange}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmDialog
                open={confirmOpen}
                title="Confirm role change"
                message={
                  editingUser && pendingRole
                    ? editingUser.role === "AGENT"
                      ? `Change ${editingUser.fullName}'s role to ${pendingRole} of ${departments.find((d) => d.id === headDepartmentId)?.name || "the selected department"}? Their currently assigned open tickets (in their old agent department) will be auto-assigned to other agents there, or left unassigned if none are available.`
                      : needsHeadDepartment
                      ? `Change ${editingUser.fullName}'s role from ${editingUser.role} to ${pendingRole} of ${departments.find((d) => d.id === headDepartmentId)?.name || "the selected department"}?`
                      : `Change ${editingUser.fullName}'s role from ${editingUser.role} to ${pendingRole}?`
                    : ""
                }
                confirmLabel="Change role"
                onConfirm={confirmRoleChange}
                onCancel={() => setConfirmOpen(false)}
              />

              {/* Agent routing edit - department transfer, category
                  assignments, Wind Category, and Zone. Separate modal from
                  the role-change one above since it's an independent
                  admin action. */}
              {routingUser && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4"
                  role="presentation"
                  onClick={closeRoutingEdit}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
                  >
                    <h2 className="text-sm font-bold text-slate-900">Edit routing - {routingUser.fullName}</h2>
                    <p className="text-xs text-slate-500 mt-1">Department, categories, wind category, and zone.</p>

                    {routingLoading ? (
                      <p className="text-xs text-slate-400 mt-4">Loading current routing details...</p>
                    ) : (
                      <>
                        <div className="mt-4">
                          <label className="text-xs font-semibold text-slate-600">Department</label>
                          <select
                            value={routingDepartmentId}
                            onChange={(e) => {
                              setRoutingDepartmentId(e.target.value);
                              setRoutingCategoryIds([]);
                            }}
                            className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                          >
                            <option value="">No department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          {routingDepartmentId !== (routingUser.departmentId || "") && (
                            <p className="text-[11px] text-amber-600 mt-1">
                              Transferring departments auto-assigns their open tickets in the old department to
                              other agents there, or leaves them unassigned if none are available.
                            </p>
                          )}
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-semibold text-slate-600">Wind Category</label>
                          <select
                            value={routingWindCategory}
                            onChange={(e) => setRoutingWindCategory(e.target.value as WindCategory | "")}
                            className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                          >
                            <option value="">Not set</option>
                            <option value="WIND">Wind</option>
                            <option value="NON_WIND">Non-Wind</option>
                            <option value="BOTH">Both</option>
                          </select>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-semibold text-slate-600">Zone</label>
                          <select
                            value={routingZone}
                            onChange={(e) => setRoutingZone(e.target.value)}
                            className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                          >
                            <option value="">Not set</option>
                            {ZONES.map((zone) => (
                              <option key={zone} value={zone}>{zone}</option>
                            ))}
                          </select>
                          {routingZone && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Covers: {ZONE_STATE_MAP[routingZone]?.join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-semibold text-slate-600">Categories</label>
                          {!routingDepartmentId ? (
                            <p className="text-[11px] text-slate-400 mt-1.5">Select a department to see its categories.</p>
                          ) : routingDeptCategories.length === 0 ? (
                            <p className="text-[11px] text-slate-400 mt-1.5">This department has no categories yet.</p>
                          ) : (
                            <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                              {routingDeptCategories.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-600 px-1 py-1">
                                  <input
                                    type="checkbox"
                                    checked={routingCategoryIds.includes(c.id)}
                                    onChange={() => toggleRoutingCategory(c.id)}
                                  />
                                  {c.name}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-2 mt-5">
                      <button
                        onClick={closeRoutingEdit}
                        className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-4 py-2.5 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={routingLoading || routingSaving}
                        onClick={requestRoutingSave}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmDialog
                open={routingConfirmOpen}
                title="Confirm department transfer"
                message={
                  routingUser
                    ? `Move ${routingUser.fullName} to ${departments.find((d) => d.id === routingDepartmentId)?.name || "no department"}? Their currently assigned open tickets in their old department will be auto-assigned to other agents there, or left unassigned if none are available.`
                    : ""
                }
                confirmLabel="Transfer"
                onConfirm={saveRouting}
                onCancel={() => setRoutingConfirmOpen(false)}
              />
            </div>
    )
}
