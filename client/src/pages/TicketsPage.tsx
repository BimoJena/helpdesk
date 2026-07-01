import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "../components/AppLayout";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { $Enums } from "../../../server/generated/prisma";

interface Ticket {
  id: string;
  subject: string;
  senderEmail: string;
  senderName: string | null;
  status: $Enums.TicketStatus;
  category: $Enums.TicketCategory | null;
  createdAt: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

const STATUS_STYLES: Record<$Enums.TicketStatus, string> = {
  ["open" satisfies $Enums.TicketStatus]: "bg-blue-100 text-blue-700",
  ["resolved" satisfies $Enums.TicketStatus]: "bg-green-100 text-green-700",
  ["closed" satisfies $Enums.TicketStatus]: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS: Record<$Enums.TicketCategory, string> = {
  ["general_question" satisfies $Enums.TicketCategory]: "General",
  ["technical_question" satisfies $Enums.TicketCategory]: "Technical",
  ["refund_request" satisfies $Enums.TicketCategory]: "Refund",
};

export default function TicketsPage() {
  const { data: tickets = [], isLoading, isError, refetch } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: () => api.get<Ticket[]>("/api/tickets").then((r) => r.data),
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <span className="text-sm text-gray-500">
          {!isLoading && !isError && `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {isError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Failed to load tickets. Please try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Subject</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">From</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Received</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}

            {!isLoading && !isError && tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No tickets yet.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{ticket.senderName ?? ticket.senderEmail}</div>
                    {ticket.senderName && (
                      <div className="text-xs text-gray-400">{ticket.senderEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.category ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
