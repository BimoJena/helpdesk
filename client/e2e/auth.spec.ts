import { test, expect } from "@playwright/test";

// Credentials come from server/.env.test (seeded in global-setup)
const ADMIN = { email: "admin@example.com", password: "password123", name: "Admin" };
const AGENT = { email: "agent@example.com", password: "password123", name: "Agent" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function loginAs(page: import("@playwright/test").Page, user: typeof ADMIN | typeof AGENT) {
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/");
}

// ---------------------------------------------------------------------------
// 1. Login page – rendering
// ---------------------------------------------------------------------------

test.describe("Login page – rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows the application name and sign-in heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "MyHelpdesk" })).toBeVisible();
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });

  test("renders email and password fields", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("renders the submit button in an enabled state", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("password field masks input", async ({ page }) => {
    await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  });

  test("email field has correct placeholder", async ({ page }) => {
    await expect(page.getByLabel("Email")).toHaveAttribute("placeholder", "you@example.com");
  });
});

// ---------------------------------------------------------------------------
// 2. Client-side validation
// ---------------------------------------------------------------------------

test.describe("Client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows required error when email is left blank and field is blurred", async ({ page }) => {
    await page.getByLabel("Email").click();
    await page.getByLabel("Password").click(); // trigger onTouched for email
    await expect(page.getByText("Email is required")).toBeVisible();
  });

  test("shows required error when password is left blank and field is blurred", async ({ page }) => {
    await page.getByLabel("Password").click();
    await page.getByLabel("Email").click(); // trigger onTouched for password
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("shows invalid-email error for a malformed email address", async ({ page }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("shows both required errors when form is submitted empty", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("clears email validation error once a valid email is typed", async ({ page }) => {
    await page.getByLabel("Email").fill("bad");
    await page.getByLabel("Password").click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();

    await page.getByLabel("Email").fill("valid@example.com");
    await page.getByLabel("Password").click();
    await expect(page.getByText("Enter a valid email")).not.toBeVisible();
  });

  test("does not call the server when client-side validation fails", async ({ page }) => {
    // The beforeEach already navigated to /login. Wait for the session-check
    // response to finish, then watch exclusively for sign-in requests.
    await page.waitForLoadState("networkidle");

    let signInCalled = false;
    page.on("request", (req) => {
      if (req.url().includes("/sign-in/email")) signInCalled = true;
    });

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email is required")).toBeVisible();
    expect(signInCalled).toBe(false);
  });

  test("submit button shows loading state while request is in flight", async ({ page }) => {
    // Slow down the auth network request so we can observe the loading text
    await page.route("**/api/auth/**", async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    });

    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("button", { name: "Signing in…" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Successful authentication
// ---------------------------------------------------------------------------

test.describe("Successful authentication", () => {
  test("admin can sign in and lands on the dashboard", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("agent can sign in and lands on the dashboard", async ({ page }) => {
    await loginAs(page, AGENT);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("dashboard shows a personalised welcome message for admin", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByText(`Welcome back, ${ADMIN.name}!`)).toBeVisible();
  });

  test("dashboard shows a personalised welcome message for agent", async ({ page }) => {
    await loginAs(page, AGENT);
    await expect(page.getByText(`Welcome back, ${AGENT.name}!`)).toBeVisible();
  });

  test("navbar displays the logged-in user's name", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByText(ADMIN.name, { exact: true })).toBeVisible();
  });

  test("no server error banner is shown after a successful sign-in", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByRole("paragraph").filter({ hasText: /Invalid|incorrect/i })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Failed authentication
// ---------------------------------------------------------------------------

test.describe("Failed authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows an error banner for a wrong password", async ({ page }) => {
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("server-error")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("shows an error banner for a non-existent email", async ({ page }) => {
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("server-error")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("re-enables the submit button after a failed attempt", async ({ page }) => {
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByTestId("server-error")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("server error banner is cleared when a new submission is made", async ({ page }) => {
    // First: bad credentials
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("server-error")).toBeVisible();

    // Second: correct credentials
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("server-error")).not.toBeVisible();
  });

  test("stays on /login after a failed attempt", async ({ page }) => {
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("badpass");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// 5. Route protection – unauthenticated access
// ---------------------------------------------------------------------------

test.describe("Route protection – unauthenticated", () => {
  test("visiting / redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("visiting /users redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });

  test("visiting an unknown route redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// 6. Route protection – authenticated redirect away from /login
// ---------------------------------------------------------------------------

test.describe("Route protection – already authenticated", () => {
  test("authenticated admin visiting /login is redirected to /", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("authenticated agent visiting /login is redirected to /", async ({ page }) => {
    await loginAs(page, AGENT);
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// 7. Role-based access control
// ---------------------------------------------------------------------------

test.describe("Role-based access control", () => {
  test("admin can navigate to /users via the nav link", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("admin sees the Users nav link", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("agent does NOT see the Users nav link", async ({ page }) => {
    await loginAs(page, AGENT);
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  });

  test("agent visiting /users directly is redirected to /", async ({ page }) => {
    await loginAs(page, AGENT);
    await page.goto("/users");
    await expect(page).toHaveURL("/");
  });

  test("admin visiting /users directly lands on the Users page", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Sign out
// ---------------------------------------------------------------------------

test.describe("Sign out", () => {
  test("sign-out button is visible when authenticated", async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("clicking Sign out redirects to /login", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("after sign out, visiting / redirects back to /login", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("after sign out, visiting /users redirects to /login", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });

  test("after sign out, the login page is fully accessible again", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  test("agent can also sign out successfully", async ({ page }) => {
    await loginAs(page, AGENT);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// 9. Session persistence
// ---------------------------------------------------------------------------

test.describe("Session persistence", () => {
  test("reloading the page keeps the user authenticated", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.reload();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("navigating back after sign-in keeps the session active", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goBack();
    // The browser may go back to /login, but the app should immediately redirect
    await expect(page).toHaveURL("/");
  });
});
