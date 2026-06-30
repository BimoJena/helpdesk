import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, describe, it, expect } from "vitest";
import axios from "axios";
import UsersPage from "../pages/UsersPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// vi.hoisted ensures mockApi is available when vi.mock factories run
const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), delete: vi.fn() },
}));

vi.mock("../lib/authClient", () => ({
  authClient: {
    useSession: vi.fn(),
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

import { authClient } from "../lib/authClient";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_SESSION = {
  user: { id: "user-1", name: "Alice Admin", email: "alice@example.com", role: "admin" },
};

const MOCK_USERS = [
  { id: "user-1", name: "Alice Admin", email: "alice@example.com", role: "admin", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "user-2", name: "Bob Agent",   email: "bob@example.com",   role: "agent", createdAt: "2024-02-01T00:00:00.000Z" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Returns the <tbody> of the user table to scope queries away from the nav
function getTbody() {
  return screen.getAllByRole("rowgroup")[1];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  (authClient.useSession as ReturnType<typeof vi.fn>).mockReturnValue({ data: ADMIN_SESSION });
});

describe("UsersPage", () => {
  describe("loading state", () => {
    it("renders skeleton rows while fetching", () => {
      mockApi.get.mockReturnValue(new Promise(() => {})); // never resolves

      renderPage();

      expect(screen.queryByText("Bob Agent")).not.toBeInTheDocument();
      expect(screen.queryByText("No users found.")).not.toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: MOCK_USERS });
    });

    it("renders all users after loading", async () => {
      renderPage();

      await waitFor(() => expect(screen.getByText("Bob Agent")).toBeInTheDocument());

      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("shows the correct user count", async () => {
      renderPage();

      await waitFor(() => expect(screen.getByText("2 users")).toBeInTheDocument());
    });

    it("displays role badges for each user", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Bob Agent"));

      const tbody = getTbody();
      expect(within(tbody).getByText("admin")).toBeInTheDocument();
      expect(within(tbody).getByText("agent")).toBeInTheDocument();
    });

    it("shows 'You' badge on the current user's row", async () => {
      renderPage();

      await waitFor(() => expect(screen.getByText("You")).toBeInTheDocument());
    });

    it("disables the delete button for the current user", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Bob Agent"));

      const tbody = getTbody();
      const deleteButtons = within(tbody).getAllByRole("button", { name: "Delete", hidden: true });
      // First row is Alice (self) — disabled; second row is Bob — enabled
      expect(deleteButtons[0]).toBeDisabled();
      expect(deleteButtons[1]).toBeEnabled();
    });

    it("renders 'No users found.' when the list is empty", async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderPage();

      await waitFor(() => expect(screen.getByText("No users found.")).toBeInTheDocument());
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({ data: MOCK_USERS });
      mockApi.delete.mockResolvedValue({});
      vi.spyOn(window, "confirm").mockReturnValue(true);
    });

    it("removes the user row after successful deletion", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Bob Agent"));

      const tbody = getTbody();
      const deleteButtons = within(tbody).getAllByRole("button", { name: "Delete", hidden: true });
      await userEvent.click(deleteButtons[1]); // Bob's button

      await waitFor(() => expect(screen.queryByText("Bob Agent")).not.toBeInTheDocument());
    });

    it("calls the delete endpoint with the correct user id", async () => {
      renderPage();

      await waitFor(() => screen.getByText("Bob Agent"));

      const tbody = getTbody();
      const deleteButtons = within(tbody).getAllByRole("button", { name: "Delete", hidden: true });
      await userEvent.click(deleteButtons[1]);

      await waitFor(() =>
        expect(mockApi.delete).toHaveBeenCalledWith("/api/users/user-2")
      );
    });

    it("does not call delete when confirm is cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      renderPage();

      await waitFor(() => screen.getByText("Bob Agent"));

      const tbody = getTbody();
      const deleteButtons = within(tbody).getAllByRole("button", { name: "Delete", hidden: true });
      await userEvent.click(deleteButtons[1]);

      expect(mockApi.delete).not.toHaveBeenCalled();
      expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows an error message when the fetch fails", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      renderPage();

      await waitFor(() =>
        expect(screen.getByText("Failed to load users. Please try again.")).toBeInTheDocument()
      );
    });

    it("retries the fetch when the Retry button is clicked", async () => {
      mockApi.get
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ data: MOCK_USERS });

      renderPage();

      await waitFor(() => screen.getByRole("button", { name: "Retry" }));
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));

      await waitFor(() => expect(screen.getByText("Bob Agent")).toBeInTheDocument());
    });
  });
});
