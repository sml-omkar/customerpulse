import { FileText, Building2, MapPin, Layers, Clock } from "lucide-react"
import { useState } from "react";
import API_BASE from "../lib/api";
import { Department, TicketCategory, Client, PAGES, SubDepartment } from "../types";
import AttachmentUploader from "./AttachmentUploader";
import { uploadAttachmentToS3 } from "../libs/attachmentUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const UNION_TERRITORIES: { value: string; label: string }[] = [
  { value: "Andaman and Nicobar Islands", label: "Andaman & Nicobar Islands" },
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra & Nagar Haveli & Daman & Diu" },
  { value: "Delhi", label: "Delhi" },
  { value: "Jammu and Kashmir", label: "Jammu & Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Lakshadweep", label: "Lakshadweep" },
  { value: "Puducherry", label: "Puducherry" },
];

const DESIGNATIONS = ["CEO", "COO", "CXO", "HOD", "EMPLOYEE"];

// Section heading used to separate the form into the field groups the
// person fills in, in order: client details -> location -> routing ->
// issue details -> attachments.
const SectionHeading = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-2 mb-1">
    <Icon size={14} className="text-indigo-600 shrink-0" />
    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
    {subtitle && <span className="text-[11px] text-slate-400 font-normal normal-case">- {subtitle}</span>}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-700 mb-1">{children}</label>
);

const textInputClass =
  "w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

export const TicketForm = ({setError,setSuccess,setSelectedTicketId,setCurrentView,token,departments,clients}:{
    setError:React.Dispatch<React.SetStateAction<string>>,
    setSuccess:React.Dispatch<React.SetStateAction<string>>,
    setSelectedTicketId:React.Dispatch<React.SetStateAction<string>>,
    setCurrentView:React.Dispatch<React.SetStateAction<string>>,
    token:string,
    departments:Department[],
    clients:Client[]
}) => {
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketDept, setNewTicketDept] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("");
  const [newTicketClient, setNewTicketClient] = useState("");
  const [newTicketClientEmail, setNewTicketClientEmail] = useState("");
  const [newTicketClientRep, setNewTicketClientRep] = useState("");
  const [newTicketClientEmpId, setNewTicketClientEmpId] = useState("");
  const [newTicketSite, setNewTicketSite] = useState("");
  const [newTicketState, setNewTicketState] = useState("");
  const [newTicketDesignation, setNewTicketDesignation] = useState("");
  const [newTicketProjectId, setNewTicketProjectId] = useState("");
  const [newTicketDateOccurred, setNewTicketDateOccurred] = useState("");
  const [newTicketTags, setNewTicketTags] = useState<string>("");
  const [newTicketAttachFiles, setNewTicketAttachFiles] = useState<File[]>([]);
  const [attachmentUploadError, setAttachmentUploadError] = useState("");
  const [deptCategories, setDeptCategories] = useState<TicketCategory[]>([]);
  const [deptSubDepartments, setDeptSubDepartments] = useState<SubDepartment[]>([]);
  const [newTicketSubDepartment, setNewTicketSubDepartment] = useState("");



