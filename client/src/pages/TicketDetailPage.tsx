import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { Skeleton } from "../components/ui/skeleton";
import { $Enums } from "../../../server/generated/prisma";

interface TicketDetail {
  id: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string | null;
  status: $Enums.TicketStatus;
  category: $Enums.TicketCategory | null;
  createdAt: string;
  updatedAt: string;
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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: () => api.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
  });

  const fmt = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate("/tickets")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </button>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">Failed to load ticket.</p>
          </div>
        )}

        {ticket && (
          <div className="space-y-6">
            {/* Title + badges */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ticket.status]}`}>
                  {ticket.status}
                </span>
                {ticket.category && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                    {CATEGORY_LABELS[ticket.category]}
                  </span>
                )}
              </div>
            </div>

            {/* Meta rows */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              <div className="grid grid-cols-2 px-6 py-3 gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-gray-400 shrink-0">From</p>
                  <p className="text-gray-700">{ticket.senderName ? `${ticket.senderName} (${ticket.senderEmail})` : ticket.senderEmail}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-gray-400 shrink-0">Assigned to</p>
                  <p className="text-gray-500">—</p>
                </div>
              </div>
              <div className="grid grid-cols-2 px-6 py-3 gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-gray-400 shrink-0">Created at</p>
                  <p className="text-gray-700">{fmt(ticket.createdAt)}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-gray-400 shrink-0">Updated at</p>
                  <p className="text-gray-700">{fmt(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Message body */}
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
              <p className="text-xs text-gray-400 mb-3">Message</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
