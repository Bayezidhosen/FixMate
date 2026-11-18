import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/DashboardLayout.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserProfile, UserRole } from '../../shared/types.ts';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/users', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) setUsers(data.users || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update role.');
        return;
      }
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success(`Updated role to ${role}.`);
    } catch {
      toast.error('Network error updating user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title="Manage Users">
      <div className="bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#101B35] dark:text-white">Registered Accounts</h2>
          <span className="text-xs text-[#68758A] dark:text-slate-400 tabular-nums">
            {users.length} users
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#68758A]">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold text-[#68758A] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  const initials = u.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <SafeImage
                              src={u.image}
                              alt={u.name}
                              className="w-8 h-8 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-md bg-[#101B35] dark:bg-[#3867FF] text-white text-xs font-bold inline-flex items-center justify-center shrink-0">
                              {initials}
                            </span>
                          )}
                          <span className="font-semibold text-[#172033] dark:text-white">
                            {u.name} {isSelf && <span className="text-xs text-[#3867FF]">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[#68758A] dark:text-slate-300">{u.email}</td>
                      <td className="px-6 py-3.5 font-mono text-xs tabular-nums text-[#68758A] dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <select
                          value={u.role}
                          disabled={isSelf || updatingId === u._id}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                          aria-label={`Change role for ${u.name}`}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-xs font-semibold capitalize disabled:opacity-50"
                        >
                          <option value="customer">customer</option>
                          <option value="technician">technician</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
