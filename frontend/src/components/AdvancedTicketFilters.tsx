// Key/value filter search engine for tickets.
//
// "Keys" are the fields a person can filter on (status, category,
// department, client, project, state, internal priority, date of
// occurrence, SLA deadline, a custom date range, ...). "Values" are
// whatever actually shows up in the tickets this person has access to -
// dropdowns are always derived from the `tickets` prop itself, never from
// a global master list, so a HOD/CXO only ever sees the departments,
// categories, clients, projects, and states that appear in tickets they
// can already see (their assigned department(s) + their own tickets).
//
// NOTE(changed): the searchable "priority" key is internal priority, not
// the customer-facing SLA priority (P1-P4) - internal priority is the
// triage metric staff actually search by, so it replaces the plain
// priority filter here.
//
// Role access this filter enforces client-side (mirrors the backend
// GET /tickets scoping in ticket.controller.ts):
//   - GLOBAL_ADMIN: everything.
//   - CXO / HOD: identical access - tickets in their assigned department(s),
//     plus tickets they personally raised.
//   - AGENT: only tickets assigned to them, or raised by them.
//
// LAYOUT (redesigned): this used to render as one large always-expanded
// card - a dozen selects plus two date-range rows - on every page that
// used it. It's now a slim, single-row toolbar (search box + a "Filters"
// button carrying an active-count badge + "Clear") and the actual filter
// controls live in a panel that's collapsed by default and only mounts
// when toggled open. The search input is also exported on its own
// (`TicketSearchBar`) in case a page wants just the search box without
// the rest of the filter chrome.
import React, { useState, useMemo, useEffect } from "react";
import { Ticket, TicketStatus, InternalPriorityLevel, UserRole } from "../types";
import { Filter, X, Search, ChevronDown } from "lucide-react";

// Loosened on purpose: callers (ManagerDashboard/CxoDashboard) only ever
// have the {id, name} shape available for departments/categories in scope,
// not the full master-list Department/TicketCategory records.
export interface FilterOption {
  id: string;
  name: string;
}

interface AdvancedTicketFiltersProps {
  tickets: Ticket[];
  departments: FilterOption[];
  categories: FilterOption[];
  onFilteredTicketsChange: (filtered: Ticket[]) => void;
  userRole: UserRole | string;
  userDepartmentIds?: string[];
  userId?: string; // for AGENT own/assigned scoping, and HOD/CXO "my own tickets"
}

const DEPARTMENT_SCOPED_ROLES: string[] = [UserRole.HOD, UserRole.CXO];

