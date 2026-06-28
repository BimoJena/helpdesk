import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8">
            <h1 className="text-2xl font-bold">MyHelpdesk</h1>
            {status && (
              <p className="mt-2 text-sm">
                Server status:{" "}
                <span className={status === "ok" ? "text-green-600" : "text-red-600"}>
                  {status}
                </span>
              </p>
            )}
          </div>
        }
      />
    </Routes>
  );
}

export default App;
