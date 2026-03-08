import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { User } from '@/auth/types';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    const allUsers = await userService.listUsers();
    setUsers(allUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const setStatus = async (userId: string, status: User['status']) => {
    await userService.setUserStatus(userId, status);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">User Management</h1>
            <p className="mt-2 text-sm text-slate-400">Review subscribers and audit admin actions.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">User Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            System-wide user directory. Subscriber onboarding and approvals are handled in Subscriber Management.
          </p>
          <button
            onClick={() => navigate('/admin/subscribers')}
            className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500"
          >
            Go to Subscriber Management
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">All Users</h2>
          <div className="mt-6 space-y-4">
            {users.map(user => (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.companyName || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{user.role} · {user.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'subscriber' && (
                      <button
                        onClick={() => setStatus(user.id, user.status === 'suspended' ? 'active' : 'suspended')}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                      >
                        {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </div>
                {user.role === 'subscriber' && (
                  <div className="mt-4 text-xs text-slate-500">
                    Country access is managed in Subscriber Management after approval.
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminUsersPage;
