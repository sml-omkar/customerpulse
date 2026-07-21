// Key/value filter search engine for tickets - CXO.
//
// CXO access: identical shape to HOD - every ticket across whichever
// department(s) this CXO oversees, plus tickets they personally raised.
// GET /tickets already enforces this server-side (see the CXO branch in
// ticket.controller.ts's list()), and AdvancedTicketFilters mirrors it
// client-side as a second, cheap safety net. Same "fetch once, filter
// client-side" shape as the GLOBAL_ADMIN (GlobalAdminTicketSearch.tsx),
// AGENT (AgentTicketSearch.tsx), and HOD (HODTicketSearch.tsx) searches -
// just scoped to whichever department(s) this CXO oversees.
//
// Previously this lived inline inside CxoDashboard.tsx (the "All
// Department Tickets" toggle) - pulled out here into its own
// page/component, mirroring how the GLOBAL_ADMIN and AGENT searches are
// already split out from their dashboards.
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, RotateCcw, Search } from "lucide-react";
import { Ticket as TicketType, PAGES } from "../types";
import { AdvancedTicketFilters, FilterOption } from "./AdvancedTicketFilters";
import TicketsTable from "./TicketsTable";

interface CxoDepartment {
  id: string;
  name: string;
}

interface CXOTicketSearchProps {
  token: string;
  currentUser: { id: string; fullName: string };
  setSelectedTicketId: (id: string) => void;
  setCurrentView: (view: string) => void;
  apiFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

import API_BASE from "../lib/api";

export const CXOTicketSearch: React.FC<CXOTicketSearchProps> = ({
  token,
  currentUser,
  setSelectedTicketId,
  setCurrentView,
  apiFetch,
}) => {
  const requestFn = apiFetch || window.fetch;

  const [cxoDepartments, setCxoDepartments] = useState<CxoDepartment[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  const [allDeptTickets, setAllDeptTickets] = useState<TicketType[]>([]);
  const [filteredDeptTickets, setFilteredDeptTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The departments this CXO oversees, for the department filter dropdown
  // - fetched here rather than relying on a parent that may not have
  // loaded it yet for this view.
  const fetchCxoDepartments = async () => {
    try {
      const res = await requestFn(`${API_BASE}/cxo-dashboard/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCxoDepartments(data || []);
      }
    } catch {
      // Non-fatal - department filter options just fall back to "not yet loaded".
    }
  };

  // Every ticket across the CXO's department(s) (or a single selected
  // one), plus tickets they personally raised. Backed by the same GET
  // /tickets scoping used elsewhere.
  const fetchAllDeptTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (selectedDeptId) params.set("departmentId", selectedDeptId);
      const res = await requestFn(`${API_BASE}/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllDeptTickets(data.items || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load department tickets");
      }
    } catch {
      setError("Failed to load department tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCxoDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchAllDeptTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeptId, token]);

  // Category options for the filter dropdown - derived from whatever
  // categories actually appear on the tickets this CXO can see, not a
  // separate master-list fetch.
  const categoryOptions: FilterOption[] = useMemo(() => {
    const map = new Map<string, string>();
    allDeptTickets.forEach((t) => {
      if (t.categoryId && t.category?.name) map.set(t.categoryId, t.category.name);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [allDeptTickets]);

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-900 text-white rounded-xl">
              <Search size={16} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Department Tickets</h1>
              <p className="text-sm text-slate-500 mt-1">
                Search and filter tickets across your department(s).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Building2 size={14} className="text-slate-500 shrink-0" />
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">-- All Departments --</option>
                {cxoDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchAllDeptTickets}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition-all bg-white shrink-0"
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <AdvancedTicketFilters
        tickets={allDeptTickets}
        departments={cxoDepartments}
        categories={categoryOptions}
        onFilteredTicketsChange={setFilteredDeptTickets}
        userRole="CXO"
        userDepartmentIds={cxoDepartments.map((d) => d.id)}
        userId={currentUser.id}
      />

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 rounded-xl">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-400">
          Loading department tickets...
        </div>
      ) : (
        <TicketsTable
          tickets={filteredDeptTickets}
          currentView={PAGES.CXO_TICKET_SEARCH}
          setSelectedTicketId={setSelectedTicketId as any}
          setCurrentView={setCurrentView as any}
        />
      )}
    </div>
  );
};

export default CXOTicketSearch;
