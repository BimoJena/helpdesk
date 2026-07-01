import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import EditUserModal from "../components/EditUserModal";

const MOCK_USER = { id: "user-1", name: "Alice", email: "alice@example.com" };

function renderModal(props?: Partial<React.ComponentProps<typeof EditUserModal>>) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <EditUserModal
      user={MOCK_USER}
      isPending={false}
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />
  );
  return { onSubmit, onClose };
}

describe("EditUserModal", () => {
  describe("rendering", () => {
    it("renders all fields and buttons", () => {
      renderModal();

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText(/New Password/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("pre-populates name and email from the user prop", () => {
      renderModal();

      expect(screen.getByLabelText("Name")).toHaveValue("Alice");
      expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
    });

    it("password field is empty by default", () => {
      renderModal();

      expect(screen.getByLabelText(/New Password/)).toHaveValue("");
    });

    it("password field is masked by default", () => {
      renderModal();

      expect(screen.getByLabelText(/New Password/)).toHaveAttribute("type", "password");
    });

    it("shows 'Saving…' and disables submit when isPending", () => {
      renderModal({ isPending: true });

      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });
  });

  describe("password visibility toggle", () => {
    it("reveals and hides password when eye icon is clicked", async () => {
      renderModal();

      const passwordInput = screen.getByLabelText(/New Password/);
      const allButtons = screen.getAllByRole("button");
      const eyeButton = allButtons.find((b) => b.getAttribute("type") === "button" && b.textContent === "")!;

      await userEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      await userEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("validation", () => {
    it("shows error when name is less than 3 characters", async () => {
      renderModal();

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "ab");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByText("Minimum 3 characters")).toBeInTheDocument();
    });

    it("shows error when name is only whitespace", async () => {
      renderModal();

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "   ");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByText("Minimum 3 characters")).toBeInTheDocument();
    });

    it("shows error when password is provided but less than 8 characters", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText(/New Password/), "short");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByText("Minimum 8 characters, no spaces allowed")).toBeInTheDocument();
    });

    it("shows error when password contains spaces", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText(/New Password/), "pass word1");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByText("Minimum 8 characters, no spaces allowed")).toBeInTheDocument();
    });

    it("does not show password error when password is left blank", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.queryByText("Minimum 8 characters, no spaces allowed")).not.toBeInTheDocument();
    });

    it("does not call onSubmit when validation fails", async () => {
      const { onSubmit } = renderModal();

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "ab");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls onSubmit with trimmed name, email and empty password when no password entered", async () => {
      const { onSubmit } = renderModal();

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        password: "",
      });
    });

    it("calls onSubmit with new password when provided", async () => {
      const { onSubmit } = renderModal();

      await userEvent.type(screen.getByLabelText(/New Password/), "newpassword1");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        password: "newpassword1",
      });
    });

    it("calls onSubmit with updated name", async () => {
      const { onSubmit } = renderModal();

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "  Bob  ");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Bob",
        email: "alice@example.com",
        password: "",
      });
    });
  });

  describe("closing", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const { onClose } = renderModal();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when clicking the backdrop", async () => {
      const { onClose } = renderModal();

      const backdrop = document.querySelector(".fixed.inset-0") as HTMLElement;
      await userEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when Escape is pressed", async () => {
      const { onClose } = renderModal();

      await userEvent.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("re-population", () => {
    it("resets form when user prop changes", () => {
      const { rerender } = render(
        <EditUserModal user={MOCK_USER} isPending={false} onSubmit={vi.fn()} onClose={vi.fn()} />
      );

      const newUser = { id: "user-2", name: "Bob", email: "bob@example.com" };
      rerender(
        <EditUserModal user={newUser} isPending={false} onSubmit={vi.fn()} onClose={vi.fn()} />
      );

      expect(screen.getByLabelText("Name")).toHaveValue("Bob");
      expect(screen.getByLabelText("Email")).toHaveValue("bob@example.com");
      expect(screen.getByLabelText(/New Password/)).toHaveValue("");
    });
  });
});