// Standalone search box - separated out so a page can drop just the
// search input somewhere (e.g. a table toolbar) without pulling in the
// whole filter panel.
interface TicketSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TicketSearchBar: React.FC<TicketSearchBarProps> = ({ value, onChange, placeholder, className }) => (
  <div className={`relative flex-1 min-w-[200px] ${className || ""}`}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input
      type="text"
      placeholder={placeholder || "Search title, #, client, requester..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:outline-none"
    />
  </div>
);

export const AdvancedTicketFilters: React.FC<AdvancedTicketFiltersProps> = ({
  tickets,
  departments,
  categories,
  onFilteredTicketsChange,
  userRole,
  userDepartmentIds = [],
  userId,
}) => {
  // Collapsed by default - this is the whole point of the redesign: the
  // dozen selects + date ranges below only mount once someone actually
  // asks for them.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [internalPriorityFilter, setInternalPriorityFilter] = useState<InternalPriorityLevel | "">("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [slaBreachedFilter, setSlaBreachedFilter] = useState(false);

  // Custom date filter (ticket filed/created date)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Date of occurrence range
  const [occurredFrom, setOccurredFrom] = useState("");
  const [occurredTo, setOccurredTo] = useState("");
  // SLA deadline range
  const [slaFrom, setSlaFrom] = useState("");
  const [slaTo, setSlaTo] = useState("");

  // Tickets this role is actually allowed to see, BEFORE any filter picks
  // are applied - this is also what every dropdown's option list is
  // derived from, so a person never sees a value (department, client, ...)
  // that doesn't appear in a ticket they have access to.
  const scopedTickets = useMemo(() => {
    if (userRole === UserRole.GLOBAL_ADMIN) return tickets;
    if (DEPARTMENT_SCOPED_ROLES.includes(userRole as string)) {
      return tickets.filter(
        (t) => userDepartmentIds.includes(t.departmentId || "") || t.requesterId === userId
      );
    }
    if (userRole === UserRole.AGENT) {
      return tickets.filter((t) => t.assigneeId === userId || t.requesterId === userId);
    }
    return tickets;
  }, [tickets, userRole, userDepartmentIds, userId]);

  // Dynamic options - only values present in tickets this person can see.
  const availableStatuses = useMemo(
    () => [...new Set(scopedTickets.map((t) => t.status))].sort(),
    [scopedTickets]
  );
  const availableInternalPriorities = useMemo(
    () => [...new Set(scopedTickets.map((t) => t.internalPriority).filter(Boolean))].sort(),
    [scopedTickets]
  );
  const availableDepartments = useMemo(() => {
    const deptIds = new Set(scopedTickets.map((t) => t.departmentId));
    return departments.filter((d) => deptIds.has(d.id));
  }, [scopedTickets, departments]);
  // Agent-wise filtering for GLOBAL_ADMIN/CXO/HOD - option list is derived
  // from scopedTickets (so it only ever contains agents belonging to the
  // department(s) this person already has access to), and narrows further
  // to just the selected department when one is picked, mirroring how
  // availableCategories/availableClients narrow with departmentFilter.
  const availableAgents = useMemo(() => {
    const byDept = departmentFilter
      ? scopedTickets.filter((t) => t.departmentId === departmentFilter)
      : scopedTickets;
    const map = new Map<string, string>();
    byDept.forEach((t) => {
      if (t.assigneeId && t.assignee?.fullName) map.set(t.assigneeId, t.assignee.fullName);
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scopedTickets, departmentFilter]);
  const availableCategories = useMemo(() => {
    const catIds = new Set(scopedTickets.map((t) => t.categoryId).filter(Boolean));
    return categories.filter((c) => catIds.has(c.id));
  }, [scopedTickets, categories]);
  const availableClients = useMemo(
    () => [...new Set(scopedTickets.map((t) => t.clientName).filter(Boolean))].sort(),
    [scopedTickets]
  );
  const availableProjects = useMemo(() => {
    const map = new Map<string, string>();
    scopedTickets.forEach((t) => {
      if (t.projectId && t.project?.name) map.set(t.projectId, t.project.name);
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [scopedTickets]);
  const availableStates = useMemo(
    () => [...new Set(scopedTickets.map((t) => t.state).filter(Boolean))].sort(),
    [scopedTickets]
  );

  // Core filtering (role-aware scope + every key/value filter above it)
  const filteredTickets = useMemo(() => {
    return scopedTickets.filter((ticket) => {
      const matchesSearch =
        !searchTerm ||
        [ticket.title, ticket.description, ticket.ticketNumber, ticket.clientName, ticket.requester?.fullName].some((field) =>
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesInternalPriority = !internalPriorityFilter || ticket.internalPriority === internalPriorityFilter;
      const matchesCategory = !categoryFilter || ticket.categoryId === categoryFilter;
      const matchesDept = !departmentFilter || ticket.departmentId === departmentFilter;
      const matchesAgent = !agentFilter || ticket.assigneeId === agentFilter;
      const matchesClient = !clientFilter || ticket.clientName === clientFilter;
      const matchesProject = !projectFilter || ticket.projectId === projectFilter;
      const matchesState = !stateFilter || ticket.state === stateFilter;
      const matchesSla = !slaBreachedFilter || !!ticket.slaBreached;

      // Custom date filter - date the ticket was filed.
      const createdAt = new Date(ticket.createdAt);
      const matchesCreated =
        (!dateFrom || createdAt >= new Date(dateFrom)) &&
        (!dateTo || createdAt <= new Date(dateTo + "T23:59:59"));

      // Date of occurrence range.
      const occurredAt = ticket.dateOfOccurance ? new Date(ticket.dateOfOccurance) : null;
      const matchesOccurred =
        (!occurredFrom || (occurredAt && occurredAt >= new Date(occurredFrom))) &&
        (!occurredTo || (occurredAt && occurredAt <= new Date(occurredTo + "T23:59:59")));

      // SLA deadline range.
      const slaDeadline = ticket.slaDeadline ? new Date(ticket.slaDeadline) : null;
      const matchesSlaDeadline =
        (!slaFrom || (slaDeadline && slaDeadline >= new Date(slaFrom))) &&
        (!slaTo || (slaDeadline && slaDeadline <= new Date(slaTo + "T23:59:59")));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesInternalPriority &&
        matchesDept &&
        matchesAgent &&
        matchesCategory &&
        matchesClient &&
        matchesProject &&
        matchesState &&
        matchesSla &&
        matchesCreated &&
        matchesOccurred &&
        matchesSlaDeadline
      );
    });
  }, [
    scopedTickets,
    searchTerm,
    statusFilter,
    internalPriorityFilter,
    departmentFilter,
    agentFilter,
    categoryFilter,
    clientFilter,
    projectFilter,
    stateFilter,
    slaBreachedFilter,
    dateFrom,
    dateTo,
    occurredFrom,
    occurredTo,
    slaFrom,
    slaTo,
  ]);

  useEffect(() => {
    onFilteredTicketsChange(filteredTickets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTickets]);

  // If the department changes to one that doesn't include the currently
  // selected agent, drop the (now stale/invalid) agent selection rather
  // than silently filtering to zero results.
  useEffect(() => {
    if (agentFilter && !availableAgents.some((a) => a.id === agentFilter)) {
      setAgentFilter("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableAgents]);

  const reset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setInternalPriorityFilter("");
    setDepartmentFilter("");
    setAgentFilter("");
    setCategoryFilter("");
    setClientFilter("");
    setProjectFilter("");
    setStateFilter("");
    setSlaBreachedFilter(false);
    setDateFrom("");
    setDateTo("");
    setOccurredFrom("");
    setOccurredTo("");
    setSlaFrom("");
    setSlaTo("");
  };

  // Count of active filters, NOT counting the search box - drives the
  // badge on the "Filters" toggle so people can tell at a glance whether
  // anything is narrowed down without having to open the panel.
  const activeFilterCount =
    [statusFilter, internalPriorityFilter, departmentFilter, agentFilter, categoryFilter, clientFilter, projectFilter, stateFilter].filter(Boolean).length +
    (slaBreachedFilter ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (occurredFrom || occurredTo ? 1 : 0) +
    (slaFrom || slaTo ? 1 : 0);

  const hasAnythingToClear = !!searchTerm || activeFilterCount > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6">
      {/* Always-visible toolbar: search (separated out) + filter toggle + clear.
          This replaces the old always-expanded card as the thing every page
          actually renders - compact enough to sit anywhere. */}
      <div className="flex flex-wrap items-center gap-2 p-3">
        <TicketSearchBar value={searchTerm} onChange={setSearchTerm} />

        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filtersOpen ? "border-indigo-500 text-indigo-600 bg-indigo-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Filter size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        {hasAnythingToClear && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 whitespace-nowrap px-1">
            <X size={14} /> Clear all
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
          {filteredTickets.length} results &bull; {scopedTickets.length} accessible
        </span>
      </div>

      {/* Collapsible filter panel - hidden until "Filters" is clicked. */}
      {filtersOpen && (
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm pt-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Status</option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select value={internalPriorityFilter} onChange={(e) => setInternalPriorityFilter(e.target.value as any)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Internal Priority</option>
              {availableInternalPriorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Depts</option>
              {availableDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Agent-wise filter - GLOBAL_ADMIN/CXO/HOD only, scoped to the
                department(s) they have access to (and further narrowed to the
                selected department, if any). Not shown for AGENT since agents
                are already scoped to just their own tickets. */}
            {userRole !== UserRole.AGENT && (
              <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
                <option value="">All Agents</option>
                {availableAgents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}

            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Clients</option>
              {availableClients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All Projects</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white">
              <option value="">All States</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={slaBreachedFilter} onChange={(e) => setSlaBreachedFilter(e.target.checked)} className="rounded" />
              <span>SLA Breached</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Custom Date Filter</div>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                <span className="text-slate-400 text-xs">to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date of Occurrence</div>
              <div className="flex items-center gap-2">
                <input type="date" value={occurredFrom} onChange={(e) => setOccurredFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                <span className="text-slate-400 text-xs">to</span>
                <input type="date" value={occurredTo} onChange={(e) => setOccurredTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SLA Deadline</div>
              <div className="flex items-center gap-2">
                <input type="date" value={slaFrom} onChange={(e) => setSlaFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
                <span className="text-slate-400 text-xs">to</span>
                <input type="date" value={slaTo} onChange={(e) => setSlaTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
