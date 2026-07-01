import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, describe, it, expect } from "vitest";
import axios from "axios";
import TicketsPage from "../pages/TicketsPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn() },
}));

vi.mock("../lib/authClient", () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: { user: { id: "user-1", name: "Alice Admin", email: "alice@example.com", role: "admin" } },
    }),
    signOut: vi.fn(),
  },
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => mockApi),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_TICKETS = [
  {
    id: "t-1",
    subject: "Cannot log in to my account",
    senderEmail: "john.doe@example.com",
    senderName: "John Doe",
    status: "open",
    category: "technical_question",
    createdAt: "2024-06-01T10:00:00.000Z",
  },
  {
    id: "t-2",
    subject: "Request for refund on order #4821",
    senderEmail: "sarah.miller@example.com",
    senderName: "Sarah Miller",
    status: "resolved",
    category: "refund_request",
    createdAt: "2024-05-20T08:00:00.000Z",
  },
  {
    id: "t-3",
    subject: "How do I upgrade my plan?",
    senderEmail: "carlos.ruiz@example.com",
    senderName: null,
    status: "closed",
    category: "general_question",
    createdAt: "2024-05-15T12:00:00.000Z",
  },
  {
    id: "t-4",
    subject: "No category ticket",
    senderEmail: "anon@example.com",
    senderName: null,
    status: "open",
    category: null,
    createdAt: "2024-05-10T09:00:00.000Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TicketsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function getTbody() {
  return screen.getAllByRole("rowgroup")[1];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsPage", () => {
  describe("loading state", () => {
    it("renders skeleton rows while fetching", () => {
      mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves

      renderPage();

      expect(screen.queryByText("Cannot log in to my account")).not.toBeInTheDocument();
      expect(screen.queryByText("No tickets yet.")).not.toBeInTheDocument();
    });

    it("does not show the ticket count while loading", () => {
      mockApi.get.mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(screen.queryByText(/ticket/)).not.toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: MOCK_TICKETS });
    });

    it("renders all ticket subjects after loading", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Cannot log in to my account"));

      expect(screen.getByText("Request for refund on order #4821")).toBeInTheDocument();
      expect(screen.getByText("How do I upgrade my plan?")).toBeInTheDocument();
    });

    it("shows the correct ticket count", async () => {
      renderPage();

      await waitFor(() => expect(screen.getByText("4 tickets")).toBeInTheDocument());
    });

    it("shows singular 'ticket' when there is only one", async () => {
      mockApi.get.mockResolvedValue({ data: [MOCK_TICKETS[0]] });

      renderPage();

      await waitFor(() => expect(screen.getByText("1 ticket")).toBeInTheDocument());
    });

    it("displays sender name when available", async () => {
      renderPage();

      await waitFor(() => screen.getByText("John Doe"));

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("displays sender email as fallback when senderName is null", async () => {
      renderPage();

      await waitFor(() => screen.getByText("carlos.ruiz@example.com"));

      expect(screen.getByText("carlos.ruiz@example.com")).toBeInTheDocument();
    });

    it("shows the sender email below the name when senderName is present", async () => {
      renderPage();

      await waitFor(() => screen.getByText("John Doe"));

      const tbody = getTbody();
      expect(within(tbody).getByText("john.doe@example.com")).toBeInTheDocument();
    });

    it("renders 'No tickets yet.' when the list is empty", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderPage();

      await waitFor(() => expect(screen.getByText("No tickets yet.")).toBeInTheDocument());
    });

    it("shows '0 tickets' count when the list is empty", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderPage();

      await waitFor(() => expect(screen.getByText("0 tickets")).toBeInTheDocument());
    });
  });

  describe("status badges", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: MOCK_TICKETS });
    });

    it("renders 'open' status badge", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Cannot log in to my account"));

      const tbody = getTbody();
      expect(within(tbody).getAllByText("open").length).toBeGreaterThan(0);
    });

    it("renders 'resolved' status badge", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Cannot log in to my account"));

      const tbody = getTbody();
      expect(within(tbody).getByText("resolved")).toBeInTheDocument();
    });

    it("renders 'closed' status badge", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Cannot log in to my account"));

      const tbody = getTbody();
      expect(within(tbody).getByText("closed")).toBeInTheDocument();
    });
  });

  describe("category badges", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: MOCK_TICKETS });
    });

    it("renders 'Technical' label for technical_question", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Technical"));

      expect(screen.getByText("Technical")).toBeInTheDocument();
    });

    it("renders 'Refund' label for refund_request", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Refund"));

      expect(screen.getByText("Refund")).toBeInTheDocument();
    });

    it("renders 'General' label for general_question", async () => {
      renderPage();

      await waitFor(() => screen.getByText("General"));

      expect(screen.getByText("General")).toBeInTheDocument();
    });

    it("renders '—' when category is null", async () => {
      renderPage();

      await waitFor(() => screen.getByText("No category ticket"));

      const tbody = getTbody();
      expect(within(tbody).getByText("—")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows an error message when the fetch fails", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      renderPage();

      await waitFor(() =>
        expect(screen.getByText("Failed to load tickets. Please try again.")).toBeInTheDocument()
      );
    });

    it("retries the fetch when Retry is clicked", async () => {
      mockApi.get
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ data: MOCK_TICKETS });

      renderPage();

      await waitFor(() => screen.getByRole("button", { name: "Retry" }));
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));

      await waitFor(() =>
        expect(screen.getByText("Cannot log in to my account")).toBeInTheDocument()
      );
    });

    it("does not show the ticket count on error", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      renderPage();

      await waitFor(() => screen.getByText("Failed to load tickets. Please try again."));

      expect(screen.queryByText(/^\d+ tickets?$/)).not.toBeInTheDocument();
    });
  });
});
