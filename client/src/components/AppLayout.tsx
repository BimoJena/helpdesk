import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/authClient";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  const isAdmin = session?.user.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900">MyHelpdesk</span>
          {isAdmin && (
            <Link
              to="/users"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Users
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hello,{" "}
            <span className="font-medium text-gray-900">
              {session?.user.name}
            </span>
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="p-8">{children}</main>
    </div>
  );
}
