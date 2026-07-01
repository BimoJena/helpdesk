import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "../components/ui/skeleton";
import AppLayout from "../components/AppLayout";
import { Button } from "../components/ui/button";
import { authClient } from "../lib/authClient";
import CreateUserModal from "../components/CreateUserModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

export default function UsersPage() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [popup, setPopup] = useState<string | null>(null);

  const { data: users = [], isLoading, isError, refetch } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/api/users").then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => api.post<User>("/api/users", data).then((r) => r.data),
    onSuccess: (user) => {
      queryClient.setQueryData<User[]>(["users"], (prev) => [...(prev ?? []), user]);
      setShowModal(false);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setPopup(message || "Failed to create user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/api/users/${userId}`),
    onSuccess: (_, userId) => {
      queryClient.setQueryData<User[]>(["users"], (prev) =>
        prev?.filter((u) => u.id !== userId)
      );
      setDeleteTarget(null);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setPopup(message || "Failed to delete user");
    },
  });

  function handleDelete(userId: string, userName: string) {
    setDeleteTarget({ id: userId, name: userName } as User);
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? "s" : ""}</span>
          <Button size="sm" onClick={() => setShowModal(true)}>New User</Button>
        </div>
      </div>

      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs text-center">
            <p className="text-sm text-gray-800 mb-6">{popup}</p>
            <Button onClick={() => setPopup(null)}>OK</Button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2">Delete User</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CreateUserModal
          isPending={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowModal(false)}
        />
      )}

      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 flex justify-end"><Skeleton className="h-8 w-16 rounded-md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">Failed to load users. Please try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                [...users].sort((a, b) => {
                if (a.role === b.role) return 0;
                return a.role === "admin" ? -1 : 1;
              }).map((user) => {
                  const isSelf = user.id === session?.user.id;
                  return (
                    <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.name}
                        {isSelf && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isSelf || deleteMutation.isPending}
                          onClick={() => handleDelete(user.id, user.name)}
                        >
                          {deleteMutation.variables === user.id && deleteMutation.isPending
                            ? "Deleting…"
                            : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
