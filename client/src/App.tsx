import { Routes, Route, Navigate } from "react-router-dom";
import { authClient } from "./lib/authClient";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UsersPage from "./pages/UsersPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketsPage from "./pages/TicketsPage";

function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          session ? (
            <HomePage userName={session.user.name} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/tickets"
        element={session ? <TicketsPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tickets/:id"
        element={session ? <TicketDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : session.user.role === "admin" ? (
            <UsersPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
