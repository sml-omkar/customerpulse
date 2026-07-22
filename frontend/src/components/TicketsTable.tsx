import type React from "react";
import { PAGES, type Ticket } from "../types";

type TicketsTableProps = {
    tickets: Ticket[];
    currentView : string,
    setSelectedTicketId: React.Dispatch<React.SetStateAction<string>>;
    setCurrentView: React.Dispatch<React.SetStateAction<string>>;
};

const statusColors: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-purple-50 text-purple-700 border-purple-200",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

const priorityColors: Record<string, string> = {
    P1: "bg-red-50 text-red-700 border-red-200",
    P2: "bg-orange-50 text-orange-700 border-orange-200",
    P3: "bg-blue-50 text-blue-700 border-blue-200",
    P4: "bg-slate-100 text-slate-700 border-slate-200",
};

// Personal, pre-filtered ticket lists reached from the Dashboard cards.
// SLA is not shown for these — only for the full/report ticket lists
// (Breached Tickets, and the Global/CXO/HOD/Agent ticket search views).
const VIEWS_WITHOUT_SLA = [
    PAGES.MY_TICKETS,
    PAGES.ASSINGED_TICKETS,
    PAGES.RESOLVED_TICKETS,
    PAGES.ON_HOLD,
];

export default function TicketsTable({
    tickets,
    currentView,
    setSelectedTicketId,
    setCurrentView,
}: TicketsTableProps) {
    const openTicket = (ticketId: string) => {
        setSelectedTicketId(ticketId);
        setCurrentView(PAGES.TICKET_DETAILS);
    };

   const getSlaStatus = (ticket:Ticket) => {
    if (!ticket || !ticket.slaDeadline) return null;
    if (ticket.slaBreached) {
      return { text: "Breached", color: "text-red-700 bg-red-100 border-red-300" };
    }
    const diff = new Date(ticket.slaDeadline).getTime() - Date.now();
    if (diff <= 0) {
      return { text: "Breached", color: "text-red-700 bg-red-100 border-red-300" };
    }

    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));

    if (hours < 2) {
      return { text: `${hours}h ${mins}m left`, color: "text-orange-700 bg-orange-100 border-orange-300 animate-pulse" };
    }
    return { text: `${hours}h ${mins}m left`, color: "text-zinc-700 bg-zinc-100 border-zinc-300" };
  };

    if (!tickets?.length) {
        return (
            <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
                No tickets found.
            </div>
        );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Department
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Priority
                </th>
                {currentView != PAGES.ASSINGED_TICKETS && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Assignee
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Date of Issue
                </th>

                {!VIEWS_WITHOUT_SLA.includes(currentView) && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                    SLA
                  </th>
                )}

                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{ticket.ticketNumber}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate font-medium">
                      {ticket.department?.name}
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                        statusColors[ticket.status] ?? statusColors.CLOSED
                      }`}
                    >
                      {ticket.status.replaceAll("_", " ")}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded border px-2 py-1 text-xs font-bold ${
                        priorityColors[ticket.priority] ?? priorityColors.P4
                      }`}
                    >
                      {ticket.internalPriority}
                    </span>
                  </td>


                  {currentView != PAGES.ASSINGED_TICKETS && (
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                      {ticket.assignee?.fullName ?? (
                        <span className="italic text-slate-400">
                          Unassigned
                        </span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>

                  {!VIEWS_WITHOUT_SLA.includes(currentView) && (
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {getSlaStatus(ticket)?.text}
                    </td>
                  )}

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openTicket(ticket.id)}
                      className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-700"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
}
