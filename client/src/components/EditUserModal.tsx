import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  user: User;
  isPending: boolean;
  onSubmit: (data: { name: string; email: string; password: string }) => void;
  onClose: () => void;
}

export default function EditUserModal({ user, isPending, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm({ name: user.name, email: user.email, password: "" });
    setErrors({});
  }, [user]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Partial<typeof form> = {};
    if (form.name.trim().length < 3) newErrors.name = "Minimum 3 characters";
    if (!form.email.includes("@")) newErrors.email = "Valid email required";
    if (form.password !== "" && (form.password.includes(" ") || form.password.trim().length < 8))
      newErrors.password = "Minimum 8 characters, no spaces allowed";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    onSubmit({ name: form.name.trim(), email: form.email, password: form.password });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="edit-password">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></Label>
            <div className="relative">
              <Input id="edit-password" type={showPassword ? "text" : "password"} value={form.password} placeholder="••••••••" onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
