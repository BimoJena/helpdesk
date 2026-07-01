import axios from "axios";
import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

interface TicketsResponse {
  data: Ticket[];
  total: number;
}

const PAGE_SIZE = 10;

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

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="font-medium text-gray-900"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("senderEmail", {
    header: "From",
    cell: (info) => {
      const { senderName, senderEmail } = info.row.original;
      return (
        <div className="text-gray-600">
          <div>{senderName ?? senderEmail}</div>
          {senderName && <div className="text-xs text-gray-400">{senderEmail}</div>}
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[info.getValue()]}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => {
      const cat = info.getValue();
      return cat ? (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
          {CATEGORY_LABELS[cat]}
        </span>
      ) : (
        <span className="text-gray-400 text-xs">—</span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Received",
    cell: (info) =>
      new Date(info.getValue()).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
  }),
];

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const handleStatus = (value: string) => { setStatus(value); setPage(0); };
  const handleCategory = (value: string) => { setCategory(value); setPage(0); };
  const handleSorting: typeof setSorting = (updater) => { setSorting(updater); setPage(0); };

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc === false ? "asc" : "desc";

  const { data: response, isLoading, isFetching, isError, refetch } = useQuery<TicketsResponse>({
    queryKey: ["tickets", sortBy, sortDir, debouncedSearch, status, category, page],
    queryFn: () =>
      api.get<TicketsResponse>("/api/tickets", {
        params: {
          sortBy,
          sortDir,
          page,
          pageSize: PAGE_SIZE,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(status && { status }),
          ...(category && { category }),
        },
      }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const tickets = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);



  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: handleSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <span className="text-sm text-gray-500">
          {!isLoading && !isError && `${total} ticket${total !== 1 ? "s" : ""}`}
          {isFetching && !isLoading && <span className="ml-2 text-xs text-gray-400">Updating...</span>}
        </span>
      </div>

      {isError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Failed to load tickets. Please try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search subject or sender..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={category}
          onChange={(e) => handleCategory(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <option value="">All categories</option>
          <option value="general_question">General</option>
          <option value="technical_question">Technical</option>
          <option value="refund_request">Refund</option>
        </select>

      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {table.getFlatHeaders().map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="text-left px-6 py-3 font-medium text-gray-600 select-none"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : sorted === "desc" ? (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </span>
                  </th>
                );
              })}
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
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && !isError && pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} tickets</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>Page {page + 1} of {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
