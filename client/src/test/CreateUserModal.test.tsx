import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CreateUserModal from "../components/CreateUserModal";

function renderModal(props?: Partial<React.ComponentProps<typeof CreateUserModal>>) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <CreateUserModal
      isPending={false}
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />
  );
  return { onSubmit, onClose };
}

async function fillForm(name: string, email: string, password: string) {
  await userEvent.type(screen.getByLabelText("Name"), name);
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

describe("CreateUserModal", () => {
  describe("rendering", () => {
    it("renders all fields and buttons", () => {
      renderModal();

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("shows 'Creating…' and disables the submit button when isPending", () => {
      renderModal({ isPending: true });

      const btn = screen.getByRole("button", { name: "Creating…" });
      expect(btn).toBeDisabled();
    });

    it("password field is masked by default", () => {
      renderModal();

      expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    });
  });

  describe("password visibility toggle", () => {
    it("reveals password when eye icon is clicked", async () => {
      renderModal();

      const toggle = screen.getByRole("button", { name: "" , hidden: true });
      // find the toggle by its position next to the password field
      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");

      // the toggle button is the one that is NOT Cancel or Create
      const allButtons = screen.getAllByRole("button");
      const eyeButton = allButtons.find(
        (b) => b.getAttribute("type") === "button" && b.textContent === ""
      )!;

      await userEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      await userEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("validation", () => {
    it("shows error when name is less than 3 characters", async () => {
      renderModal();

      await fillForm("ab", "test@example.com", "password1");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Minimum 3 characters")).toBeInTheDocument();
    });

    it("shows error when name is only whitespace", async () => {
      renderModal();

      await fillForm("   ", "test@example.com", "password1");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Minimum 3 characters")).toBeInTheDocument();
    });

    it("shows error when email has no @", async () => {
      renderModal();

      await userEvent.type(screen.getByLabelText("Name"), "Alice");
      // type directly into the input bypassing browser email validation
      await userEvent.type(screen.getByLabelText("Email"), "notanemail");
      await userEvent.type(screen.getByLabelText("Password"), "password1");
      // clear and re-type to ensure value is set (jsdom blocks invalid email on type="email")
      const emailInput = screen.getByLabelText("Email");
      await userEvent.clear(emailInput);
      Object.defineProperty(emailInput, "value", { writable: true, value: "notanemail" });
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Valid email required")).toBeInTheDocument();
    });

    it("shows error when password is less than 8 characters", async () => {
      renderModal();

      await fillForm("Alice", "alice@example.com", "short");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Minimum 8 characters, no spaces allowed")).toBeInTheDocument();
    });

    it("shows error when password contains spaces", async () => {
      renderModal();

      await fillForm("Alice", "alice@example.com", "pass word1");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Minimum 8 characters, no spaces allowed")).toBeInTheDocument();
    });

    it("shows error when password is only whitespace", async () => {
      renderModal();

      await fillForm("Alice", "alice@example.com", "        ");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.getByText("Minimum 8 characters, no spaces allowed")).toBeInTheDocument();
    });

    it("does not call onSubmit when validation fails", async () => {
      const { onSubmit } = renderModal();

      await fillForm("ab", "notanemail", "short");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls onSubmit with trimmed name, email and password", async () => {
      const { onSubmit } = renderModal();

      await fillForm("  Alice  ", "alice@example.com", "securepass");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        password: "securepass",
      });
    });

    it("does not show validation errors on valid submission", async () => {
      renderModal();

      await fillForm("Alice", "alice@example.com", "securepass");
      await userEvent.click(screen.getByRole("button", { name: "Create" }));

      expect(screen.queryByText("Minimum 3 characters")).not.toBeInTheDocument();
      expect(screen.queryByText("Valid email required")).not.toBeInTheDocument();
      expect(screen.queryByText("Minimum 8 characters, no spaces allowed")).not.toBeInTheDocument();
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
});
