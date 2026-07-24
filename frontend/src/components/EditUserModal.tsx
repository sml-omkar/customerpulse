import { useEffect, useState } from "react";
import { User as UserType, Department, UserRole, SupportLevel, TicketCategory, WindCategory } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import API_BASE from "../lib/api";

// All roles a GLOBAL_ADMIN can move ANY staff member into. Unlike the old
// "Edit role" flow (which only allowed a handful of fixed transitions),
// PATCH /users/:id (see backend/src/controllers/user.controller.ts) accepts
// any role for any user, so every option is offered here and the backend
// remains the source of truth for what's actually allowed (e.g. rejecting a
// promotion into an HOD/CXO seat that's already taken).
const ALL_ROLES: UserRole[] = [
  "GLOBAL_ADMIN",
  "HOD",
  "CXO",
  "AGENT",
  "REQUESTER",
] as UserRole[];

const SUPPORT_LEVELS: SupportLevel[] = ["L1", "L2"] as SupportLevel[];

// Mirrors backend/src/utils/zoneStateMap.ts - kept here only to drive the
// Zone picker and to reverse-map a stored `state` string back to the Zone
// that produced it. The backend remains the source of truth; it re-resolves
// whichever Zone name is sent rather than trusting a state list from the
// client.
const ZONE_STATE_MAP: Record<string, string[]> = {
  "North": ["Delhi", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh", "Madhya Pradesh", "Punjab", "Uttar Pradesh", "Uttarakhand"],
  "West 1": ["Goa", "Maharashtra"],
  "West 2": ["Dadra & Nagar Haveli", "Daman & Diu", "Gujarat", "Rajasthan"],
  "South 1": ["Karnataka", "Kerala"],
  "South 2": ["Andaman & Nicobar Islands", "Andhra Pradesh", "Lakshadweep", "Puducherry", "Tamil Nadu", "Telangana"],
  "East": ["Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Jharkhand", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Sikkim", "Tripura", "West Bengal"],
};
const ZONES = Object.keys(ZONE_STATE_MAP);

const zoneFromState = (state?: string | null): string => {
  if (!state) return "";
  const match = Object.entries(ZONE_STATE_MAP).find(([, states]) => states.join(", ") === state);
  return match ? match[0] : "";
};

type ReassignmentSummary = {
  reassigned: { ticketNumber: string; newAssigneeName: string }[];
  unassigned: { ticketNumber: string }[];
} | null;

interface EditUserModalProps {
  targetUser: UserType;
  departments: Department[];
  token: string;
  onClose: () => void;
  onSaved: (message: string) => Promise<void> | void;
  setError: (msg: string) => void;
}

/**
 * Single, unified "Edit user" modal for GLOBAL_ADMIN - replaces the old
 * split "Edit role" / "Edit routing" flows. Every field PATCH /users/:id
 * accepts is editable from here: role (+ headDepartmentId when promoting
 * into HOD/CXO), agent department transfer, category routing, Wind
 * Category, Zone, support tier, active status, assignment availability,
 * and max active ticket capacity.
 */
export const EditUserModal = ({ targetUser, departments, token, onClose, onSaved, setError }: EditUserModalProps) => {
  const [role, setRole] = useState<UserRole>(targetUser.role);
  const [headDepartmentId, setHeadDepartmentId] = useState("");
  const [departmentId, setDepartmentId] = useState(targetUser.departmentId || "");
  const [supportLevel, setSupportLevel] = useState<SupportLevel | "">(targetUser.supportLevel || "");
  const [isActive, setIsActive] = useState(true);
  const [isAvailableForAssignment, setIsAvailableForAssignment] = useState(targetUser.isAvailableForAssignment);
  const [maxActiveTickets, setMaxActiveTickets] = useState(String(targetUser.maxActiveTickets ?? 0));
  const [windCategory, setWindCategory] = useState<WindCategory | "">(targetUser.windCategory || "");
  const [zone, setZone] = useState(zoneFromState(targetUser.state) || "");

  const [deptCategories, setDeptCategories] = useState<TicketCategory[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [originalCategoryIds, setOriginalCategoryIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAgentTarget = role === "AGENT";
  const needsHeadDepartment = role === "HOD" || role === "CXO";

  // headDepartmentId is left blank by default - if the admin doesn't pick
  // one, PATCH /users/:id falls back to whatever department this person
  // already heads (see user.controller.ts), so a plain HOD<->CXO swap "in
  // place" doesn't require re-selecting the same department here.

  // Load this user's current category routing once, up front.
  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    fetch(`${API_BASE}/users/${targetUser.id}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((links: { categoryId: string }[]) => {
        if (cancelled) return;
        const ids = links.map((l) => l.categoryId);
        setCategoryIds(ids);
        setOriginalCategoryIds(ids);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load this user's current category routing");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUser.id]);

  // Re-fetch the category list whenever the selected (agent) department
  // changes, so the checklist always reflects that department's categories.
  useEffect(() => {
    if (!isAgentTarget || !departmentId) {
      setDeptCategories([]);
      return;
    }
    fetch(`${API_BASE}/departments/${departmentId}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeptCategories(data))
      .catch(() => setDeptCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, isAgentTarget]);

  const toggleCategory = (categoryId: string) => {
    setCategoryIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]));
  };

  const roleChanged = role !== targetUser.role;
  const departmentChanged = isAgentTarget && departmentId !== (targetUser.departmentId || "");
  const needsConfirm = roleChanged || departmentChanged;

  const requestSave = () => {
    if (needsHeadDepartment && !headDepartmentId) {
      setError("Select which department they'll head as " + role);
      return;
    }
    if (needsConfirm) {
      setConfirmOpen(true);
    } else {
      save();
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/${targetUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          ...(needsHeadDepartment ? { headDepartmentId } : {}),
          ...(isAgentTarget ? { departmentId: departmentId || null } : {}),
          supportLevel: supportLevel || null,
          isActive,
          isAvailableForAssignment,
          maxActiveTickets: Number(maxActiveTickets) || 0,
          ...(isAgentTarget ? { windCategory: windCategory || null, zone: zone || null } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update user");
        return;
      }

      // Categories only ever apply to (and are only ever shown for) AGENT
      // targets - diff against what was originally checked and sync via the
      // categoryAgent endpoints.
      if (isAgentTarget) {
        const toAdd = categoryIds.filter((id) => !originalCategoryIds.includes(id));
        const toRemove = originalCategoryIds.filter((id) => !categoryIds.includes(id));
        for (const categoryId of toAdd) {
          await fetch(`${API_BASE}/categories/${categoryId}/agents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: targetUser.id }),
          });
        }
        for (const categoryId of toRemove) {
          await fetch(`${API_BASE}/categories/${categoryId}/agents/${targetUser.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      const summary = data.ticketReassignmentSummary as ReassignmentSummary;
      let message = `${targetUser.fullName}'s profile was updated.`;
      if (summary) {
        if (summary.reassigned.length > 0) {
          message += ` ${summary.reassigned.length} ticket(s) auto-assigned to other agents.`;
        }
        if (summary.unassigned.length > 0) {
          message += ` ${summary.unassigned.length} ticket(s) left unassigned (no agents available in the department).`;
        }
      }
      await onSaved(message);
      onClose();
    } catch {
      setError("Failed to update user");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const confirmMessage = (() => {
    if (roleChanged) {
      const deptName = needsHeadDepartment ? departments.find((d) => d.id === headDepartmentId)?.name : undefined;
      const roleChangedAwayFromAgent = targetUser.role === "AGENT" && role !== "AGENT";
      const base = `Change ${targetUser.fullName}'s role from ${targetUser.role} to ${role}${deptName ? ` of ${deptName}` : ""}?`;
      return roleChangedAwayFromAgent
        ? `${base} Their currently assigned open tickets (in their old agent department) will be auto-assigned to other agents there, or left unassigned if none are available.`
        : base;
    }
    if (departmentChanged) {
      return `Move ${targetUser.fullName} to ${departments.find((d) => d.id === departmentId)?.name || "no department"}? Their currently assigned open tickets in their old department will be auto-assigned to other agents there, or left unassigned if none are available.`;
    }
    return "";
  })();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4"
        role="presentation"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
        >
          <h2 className="text-sm font-bold text-slate-900">Edit user - {targetUser.fullName}</h2>
          <p className="text-xs text-slate-500 mt-1">{targetUser.email}</p>

          {roleChanged && targetUser.role === "AGENT" && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-3">
              Changing this agent's role auto-assigns their open tickets to other agents in the department,
              or leaves them unassigned if none are available. You'll be notified with the full breakdown.
            </p>
          )}

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {needsHeadDepartment && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600">Department they'll head as {role}</label>
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
                Doesn't have to be {targetUser.fullName}'s current department. Leave unset to keep their current seat.
              </p>
            </div>
          )}

          {isAgentTarget && (
            <>
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setCategoryIds([]);
                  }}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {departmentChanged && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Transferring departments auto-assigns their open tickets in the old department to other
                    agents there, or leaves them unassigned if none are available.
                  </p>
                )}
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600">Wind Category</label>
                <select
                  value={windCategory}
                  onChange={(e) => setWindCategory(e.target.value as WindCategory | "")}
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
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                >
                  <option value="">Not set</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
                {zone && (
                  <p className="text-[11px] text-slate-400 mt-1">Covers: {ZONE_STATE_MAP[zone]?.join(", ")}</p>
                )}
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600">Categories</label>
                {loadingCategories ? (
                  <p className="text-[11px] text-slate-400 mt-1.5">Loading...</p>
                ) : !departmentId ? (
                  <p className="text-[11px] text-slate-400 mt-1.5">Select a department to see its categories.</p>
                ) : deptCategories.length === 0 ? (
                  <p className="text-[11px] text-slate-400 mt-1.5">This department has no categories yet.</p>
                ) : (
                  <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                    {deptCategories.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-600 px-1 py-1">
                        <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600">Max active tickets</label>
                <input
                  type="number"
                  min={0}
                  value={maxActiveTickets}
                  onChange={(e) => setMaxActiveTickets(e.target.value)}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isAvailableForAssignment}
                  onChange={(e) => setIsAvailableForAssignment(e.target.checked)}
                />
                Available for new assignments
              </label>
            </>
          )}

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-600">Support tier</label>
            <select
              value={supportLevel}
              onChange={(e) => setSupportLevel(e.target.value as SupportLevel | "")}
              className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700"
            >
              <option value="">Not set</option>
              {SUPPORT_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-4 py-2.5 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={saving || (needsHeadDepartment && !headDepartmentId)}
              onClick={requestSave}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={roleChanged ? "Confirm role change" : "Confirm department transfer"}
        message={confirmMessage}
        confirmLabel={roleChanged ? "Change role" : "Transfer"}
        onConfirm={save}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default EditUserModal;
