import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "../components/ui/skeleton";
import AppLayout from "../components/AppLayout";
import { Button } from "../components/ui/button";
import { authClient } from "../lib/authClient";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";

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
  const [editTarget, setEditTarget] = useState<User | null>(null);
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

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; email: string; password: string } }) =>
      api.patch<User>(`/api/users/${id}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(["users"], (prev) =>
        prev?.map((u) => (u.id === updated.id ? updated : u))
      );
      setEditTarget(null);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setPopup(message || "Failed to update user");
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

      {editTarget && (
        <EditUserModal
          user={editTarget}
          isPending={editMutation.isPending}
          onSubmit={(data) => editMutation.mutate({ id: editTarget.id, data })}
          onClose={() => setEditTarget(null)}
        />
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
                <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 flex gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></td>
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
                <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditTarget(user)}
                            aria-label="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" /></svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf || deleteMutation.isPending}
                            onClick={() => handleDelete(user.id, user.name)}
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deleteMutation.variables === user.id && deleteMutation.isPending
                              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            }
                          </Button>
                        </div>
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
