import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/authClient";

interface HomePageProps {
  userName: string;
}

export default function HomePage({ userName }: HomePageProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">MyHelpdesk</span>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hello, <span className="font-medium text-gray-900">{userName}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="p-8">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        <p className="mt-2 text-sm text-gray-500">Welcome back, {userName}!</p>
      </main>
    </div>
  );
}
