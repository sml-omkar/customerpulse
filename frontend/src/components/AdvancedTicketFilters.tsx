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
// NOTE(changed): every key/value filter below (status, internal priority,
// department, agent, category, client, project, state) is now multi-select
// - a person can pick several values for the same key at once and a ticket
// matches if it has ANY of the selected values for that key (values across
// different keys are still AND'ed together, same as before).
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
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Ticket, TicketStatus, InternalPriorityLevel, UserRole } from "../types";
import { Filter, X, Search, ChevronDown, Check, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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
      placeholder={placeholder || "Search title, ticket number, client, requester..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:outline-none"
    />
  </div>
);

// Generic multi-select dropdown used for every key/value filter below.
// Renders like a select (button showing a summary label) but opens a
// checkbox list so multiple values can be picked at once.
interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || label
      : `${label} (${selected.length})`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border rounded-xl bg-white text-left truncate ${
          selected.length > 0 ? "border-indigo-300 text-indigo-700" : "border-slate-200 text-slate-700"
        }`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[180px] max-h-64 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No options</div>
          ) : (
            options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                      isChecked ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                    }`}
                  >
                    {isChecked && <Check size={12} className="text-white" />}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleValue(opt.value)}
                    className="sr-only"
                  />
                  <span className="truncate">{opt.label}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

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
  // Every key/value filter is now a list of selected values (multi-select)
  // instead of a single value.
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([]);
  const [internalPriorityFilter, setInternalPriorityFilter] = useState<InternalPriorityLevel[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [agentFilter, setAgentFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<string[]>([]);
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
  // to just the selected department(s) when any are picked, mirroring how
  // availableCategories/availableClients narrow with departmentFilter.
  const availableAgents = useMemo(() => {
    const byDept = departmentFilter.length
      ? scopedTickets.filter((t) => departmentFilter.includes(t.departmentId || ""))
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

  // Core filtering (role-aware scope + every key/value filter above it).
  // Each filter now matches if the ticket's value is IN the selected list
  // (an empty list means "no restriction", same as "" did before).
  const filteredTickets = useMemo(() => {
    return scopedTickets.filter((ticket) => {
      const matchesSearch =
        !searchTerm ||
        [ticket.title, ticket.description, ticket.ticketNumber, ticket.clientName, ticket.requester?.fullName].some((field) =>
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);
      const matchesInternalPriority =
        internalPriorityFilter.length === 0 || (!!ticket.internalPriority && internalPriorityFilter.includes(ticket.internalPriority));
      const matchesCategory = categoryFilter.length === 0 || (!!ticket.categoryId && categoryFilter.includes(ticket.categoryId));
      const matchesDept = departmentFilter.length === 0 || (!!ticket.departmentId && departmentFilter.includes(ticket.departmentId));
      const matchesAgent = agentFilter.length === 0 || (!!ticket.assigneeId && agentFilter.includes(ticket.assigneeId));
      const matchesClient = clientFilter.length === 0 || (!!ticket.clientName && clientFilter.includes(ticket.clientName));
      const matchesProject = projectFilter.length === 0 || (!!ticket.projectId && projectFilter.includes(ticket.projectId));
      const matchesState = stateFilter.length === 0 || (!!ticket.state && stateFilter.includes(ticket.state));
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

  // NOTE(added): open work should surface before resolved history across
  // every ticket search view - AGENT/HOD/CXO's "my queue"/"my department"
  // views as well as GLOBAL_ADMIN's company-wide search. A stable sort
  // (guaranteed by the spec since ES2019) that only distinguishes RESOLVED
  // from everything else, so relative order within each group (e.g.
  // whatever GET /tickets already sorted by) is left untouched.
  const sortedFilteredTickets = useMemo(() => {
    const rank = (t: Ticket) => (t.status === TicketStatus.RESOLVED ? 1 : 0);
    return [...filteredTickets].sort((a, b) => rank(a) - rank(b));
  }, [filteredTickets]);

  useEffect(() => {
    onFilteredTicketsChange(sortedFilteredTickets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedFilteredTickets]);

  // Export every currently-filtered ticket, in the same order shown on
  // screen (respecting search + all key/value + date-range filters, and
  // the open-first ordering above), to an .xlsx workbook with one row per
  // ticket and every field on the Ticket record as its own column.
  const exportToExcel = () => {
    const rows = sortedFilteredTickets.map((t) => ({
      "Ticket Number": t.ticketNumber,
      "Title": t.title,
      "Description": t.description || "",
      "Status": t.status,
      "Priority": t.priority,
      "Internal Priority": t.internalPriority,
      "Department": t.department?.name || "",
      "Category": t.category?.name || "",
      "Project": t.project?.name || "",
      "Client Name": t.clientName,
      "Client Email": t.clientEmail,
      "Requester Name": t.requester?.fullName || "",
      "Requester Email": t.requester?.email || "",
      "Employee ID": t.employeeId || "",
      "Representative": t.representative || "",
      "Designation": t.designation || "",
      "Assignee": t.assignee?.fullName || "",
      "Assignment Method": t.assignmentMethod || "",
      "Assigned At": t.assignedAt || "",
      "Support Level": t.supportLevel || "",
      "Site": t.site,
      "State": t.state,
      "Date of Occurrence": t.dateOfOccurance || "",
      "Due Date": t.dueDate || "",
      "SLA Deadline": t.slaDeadline || "",
      "SLA Breached": t.slaBreached ? "Yes" : "No",
      "SLA Remaining (min)": t.slaRemainingMinutes ?? "",
      "Hold Started At": t.holdStartedAt || "",
      "Total Hold Minutes": t.totalHoldMinutes ?? "",
      "Turn Over Time": t.turnOverTime ?? "",
      "Resolved At": t.resolvedAt || "",
      "Closed At": t.closedAt || "",
      "Tags": (t.tags || []).join(", "),
      "Created At": t.createdAt,
      "Updated At": t.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    XLSX.writeFile(workbook, `tickets-export-${timestamp}.xlsx`);
  };

  // If the department selection changes such that some currently-selected
  // agents no longer belong to any selected department, drop those (now
  // stale/invalid) agent selections rather than silently filtering to zero
  // results.
  useEffect(() => {
    setAgentFilter((prev) => {
      const next = prev.filter((id) => availableAgents.some((a) => a.id === id));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableAgents]);

  const reset = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setInternalPriorityFilter([]);
    setDepartmentFilter([]);
    setAgentFilter([]);
    setCategoryFilter([]);
    setClientFilter([]);
    setProjectFilter([]);
    setStateFilter([]);
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
  // anything is narrowed down without having to open the panel. Each
  // selected value across the multi-select filters counts individually.
  const activeFilterCount =
    statusFilter.length +
    internalPriorityFilter.length +
    departmentFilter.length +
    agentFilter.length +
    categoryFilter.length +
    clientFilter.length +
    projectFilter.length +
    stateFilter.length +
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
            <MultiSelectDropdown
              label="All Status"
              options={availableStatuses.map((s) => ({ value: s, label: s }))}
              selected={statusFilter}
              onChange={(values) => setStatusFilter(values as TicketStatus[])}
            />

            <MultiSelectDropdown
              label="All Internal Priority"
              options={availableInternalPriorities.map((p) => ({ value: p as string, label: p as string }))}
              selected={internalPriorityFilter}
              onChange={(values) => setInternalPriorityFilter(values as InternalPriorityLevel[])}
            />

            <MultiSelectDropdown
              label="All Depts"
              options={availableDepartments.map((d) => ({ value: d.id, label: d.name }))}
              selected={departmentFilter}
              onChange={setDepartmentFilter}
            />

            <MultiSelectDropdown
              label="All Categories"
              options={availableCategories.map((c) => ({ value: c.id, label: c.name }))}
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />

            {/* Agent-wise filter - GLOBAL_ADMIN/CXO/HOD only, scoped to the
                department(s) they have access to (and further narrowed to the
                selected department(s), if any). Not shown for AGENT since agents
                are already scoped to just their own tickets. */}
            {userRole !== UserRole.AGENT && (
              <MultiSelectDropdown
                label="All Agents"
                options={availableAgents.map((a) => ({ value: a.id, label: a.name }))}
                selected={agentFilter}
                onChange={setAgentFilter}
              />
            )}

            <MultiSelectDropdown
              label="All Clients"
              options={availableClients.map((c) => ({ value: c as string, label: c as string }))}
              selected={clientFilter}
              onChange={setClientFilter}
            />

            <MultiSelectDropdown
              label="All Projects"
              options={availableProjects.map((p) => ({ value: p.id, label: p.name }))}
              selected={projectFilter}
              onChange={setProjectFilter}
            />

            <MultiSelectDropdown
              label="All States"
              options={availableStates.map((s) => ({ value: s as string, label: s as string }))}
              selected={stateFilter}
              onChange={setStateFilter}
            />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={slaBreachedFilter} onChange={(e) => setSlaBreachedFilter(e.target.checked)} className="rounded" />
              <span>SLA Breached</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Custom Date Filter</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-xl" />
                <span className="text-slate-400 text-xs text-center sm:text-left shrink-0">to</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date of Occurrence</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input type="date" value={occurredFrom} onChange={(e) => setOccurredFrom(e.target.value)} className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-xl" />
                <span className="text-slate-400 text-xs text-center sm:text-left shrink-0">to</span>
                <input type="date" value={occurredTo} onChange={(e) => setOccurredTo(e.target.value)} className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={exportToExcel}
                disabled={filteredTickets.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                <FileSpreadsheet size={15} />
                Export to Excel ({filteredTickets.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