// Handles department select when submitting ticket to trigger category
// (and sub-department) fetching. Sub-department is optional: until the
// user picks one, the category dropdown lists every category under the
// department.
  const handleTicketDeptChange = async (deptId: string) => {
    setNewTicketDept(deptId);
    setNewTicketCategory("");
    setNewTicketSubDepartment("");
    if (!deptId || deptId === "OTHER") {
      setDeptCategories([]);
      setDeptSubDepartments([]);
      return;
    }
    try {
      const [catRes, subDeptRes] = await Promise.all([
        fetch(`${API_BASE}/departments/${deptId}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/departments/${deptId}/subdepartments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (catRes.ok) setDeptCategories(await catRes.json());
      if (subDeptRes.ok) setDeptSubDepartments(await subDeptRes.json());
    } catch (err) {}
  };

  // Handles sub-department select - re-fetches categories scoped to just
  // that sub-department. Clearing the sub-department (back to "-- All --")
  // goes back to showing every category in the department.
  const handleTicketSubDepartmentChange = async (subDepartmentId: string) => {
    setNewTicketSubDepartment(subDepartmentId);
    setNewTicketCategory("");
    if (!newTicketDept || newTicketDept === "OTHER") return;
    try {
      const url = subDepartmentId
        ? `${API_BASE}/departments/${newTicketDept}/categories?subDepartmentId=${subDepartmentId}`
        : `${API_BASE}/departments/${newTicketDept}/categories`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDeptCategories(await res.json());
    } catch (err) {}
  };



    const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newTicketDept || !newTicketTitle || !newTicketClient || !newTicketClientEmail || !newTicketSite || !newTicketState || !newTicketDesignation || !newTicketDateOccurred) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentId: newTicketDept === "OTHER" ? "dept-other" : newTicketDept,
          departmentName: newTicketDept === "OTHER" ? "Other" : undefined,
          categoryId: newTicketCategory === "OTHER" ? "cat-other" : (newTicketCategory || null),
          categoryName: newTicketCategory === "OTHER" ? "Other" : undefined,
          title: newTicketTitle,
          description: newTicketDesc,
          clientName: newTicketClient,
          clientEmail: newTicketClientEmail,
          representative: newTicketClientRep,
          employeeId: newTicketClientEmpId ,
          dateOfOccurance: new Date(newTicketDateOccurred).toISOString(),
          site: newTicketSite,
          state: newTicketState,
          designation: newTicketDesignation,
          projectId: newTicketProjectId || undefined,
          tags: [] 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");

      // Upload any staged attachments straight to S3 now that the ticket has an id
      if (newTicketAttachFiles.length > 0) {
        setAttachmentUploadError("");
        const results = await Promise.allSettled(
          newTicketAttachFiles.map((file) => uploadAttachmentToS3(file, data.id, token))
        );
        const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        if (failed.length > 0) {
          setAttachmentUploadError(
            `Ticket ${data.ticketNumber || data.id} was created, but ${failed.length} attachment(s) failed to upload. You can add them from the ticket detail page.`
          );
        }
      }

      // Reset
      setNewTicketTitle("");
      setNewTicketDesc("");
      setNewTicketDept("");
      setNewTicketCategory("");
      setNewTicketSubDepartment("");
      setDeptSubDepartments([]);
      setNewTicketClient("");
      setNewTicketClientEmail("");
      setNewTicketClientRep("");
      setNewTicketClientEmpId("");
      setNewTicketSite("");
      setNewTicketState("");
      setNewTicketDesignation("");
      setNewTicketProjectId("");
      setNewTicketDateOccurred("");
      setNewTicketTags("");
      setNewTicketAttachFiles([]);

      // Navigate to detailed ticket view directly
      setSelectedTicketId(data.id);
      setCurrentView(PAGES.TICKET_DETAILS);
    } catch (err: any) {
      setError(err.message);
    }
  };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 font-sans">
              <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-xs">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="text-indigo-600 shrink-0" size={20} />
                  New Customer Pulse Ticket
                </h1>
                <p className="text-xs text-slate-500 mt-2">
                  Complete corporate details. Priority assignments are computed automatically on routing based on client account definitions and service parameters.
                </p>
              </div>

              <form
                onSubmit={handleSubmitTicket}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7 shadow-sm"
              >
                {/* ---------------- 1. Client details ---------------- */}
                <div className="space-y-4">
                  <SectionHeading icon={Building2} title="Client Details" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <div>
                      <FieldLabel>Client Business/Company *</FieldLabel>
                      <Select
                        value={newTicketClient}
                        onValueChange={(value) => {
                          setNewTicketClient(value);
                          setNewTicketProjectId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Choose Client --" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(clients) && clients.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FieldLabel>Project</FieldLabel>
                      <Select
                        value={newTicketProjectId}
                        onValueChange={setNewTicketProjectId}
                        disabled={!newTicketClient}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Choose Project --" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(clients) && clients
                            .find(c => c.name === newTicketClient)?.projects?.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}{p.isShutdownJob ? " (Shutdown Job)" : ""}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FieldLabel>Client Authorized Email *</FieldLabel>
                      <input
                        type="email"
                        placeholder="authorized@client.com"
                        value={newTicketClientEmail}
                        onChange={(e) => setNewTicketClientEmail(e.target.value)}
                        className={textInputClass}
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel>Client Designation *</FieldLabel>
                      <Select value={newTicketDesignation} onValueChange={setNewTicketDesignation}>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Choose Designation --" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGNATIONS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ---------------- 2. Site & state ---------------- */}
                <div className="border-t border-slate-100 pt-5 sm:pt-6 space-y-4">
                  <SectionHeading icon={MapPin} title="Location" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <FieldLabel>Site / Physical location</FieldLabel>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newTicketSite}
                        onChange={(e) => setNewTicketSite(e.target.value)}
                        className={textInputClass}
                      />
                    </div>

                    <div>
                      <FieldLabel>State *</FieldLabel>
                      <Select value={newTicketState} onValueChange={setNewTicketState}>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Choose Indian State --" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                          {UNION_TERRITORIES.map((ut) => (
                            <SelectItem key={ut.value} value={ut.value}>{ut.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ---------------- 3. Department / sub-department / category ---------------- */}
                <div className="border-t border-slate-100 pt-5 sm:pt-6 space-y-4">
                  <SectionHeading icon={Layers} title="Routing" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div>
                      <FieldLabel>Department *</FieldLabel>
                      <Select value={newTicketDept} onValueChange={handleTicketDeptChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Department --" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newTicketDept && newTicketDept !== "OTHER" && deptSubDepartments.length > 0 && (
                      <div>
                        <FieldLabel>Sub-Department</FieldLabel>
                        <Select value={newTicketSubDepartment} onValueChange={handleTicketSubDepartmentChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="-- All / Not applicable --" />
                          </SelectTrigger>
                          <SelectContent>
                            {deptSubDepartments.map(sd => (
                              <SelectItem key={sd.id} value={sd.id}>{sd.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <FieldLabel>Ticket Category</FieldLabel>
                      <Select
                        value={newTicketCategory}
                        onValueChange={setNewTicketCategory}
                        disabled={!newTicketDept}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select Category --" />
                        </SelectTrigger>
                        <SelectContent>
                          {deptCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                          {newTicketDept && <SelectItem value="OTHER">Other</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ---------------- 4. Issue occurred ---------------- */}
                <div className="border-t border-slate-100 pt-5 sm:pt-6 space-y-4">
                  <SectionHeading icon={Clock} title="Issue Details" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <FieldLabel>Issue Occurred (Date & Time) *</FieldLabel>
                      <input
                        type="datetime-local"
                        value={newTicketDateOccurred}
                        onChange={(e) => setNewTicketDateOccurred(e.target.value)}
                        className={textInputClass}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Ticket Subject / Title *</FieldLabel>
                    <input
                      type="text"
                      placeholder="Short summary of the outage or issue"
                      value={newTicketTitle}
                      onChange={(e) => setNewTicketTitle(e.target.value)}
                      className={`${textInputClass} font-semibold`}
                      required
                    />
                  </div>

                  <div>
                    <FieldLabel>Detailed Outage Narrative / Description</FieldLabel>
                    <textarea
                      placeholder="Provide troubleshooting details, steps to reproduce, or notes."
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      className={textInputClass}
                      rows={4}
                    />
                  </div>
                </div>

                {/* ---------------- 5. Attachments ---------------- */}
                <div className="border-t border-slate-100 pt-5 sm:pt-6">
                  <FieldLabel>Attachments (Optional)</FieldLabel>
                  <AttachmentUploader
                    token={token}
                    stagedFiles={newTicketAttachFiles}
                    onStagedFilesChange={setNewTicketAttachFiles}
                  />
                  {attachmentUploadError && (
                    <p className="mt-2 text-[11px] text-amber-600">{attachmentUploadError}</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentView(PAGES.DASHBOARD)}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Create and File Ticket
                  </button>
                </div>
              </form>
            </div>
    )
}
