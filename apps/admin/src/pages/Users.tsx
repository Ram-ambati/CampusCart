import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle } from 'lucide-react';

export default function Users() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('jwt');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const toggleBan = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle ban');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Loading users...</div>;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 mb-8">User Management</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-bold text-slate-700">Real Name</th>
              <th className="p-4 font-bold text-slate-700">Roll No</th>
              <th className="p-4 font-bold text-slate-700">Email</th>
              <th className="p-4 font-bold text-slate-700">Status</th>
              <th className="p-4 font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => {
              const rollNo = user.email.split('@')[0].toUpperCase();
              return (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{user.realName || 'Unknown'}</td>
                  <td className="p-4 text-slate-600 font-mono text-sm">{rollNo}</td>
                  <td className="p-4 text-slate-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      user.banned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {user.banned ? 'BANNED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleBan.mutate(user.id)}
                      disabled={toggleBan.isPending && (toggleBan.variables as unknown as number) === user.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded font-bold text-xs active:scale-95 transition-all disabled:opacity-50 ${
                        user.banned 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {toggleBan.isPending && (toggleBan.variables as unknown as number) === user.id ? (
                        <span>Updating...</span>
                      ) : user.banned ? (
                        <><CheckCircle className="w-3 h-3" /> Unban User</>
                      ) : (
                        <><Ban className="w-3 h-3" /> Ban User</>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
