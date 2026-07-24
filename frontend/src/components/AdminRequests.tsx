import React, { useEffect, useState } from "react";
import { Send, MessageSquare, Clock, CheckCircle, Loader2, Megaphone } from "lucide-react";
import API_BASE from "../lib/api";
import { AdminTicket, AdminTicketStatus, User as UserType, UserRole } from "../types";

interface AdminRequestsProps {
  token: string;
  currentUser: UserType;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
}

const STATUS_STYLES: Record<AdminTicketStatus, string> = {
  [AdminTicketStatus.OPEN]: "bg-amber-50 text-amber-700 border-amber-200",
  [AdminTicketStatus.IN_PROGRESS]: "bg-blue-50 text-blue-700 border-blue-200",
  [AdminTicketStatus.RESOLVED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const StatusBadge = ({ status }: { status: AdminTicketStatus }) => (
  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>
    {status.replace("_", " ")}
  </span>
);

// Staff-side: raise a new request + track the ones already raised.
const RaiseRequestView: React.FC<AdminRequestsProps> = ({ token, currentUser, setError, setSuccess }) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<AdminTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMine = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-tickets/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load your requests");
      setMyRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!subject.trim() || !description.trim()) {
      setError("Please fill out both the subject and description.");
      return;
    }
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to raise the request");
      setSubject("");
      setDescription("");
      setSuccess(`Request ${data.ticketNumber} sent to the admin.`);
      setMyRequests((prev) => [data, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={16} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Raise a Request to Admin</h1>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Use this for anything you need from the admin directly - access, approvals, or an internal
          issue - as <strong className="text-slate-900">{currentUser.fullName}</strong> ({currentUser.role}).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="e.g. Need access to the Payroll department queue"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={10000}
              placeholder="Add whatever detail the admin will need to act on this."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer flex items-center gap-2 rounded-lg transition-all shadow-xs"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send to Admin
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Your Requests</h2>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : myRequests.length === 0 ? (
          <p className="text-xs text-slate-400">You haven't raised any requests yet.</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div key={req.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-slate-400">{req.ticketNumber}</p>
                    <p className="text-sm font-semibold text-slate-900">{req.subject}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap">{req.description}</p>
                {req.adminResponse && (
                  <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <MessageSquare size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{req.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Admin-side: review every request raised, respond, and move its status.
const ReviewRequestsView: React.FC<AdminRequestsProps> = ({ token, setError, setSuccess }) => {
  const [requests, setRequests] = useState<AdminTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load requests");
      setRequests(data.items || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (id: string, status: AdminTicketStatus) => {
    setSubmittingId(id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/admin-tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          ...(drafts[id]?.trim() ? { adminResponse: drafts[id].trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update the request");
      setRequests((prev) => prev.map((r) => (r.id === id ? data : r)));
      setSuccess(`Request ${data.ticketNumber} updated.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={16} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Requests From Staff</h1>
        </div>
        <p className="text-sm text-slate-500">
          Internal requests raised directly to you by HODs, CXOs, and Agents.
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-xs text-slate-400 shadow-xs">
          No requests have been raised yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-slate-400">{req.ticketNumber}</p>
                  <p className="text-sm font-semibold text-slate-900">{req.subject}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {req.raisedBy.fullName} · {req.raisedBy.role}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-xs text-slate-600 mt-3 whitespace-pre-wrap">{req.description}</p>

              {req.adminResponse && (
                <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <MessageSquare size={13} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{req.adminResponse}</p>
                </div>
              )}

              {req.status !== AdminTicketStatus.RESOLVED && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={drafts[req.id] || ""}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    rows={2}
                    placeholder="Write a response (optional)..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  />
                  <div className="flex items-center gap-2">
                    {req.status === AdminTicketStatus.OPEN && (
                      <button
                        onClick={() => respond(req.id, AdminTicketStatus.IN_PROGRESS)}
                        disabled={submittingId === req.id}
                        className="text-[11px] font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <Clock size={12} /> Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => respond(req.id, AdminTicketStatus.RESOLVED)}
                      disabled={submittingId === req.id}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-[11px] font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
                    >
                      <CheckCircle size={12} /> Respond & Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminRequests: React.FC<AdminRequestsProps> = (props) => {
  const isGlobalAdmin = props.currentUser.role === UserRole.GLOBAL_ADMIN;
  return isGlobalAdmin ? <ReviewRequestsView {...props} /> : <RaiseRequestView {...props} />;
};

export default AdminRequests;
